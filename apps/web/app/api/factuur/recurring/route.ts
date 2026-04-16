import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, date, due_date, status, client_id,
        recurring_frequency, next_recurring_date,
        subtotal, total_btw, total, template, notes,
        clients (id, name)
      `)
      .eq('user_id', user.id)
      .not('recurring_frequency', 'is', null)
      .neq('status', 'concept')
      .order('next_recurring_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find all recurring invoices that are due
    const { data: dueInvoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (description, quantity, unit_price, btw_rate, sort_order)
      `)
      .eq('user_id', user.id)
      .not('recurring_frequency', 'is', null)
      .neq('status', 'concept')
      .lte('next_recurring_date', today);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!dueInvoices || dueInvoices.length === 0) {
      return NextResponse.json({
        message: 'Geen terugkerende facturen om te verwerken',
        processed: 0,
        errors: [],
      });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const inv of dueInvoices) {
      try {
        // Generate new invoice number
        const year = new Date().getFullYear();
        const { data: lastInv } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('user_id', user.id)
          .ilike('invoice_number', `FACT-${year}-%`)
          .order('invoice_number', { ascending: false })
          .limit(1);

        let nextNumber = `FACT-${year}-001`;
        if (lastInv && lastInv.length > 0) {
          const numPart = parseInt(lastInv[0].invoice_number.replace(`FACT-${year}-`, ''), 10);
          if (!isNaN(numPart)) {
            nextNumber = `FACT-${year}-${String(numPart + 1).padStart(3, '0')}`;
          }
        }

        const now = new Date();
        const newDate = now.toISOString().split('T')[0];
        const newDueDate = new Date(now);
        newDueDate.setDate(newDueDate.getDate() + 30);

        // Create the new invoice copy
        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            client_id: inv.client_id,
            invoice_number: nextNumber,
            date: newDate,
            due_date: newDueDate.toISOString().split('T')[0],
            status: 'concept',
            notes: inv.notes,
            template: inv.template,
            subtotal: inv.subtotal,
            total_btw: inv.total_btw,
            total: inv.total,
            generated_from_recurring_id: inv.id,
          })
          .select('id')
          .single();

        if (insertError || !newInvoice) {
          errors.push(`Fout bij aanmaken factuur voor ${inv.invoice_number}: ${insertError?.message}`);
          continue;
        }

        // Copy invoice items
        if (inv.invoice_items?.length) {
          const newItems = inv.invoice_items.map((item: any) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            btw_rate: item.btw_rate,
            sort_order: item.sort_order,
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(newItems);

          if (itemsError) {
            errors.push(`Fout bij kopiëren regels voor ${inv.invoice_number}: ${itemsError.message}`);
          }
        }

        // Calculate next recurring date
        const currentNext = new Date(inv.next_recurring_date);
        let nextDate: Date;
        if (inv.recurring_frequency === 'maandelijks') {
          nextDate = new Date(currentNext);
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          // kwartaal
          nextDate = new Date(currentNext);
          nextDate.setMonth(nextDate.getMonth() + 3);
        }

        // Update the original invoice's next_recurring_date
        await supabase
          .from('invoices')
          .update({ next_recurring_date: nextDate.toISOString().split('T')[0] })
          .eq('id', inv.id)
          .eq('user_id', user.id);

        processed++;
      } catch (err: any) {
        errors.push(`Onverwachte fout voor ${inv.invoice_number}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: `${processed} facturen verwerkt`,
      processed,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
