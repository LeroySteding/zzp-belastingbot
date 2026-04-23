'use server';

import { createClient } from '@/lib/supabase/server';
import { getNextInvoiceNumber } from '@/lib/factuur/actions';

export interface RecurringResult {
  created: number;
  errors: string[];
}

export async function processRecurringInvoices(): Promise<RecurringResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { created: 0, errors: ['Niet ingelogd'] };

  const today = new Date().toISOString().split('T')[0];

  // Zoek alle facturen die terugkerend zijn en klaar zijn voor generatie
  const { data: recurringInvoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('user_id', user.id)
    .not('recurring_frequency', 'is', null)
    .lte('next_recurring_date', today)
    .in('status', ['betaald', 'verzonden']);

  if (!recurringInvoices || recurringInvoices.length === 0) {
    return { created: 0, errors: [] };
  }

  let created = 0;
  const errors: string[] = [];

  for (const original of recurringInvoices) {
    try {
      // Genereer volgend factuurnummer
      const newNumber = await getNextInvoiceNumber();

      // Bereken nieuwe datums
      const newDate = today;
      const paymentTermDays = original.payment_term || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTermDays);

      // Bereken volgende terugkeerdatum
      const nextDate = calculateNextRecurringDate(
        new Date(original.next_recurring_date),
        original.recurring_frequency
      );

      // Maak nieuwe factuur aan
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: original.client_id,
          project_id: original.project_id,
          invoice_number: newNumber,
          date: newDate,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'concept',
          notes: original.notes,
          template: original.template,
          subtotal: original.subtotal,
          total_btw: original.total_btw,
          total: original.total,
          recurring_frequency: original.recurring_frequency,
          next_recurring_date: nextDate.toISOString().split('T')[0],
          generated_from_recurring_id: original.id,
        })
        .select('id')
        .single();

      if (insertError || !newInvoice) {
        errors.push(`Fout bij ${original.invoice_number}: ${insertError?.message}`);
        continue;
      }

      // Kopieer factuurregels
      if (original.invoice_items?.length) {
        const items = original.invoice_items.map((item: any) => ({
          invoice_id: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          btw_rate: item.btw_rate,
          sort_order: item.sort_order,
        }));

        await supabase.from('invoice_items').insert(items);
      }

      // Werk de originele factuur bij: stel volgende terugkeerdatum in
      await supabase
        .from('invoices')
        .update({ next_recurring_date: nextDate.toISOString().split('T')[0] })
        .eq('id', original.id);

      created++;
    } catch (e: any) {
      errors.push(`Fout bij ${original.invoice_number}: ${e.message}`);
    }
  }

  return { created, errors };
}

function calculateNextRecurringDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'maandelijks':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'kwartaal':
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function getRecurringInvoicesSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, dueNow: 0, invoices: [] };

  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_id, recurring_frequency, next_recurring_date, total, status')
    .eq('user_id', user.id)
    .not('recurring_frequency', 'is', null)
    .order('next_recurring_date', { ascending: true });

  const invoices = data || [];
  const dueNow = invoices.filter(inv => inv.next_recurring_date && inv.next_recurring_date <= today).length;

  return { total: invoices.length, dueNow, invoices };
}
