'use server';

import { createClient } from '@/lib/supabase/server';
import { getCompanyInfo } from '@/lib/factuur/actions';
import { buildReminderEmail } from '@/lib/email/emails';
import { sendEmail } from '@/lib/email/send';
import { createNotification } from '@/lib/notifications/actions';

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

  // Build reminder email using the centralized template
  const emailTemplate = buildReminderEmail({
    clientName: (invoice.clients as any)?.name || 'klant',
    invoiceNumber: invoice.invoice_number,
    amount: totalFormatted,
    dueDate: dueDateFormatted,
    daysOverdue,
    bankDetails: companyInfo?.iban
      ? {
          iban: companyInfo.iban,
          name: companyName,
          reference: invoice.invoice_number,
        }
      : undefined,
  });

  try {
    // Send email using the centralized sendEmail (which auto-logs to email_logs)
    const result = await sendEmail({
      to: clientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      tags: [{ name: 'type', value: 'herinnering' }],
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Email versturen mislukt' };
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

    // Create in-app notification for overdue invoice reminder
    await createNotification({
      userId: user.id,
      type: 'invoice_overdue',
      title: 'Factuur verlopen',
      message: `Factuur ${invoice.invoice_number} is ${daysOverdue} dagen verlopen`,
      href: '/dashboard/invoices',
    });

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
