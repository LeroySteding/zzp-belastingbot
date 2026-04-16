'use server';

import { createClient } from '@/lib/supabase/server';
import { getCompanyInfo } from '@/lib/factuur/actions';

// ============================================
// TYPES
// ============================================

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  total: number;
  daysOverdue: number;
  lastReminderSentAt: string | null;
  reminderCount: number;
}

// ============================================
// GET OVERDUE INVOICES
// ============================================

export async function getOverdueInvoices(): Promise<OverdueInvoice[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, date, due_date, total, status,
      last_reminder_sent_at, reminder_count,
      clients (id, name, email)
    `)
    .eq('user_id', user.id)
    .eq('status', 'verzonden')
    .lt('due_date', today)
    .order('due_date', { ascending: true });

  if (error || !invoices) return [];

  const now = new Date();

  return invoices.map((inv) => {
    const dueDate = new Date(inv.due_date);
    const diffTime = now.getTime() - dueDate.getTime();
    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientName: (inv.clients as any)?.name || 'Onbekend',
      clientEmail: (inv.clients as any)?.email || '',
      date: inv.date,
      dueDate: inv.due_date,
      total: Number(inv.total) || 0,
      daysOverdue,
      lastReminderSentAt: inv.last_reminder_sent_at || null,
      reminderCount: inv.reminder_count || 0,
    };
  });
}

// ============================================
// SEND SINGLE REMINDER
// ============================================

export async function sendReminder(invoiceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Fetch invoice with client info
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      clients (id, name, email, address)
    `)
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single();

  if (!invoice) return { success: false, error: 'Factuur niet gevonden' };

  const clientEmail = (invoice.clients as any)?.email;
  if (!clientEmail) {
    return { success: false, error: 'Klant heeft geen email adres' };
  }

  const companyInfo = await getCompanyInfo();
  const companyName = companyInfo?.name || 'Uw leverancier';

  const dueDate = new Date(invoice.due_date);
  const now = new Date();
  const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  const totalFormatted = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(invoice.total) || 0);

  const dueDateFormatted = dueDate.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const subject = `Herinnering: Factuur ${invoice.invoice_number} is verlopen`;
  const emailBody = `Beste ${(invoice.clients as any)?.name || 'klant'},

Wij willen u er vriendelijk aan herinneren dat de betaling van onderstaande factuur nog niet door ons is ontvangen.

Factuurgegevens:
- Factuurnummer: ${invoice.invoice_number}
- Factuurdatum: ${new Date(invoice.date).toLocaleDateString('nl-NL')}
- Vervaldatum: ${dueDateFormatted}
- Totaalbedrag: ${totalFormatted}
- Aantal dagen verlopen: ${daysOverdue}

Wij verzoeken u vriendelijk het openstaande bedrag zo spoedig mogelijk over te maken naar:
IBAN: ${companyInfo?.iban || 'Zie factuur'}
t.n.v. ${companyName}
o.v.v. ${invoice.invoice_number}

Mocht u de betaling reeds hebben verricht, dan kunt u deze herinnering als niet verzonden beschouwen.

Bij vragen kunt u contact met ons opnemen via ${companyInfo?.email || companyInfo?.phone || 'onze contactgegevens'}.

Met vriendelijke groet,
${companyName}`;

  try {
    // Send via the API route (which uses Resend)
    // We'll build the invoice object needed for PDF generation
    const invoiceForPdf = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      date: invoice.date,
      dueDate: invoice.due_date,
      company: companyInfo || { name: '', address: '', kvk: '', btwNumber: '', iban: '' },
      client: {
        name: (invoice.clients as any)?.name || '',
        address: (invoice.clients as any)?.address || '',
        email: clientEmail,
      },
      items: [], // Will be fetched by the email API if needed
      status: invoice.status,
      notes: invoice.notes,
      template: invoice.template,
    };

    // Fetch invoice items for PDF generation
    const { data: items } = await supabase
      .from('invoice_items')
      .select('id, description, quantity, unit_price, btw_rate, sort_order')
      .eq('invoice_id', invoiceId)
      .order('sort_order', { ascending: true });

    invoiceForPdf.items = (items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      btwRate: item.btw_rate,
    }));

    // Use the internal API to send the reminder email
    // We pass the data to the send-email API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/factuur/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: invoiceForPdf,
        recipientEmail: clientEmail,
        subject,
        emailBody,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Email versturen mislukt' };
    }

    // Update invoice reminder tracking
    await supabase
      .from('invoices')
      .update({
        last_reminder_sent_at: new Date().toISOString(),
        reminder_count: (invoice.reminder_count || 0) + 1,
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Fout bij versturen: ${err.message}` };
  }
}

// ============================================
// SEND ALL REMINDERS
// ============================================

export async function sendAllReminders(): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const overdueInvoices = await getOverdueInvoices();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const invoice of overdueInvoices) {
    if (!invoice.clientEmail) {
      failed++;
      errors.push(`${invoice.invoiceNumber}: Geen email adres`);
      continue;
    }

    const result = await sendReminder(invoice.id);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${invoice.invoiceNumber}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

// ============================================
// GET REMINDERS HISTORY
// ============================================

export async function getRemindersHistory(): Promise<{
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  lastReminderSentAt: string;
  reminderCount: number;
  total: number;
}[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, total, last_reminder_sent_at, reminder_count,
      clients (name)
    `)
    .eq('user_id', user.id)
    .gt('reminder_count', 0)
    .order('last_reminder_sent_at', { ascending: false });

  if (error || !invoices) return [];

  return invoices.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoice_number,
    clientName: (inv.clients as any)?.name || 'Onbekend',
    lastReminderSentAt: inv.last_reminder_sent_at || '',
    reminderCount: inv.reminder_count || 0,
    total: Number(inv.total) || 0,
  }));
}
