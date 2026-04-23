'use server';
import { createClient } from '@/lib/supabase/server';

function escapeCSV(value: string): string {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(h => escapeCSV(h)).join(',');
  const dataLines = rows.map(r => r.map(v => escapeCSV(String(v ?? ''))).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export async function exportInvoicesCSV(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '';

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number, date, due_date, status, subtotal, btw_amount, total, clients(name, email)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (!data || data.length === 0) return '';

  const headers = ['Factuurnummer', 'Datum', 'Vervaldatum', 'Status', 'Subtotaal', 'BTW', 'Totaal', 'Klant', 'Email'];
  const rows = data.map((inv: any) => [
    inv.invoice_number,
    inv.date,
    inv.due_date,
    inv.status,
    inv.subtotal?.toFixed(2) || '0.00',
    inv.btw_amount?.toFixed(2) || '0.00',
    inv.total?.toFixed(2) || '0.00',
    inv.clients?.name || '',
    inv.clients?.email || '',
  ]);

  return toCSV(headers, rows);
}

export async function exportExpensesCSV(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '';

  const { data } = await supabase
    .from('expenses')
    .select('date, description, category, amount_excl, btw_amount, amount_incl')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (!data || data.length === 0) return '';

  const headers = ['Datum', 'Omschrijving', 'Categorie', 'Bedrag excl BTW', 'BTW', 'Bedrag incl BTW'];
  const rows = data.map((exp: any) => [
    exp.date,
    exp.description,
    exp.category,
    exp.amount_excl?.toFixed(2) || '0.00',
    exp.btw_amount?.toFixed(2) || '0.00',
    exp.amount_incl?.toFixed(2) || '0.00',
  ]);

  return toCSV(headers, rows);
}

export async function exportTimeEntriesCSV(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '';

  const { data } = await supabase
    .from('time_entries')
    .select('date, description, duration_minutes, projects(name, hourly_rate)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (!data || data.length === 0) return '';

  const headers = ['Datum', 'Project', 'Omschrijving', 'Duur (uren)', 'Uurtarief', 'Totaal'];
  const rows = data.map((entry: any) => {
    const hours = (entry.duration_minutes || 0) / 60;
    const rate = Number(entry.projects?.hourly_rate) || 0;
    const total = hours * rate;
    return [
      entry.date,
      entry.projects?.name || '',
      entry.description || '',
      hours.toFixed(2),
      rate.toFixed(2),
      total.toFixed(2),
    ];
  });

  return toCSV(headers, rows);
}
