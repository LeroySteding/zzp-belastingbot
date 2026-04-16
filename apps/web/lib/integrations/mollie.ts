import createMollieClient, { Payment, PaymentStatus } from '@mollie/api-client';
import { createClient } from '@/lib/supabase/server';

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
  // ambiguity.
  const { data: amountMatches } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('user_id', userId)
    .eq('total', paymentAmount)
    .in('status', ['verzonden', 'concept']);

  if (amountMatches && amountMatches.length === 1) {
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

export async function processMollieWebhook(paymentId: string): Promise<void> {
  const mollieClient = getMollieClient();
  const supabase = await createClient();

  // Fetch the payment details from Mollie
  const payment = await mollieClient.payments.get(paymentId);

  if (payment.status !== PaymentStatus.paid) return;

  // Check if we already tracked this payment
  const { data: existing } = await supabase
    .from('payment_matches')
    .select('id')
    .eq('provider', 'mollie')
    .eq('external_id', payment.id)
    .maybeSingle();

  if (existing) return; // already processed

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

  if (!userId) return; // Cannot determine owner

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
    await supabase
      .from('invoices')
      .update({ status: 'betaald', paid_at: new Date().toISOString() })
      .eq('id', match.invoiceId)
      .eq('user_id', userId);
  }
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
