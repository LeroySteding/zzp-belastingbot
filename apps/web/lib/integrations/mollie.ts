import createMollieClient, { Payment, PaymentStatus } from '@mollie/api-client';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { buildPaymentConfirmationEmail } from '@/lib/email/emails';
import { createNotification } from '@/lib/notifications/actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MolliePaymentInfo {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  /** After matching logic runs */
  matchStatus: 'matched' | 'unmatched' | 'ignored';
  matchedInvoiceId: string | null;
  matchedInvoiceNumber: string | null;
}

export interface SyncResult {
  total: number;
  matched: number;
  unmatched: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Send payment confirmation email
// ---------------------------------------------------------------------------

async function sendPaymentConfirmation(invoiceId: string, userId: string) {
  try {
    const supabase = await createClient();

    // Fetch invoice with client info for the email
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        invoice_number, total, paid_at,
        clients (name, email)
      `)
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (!invoice) return;

    const clientEmail = (invoice.clients as any)?.email;
    const clientName = (invoice.clients as any)?.name || 'klant';
    if (!clientEmail) return;

    const totalFormatted = new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(invoice.total) || 0);

    const paidDate = invoice.paid_at
      ? new Date(invoice.paid_at).toLocaleDateString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

    const { subject, html, text } = buildPaymentConfirmationEmail({
      clientName,
      invoiceNumber: invoice.invoice_number,
      amount: totalFormatted,
      paidDate,
    });

    await sendEmail({
      to: clientEmail,
      subject,
      html,
      text,
      tags: [{ name: 'type', value: 'payment_confirmation' }],
    });
  } catch {
    // Non-fatal: payment was processed, email failed
    console.error('Failed to send payment confirmation email for invoice', invoiceId);
  }
}

// ---------------------------------------------------------------------------
// Client initialisation
// ---------------------------------------------------------------------------

function getMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error('MOLLIE_API_KEY is niet geconfigureerd');
  }
  return createMollieClient({ apiKey });
}

// ---------------------------------------------------------------------------
// Fetch payments from Mollie
// ---------------------------------------------------------------------------

export async function getMolliePayments(sinceDate?: string): Promise<Payment[]> {
  const mollieClient = getMollieClient();

  const allPayments: Payment[] = [];
  let page = await mollieClient.payments.page({ limit: 250 });

  // Mollie returns newest first. Keep paging until we pass sinceDate or run
  // out of pages.
  while (true) {
    for (const payment of page) {
      if (sinceDate && payment.createdAt && payment.createdAt < sinceDate) {
        return allPayments;
      }
      allPayments.push(payment);
    }

    if (!page.nextPageCursor) break;
    page = await mollieClient.payments.page({ limit: 250, from: page.nextPageCursor });
  }

  return allPayments;
}

// ---------------------------------------------------------------------------
// Match a single Mollie payment to an open invoice
// ---------------------------------------------------------------------------

export async function matchPaymentToInvoice(
  payment: Payment,
  userId: string,
): Promise<{ invoiceId: string; invoiceNumber: string } | null> {
  const supabase = await createClient();

  // Only match payments that have actually been paid
  if (payment.status !== PaymentStatus.paid) return null;

  const paymentAmount = parseFloat(payment.amount.value);

  // --- Strategy 1: Match by metadata (invoice_id or invoice_number) --------
  const meta = payment.metadata as Record<string, string> | null;
  if (meta?.invoice_id) {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('id', meta.invoice_id)
      .eq('user_id', userId)
      .in('status', ['verzonden', 'concept'])
      .single();

    if (data) return { invoiceId: data.id, invoiceNumber: data.invoice_number };
  }

  if (meta?.invoice_number) {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('invoice_number', meta.invoice_number)
      .eq('user_id', userId)
      .in('status', ['verzonden', 'concept'])
      .single();

    if (data) return { invoiceId: data.id, invoiceNumber: data.invoice_number };
  }

  // --- Strategy 2: Match by description containing invoice number ----------
  const description = payment.description || '';

  // Look for FACT-YYYY-NNN pattern in the payment description
  const invoiceNumberMatch = description.match(/FACT-\d{4}-\d{3,}/i);
  if (invoiceNumberMatch) {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .ilike('invoice_number', invoiceNumberMatch[0])
      .eq('user_id', userId)
      .in('status', ['verzonden', 'concept'])
      .single();

    if (data) return { invoiceId: data.id, invoiceNumber: data.invoice_number };
  }

  // --- Strategy 3: Match by exact amount on an open invoice ----------------
  // Only match if there is exactly one open invoice with this amount to avoid
  // ambiguity. Additional safety constraints:
  // - Only match invoices with status 'verzonden' (not concept or already betaald)
  // - Only match if invoice date is within 30 days of payment date
  const paymentDate = payment.paidAt || payment.createdAt;
  const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
  const thirtyDaysBeforePayment = new Date(paymentDateObj);
  thirtyDaysBeforePayment.setDate(thirtyDaysBeforePayment.getDate() - 30);

  const { data: amountMatches } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('user_id', userId)
    .eq('total', paymentAmount)
    .eq('status', 'verzonden')
    .gte('date', thirtyDaysBeforePayment.toISOString().split('T')[0])
    .lte('date', paymentDateObj.toISOString().split('T')[0]);

  if (amountMatches && amountMatches.length === 1) {
    console.warn(
      `[Mollie] Amount-based matching used for payment ${payment.id}: ` +
      `matched invoice ${amountMatches[0].invoice_number} by amount ${paymentAmount}. ` +
      `Verify this match is correct.`,
    );
    return {
      invoiceId: amountMatches[0].id,
      invoiceNumber: amountMatches[0].invoice_number,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sync all recent Mollie payments
// ---------------------------------------------------------------------------

export async function syncMolliePayments(userId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = { total: 0, matched: 0, unmatched: 0, errors: [] };

  let payments: Payment[];
  try {
    // Fetch payments from the last 90 days by default
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 90);
    payments = await getMolliePayments(sinceDate.toISOString());
  } catch (err: any) {
    result.errors.push(`Fout bij ophalen Mollie betalingen: ${err.message}`);
    return result;
  }

  // Only process paid payments
  const paidPayments = payments.filter((p) => p.status === PaymentStatus.paid);
  result.total = paidPayments.length;

  for (const payment of paidPayments) {
    try {
      // Check if we already tracked this payment
      const { data: existing } = await supabase
        .from('payment_matches')
        .select('id')
        .eq('provider', 'mollie')
        .eq('external_id', payment.id)
        .maybeSingle();

      if (existing) continue; // already processed

      const match = await matchPaymentToInvoice(payment, userId);

      const paymentAmount = parseFloat(payment.amount.value);

      // Insert payment match record
      const { error: insertError } = await supabase.from('payment_matches').insert({
        user_id: userId,
        invoice_id: match?.invoiceId || null,
        provider: 'mollie',
        external_id: payment.id,
        amount: paymentAmount,
        status: match ? 'matched' : 'unmatched',
        payment_date: payment.paidAt || payment.createdAt,
        description: payment.description || null,
        metadata: {
          mollie_status: payment.status,
          method: payment.method,
        },
      });

      if (insertError) {
        result.errors.push(`Fout bij opslaan betaling ${payment.id}: ${insertError.message}`);
        continue;
      }

      if (match) {
        result.matched++;

        // Update invoice status to 'betaald'
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'betaald', paid_at: new Date().toISOString() })
          .eq('id', match.invoiceId)
          .eq('user_id', userId);

        if (updateError) {
          result.errors.push(
            `Betaling ${payment.id} gematcht maar factuur update mislukt: ${updateError.message}`,
          );
        } else {
          // Send payment confirmation email
          await sendPaymentConfirmation(match.invoiceId, userId);

          // Create in-app notification
          const amountFormatted = new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
          }).format(paymentAmount);
          await createNotification({
            userId,
            type: 'invoice_paid',
            title: 'Betaling ontvangen',
            message: `Factuur ${match.invoiceNumber} van ${amountFormatted} is betaald`,
            href: '/dashboard/invoices',
          });
        }
      } else {
        result.unmatched++;
      }
    } catch (err: any) {
      result.errors.push(`Fout bij verwerken betaling ${payment.id}: ${err.message}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Process a single webhook payment (called from webhook route)
// ---------------------------------------------------------------------------

export async function processMollieWebhook(paymentId: string): Promise<{ success: boolean; message?: string }> {
  const mollieClient = getMollieClient();
  const supabase = await createClient();

  // Check if this payment was already processed (idempotency guard)
  const { data: existingMatch } = await supabase
    .from('payment_matches')
    .select('id')
    .eq('payment_id', paymentId)
    .single();

  if (existingMatch) {
    return { success: true, message: 'Payment already processed' };
  }

  // Fetch the payment details from Mollie
  const payment = await mollieClient.payments.get(paymentId);

  if (payment.status !== PaymentStatus.paid) return { success: true, message: 'Payment not in paid status' };

  // Double-check by external_id as well (belt and suspenders)
  const { data: existing } = await supabase
    .from('payment_matches')
    .select('id')
    .eq('provider', 'mollie')
    .eq('external_id', payment.id)
    .maybeSingle();

  if (existing) return { success: true, message: 'Payment already processed' };

  const paymentAmount = parseFloat(payment.amount.value);

  // We need a user_id to scope the invoice lookup. For webhooks we use the
  // metadata if available, otherwise we fall back to matching any user's
  // invoice (single-tenant scenario).
  const meta = payment.metadata as Record<string, string> | null;
  let userId: string | null = meta?.user_id || null;

  // If no user_id in metadata, try to find an invoice by number in the
  // description and derive the user from that.
  if (!userId) {
    const description = payment.description || '';
    const invoiceNumberMatch = description.match(/FACT-\d{4}-\d{3,}/i);
    if (invoiceNumberMatch) {
      const { data: inv } = await supabase
        .from('invoices')
        .select('user_id')
        .ilike('invoice_number', invoiceNumberMatch[0])
        .limit(1)
        .maybeSingle();

      userId = inv?.user_id || null;
    }
  }

  if (!userId) return { success: false, message: 'Cannot determine owner' };

  const match = await matchPaymentToInvoice(payment, userId);

  await supabase.from('payment_matches').insert({
    user_id: userId,
    invoice_id: match?.invoiceId || null,
    provider: 'mollie',
    external_id: payment.id,
    amount: paymentAmount,
    status: match ? 'matched' : 'unmatched',
    payment_date: payment.paidAt || payment.createdAt,
    description: payment.description || null,
    metadata: {
      mollie_status: payment.status,
      method: payment.method,
    },
  });

  if (match) {
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'betaald', paid_at: new Date().toISOString() })
      .eq('id', match.invoiceId)
      .eq('user_id', userId);

    if (!updateError) {
      // Send payment confirmation email
      await sendPaymentConfirmation(match.invoiceId, userId);

      // Create in-app notification
      const amountFormatted = new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(paymentAmount);
      await createNotification({
        userId,
        type: 'invoice_paid',
        title: 'Betaling ontvangen',
        message: `Factuur ${match.invoiceNumber} van ${amountFormatted} is betaald`,
        href: '/dashboard/invoices',
      });
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Fetch payment matches for the integration page
// ---------------------------------------------------------------------------

export async function getPaymentMatches(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_matches')
    .select(`
      id, invoice_id, provider, external_id, amount, status,
      payment_date, description, metadata, created_at,
      invoices (id, invoice_number, total, status)
    `)
    .eq('user_id', userId)
    .order('payment_date', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return data || [];
}
