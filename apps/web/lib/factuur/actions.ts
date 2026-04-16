'use server';

import { createClient } from '@/lib/supabase/server';
import { Invoice, Client, CompanyInfo, LineItem } from '@/lib/factuur/types/invoice';

// ============================================
// PROFILE / COMPANY INFO
// ============================================

export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('company_name, btw_number, kvk_number, iban, phone, email, address')
    .eq('id', user.id)
    .single();

  if (!data) return null;

  return {
    name: data.company_name || '',
    address: data.address || '',
    kvk: data.kvk_number || '',
    btwNumber: data.btw_number || '',
    iban: data.iban || '',
    email: data.email || '',
    phone: data.phone || '',
  };
}

// ============================================
// CLIENTS
// ============================================

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address || '',
    email: c.email || '',
    kvk: c.kvk || undefined,
    btwNumber: c.btw_number || undefined,
    createdAt: c.created_at,
  }));
}

export async function createClientAction(input: {
  name: string;
  address: string;
  email: string;
  kvk?: string;
  btwNumber?: string;
}): Promise<Client | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: input.name,
      address: input.address,
      email: input.email,
      kvk: input.kvk || null,
      btw_number: input.btwNumber || null,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    address: data.address || '',
    email: data.email || '',
    kvk: data.kvk || undefined,
    btwNumber: data.btw_number || undefined,
    createdAt: data.created_at,
  };
}

export async function updateClientAction(
  id: string,
  input: {
    name: string;
    address: string;
    email: string;
    kvk?: string;
    btwNumber?: string;
  }
): Promise<Client | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('clients')
    .update({
      name: input.name,
      address: input.address,
      email: input.email,
      kvk: input.kvk || null,
      btw_number: input.btwNumber || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    address: data.address || '',
    email: data.email || '',
    kvk: data.kvk || undefined,
    btwNumber: data.btw_number || undefined,
    createdAt: data.created_at,
  };
}

export async function deleteClientAction(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// INVOICES
// ============================================

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients (id, name, address, email, kvk, btw_number),
      invoice_items (id, description, quantity, unit_price, btw_rate, sort_order)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error || !invoices) return [];

  // Get company info for all invoices
  const companyInfo = await getCompanyInfo();

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    date: inv.date,
    dueDate: inv.due_date,
    status: inv.status,
    clientId: inv.client_id || undefined,
    notes: inv.notes || undefined,
    recurring: inv.recurring_frequency || undefined,
    nextRecurringDate: inv.next_recurring_date || undefined,
    template: inv.template || 'modern',
    company: companyInfo || {
      name: '',
      address: '',
      kvk: '',
      btwNumber: '',
      iban: '',
    },
    client: inv.clients
      ? {
          name: inv.clients.name,
          address: inv.clients.address || '',
          email: inv.clients.email || '',
          kvk: inv.clients.kvk || undefined,
          btwNumber: inv.clients.btw_number || undefined,
        }
      : { name: '', address: '' },
    items: (inv.invoice_items || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        btwRate: item.btw_rate as 0 | 9 | 21,
      })),
  }));
}

export async function createInvoiceAction(input: {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientId?: string;
  notes?: string;
  template?: string;
  recurring?: string | null;
  items: LineItem[];
}): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Calculate totals
  let subtotal = 0;
  let totalBtw = 0;
  input.items.forEach((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;
    totalBtw += itemTotal * (item.btwRate / 100);
  });

  // Calculate next_recurring_date if recurring
  let nextRecurringDate: string | null = null;
  if (input.recurring) {
    const baseDate = new Date(input.date);
    if (input.recurring === 'maandelijks') {
      baseDate.setMonth(baseDate.getMonth() + 1);
    } else if (input.recurring === 'kwartaal') {
      baseDate.setMonth(baseDate.getMonth() + 3);
    }
    nextRecurringDate = baseDate.toISOString().split('T')[0];
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: input.clientId || null,
      invoice_number: input.invoiceNumber,
      date: input.date,
      due_date: input.dueDate,
      status: 'concept',
      notes: input.notes || null,
      template: input.template || 'modern',
      recurring_frequency: input.recurring || null,
      next_recurring_date: nextRecurringDate,
      subtotal: Math.round(subtotal * 100) / 100,
      total_btw: Math.round(totalBtw * 100) / 100,
      total: Math.round((subtotal + totalBtw) * 100) / 100,
    })
    .select('id')
    .single();

  if (error || !invoice) return null;

  // Insert invoice items
  const itemsToInsert = input.items.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    btw_rate: item.btwRate,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert);

  if (itemsError) return null;

  return invoice.id;
}

export async function updateInvoiceStatusAction(
  id: string,
  status: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const updateData: Record<string, any> = { status };
  if (status === 'verzonden') {
    updateData.sent_at = new Date().toISOString();
  } else if (status === 'betaald') {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function deleteInvoiceAction(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function duplicateInvoiceAction(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch original invoice with items
  const { data: original } = await supabase
    .from('invoices')
    .select(`*, invoice_items (description, quantity, unit_price, btw_rate, sort_order)`)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!original) return null;

  // Generate new invoice number
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const newNumber = `FACT-${year}-${month}${random}`;

  const today = now.toISOString().split('T')[0];
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 30);

  const { data: newInvoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: original.client_id,
      invoice_number: newNumber,
      date: today,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'concept',
      notes: original.notes,
      template: original.template,
      recurring_frequency: original.recurring_frequency,
      subtotal: original.subtotal,
      total_btw: original.total_btw,
      total: original.total,
    })
    .select('id')
    .single();

  if (error || !newInvoice) return null;

  // Copy items
  if (original.invoice_items?.length) {
    const newItems = original.invoice_items.map((item: any) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      btw_rate: item.btw_rate,
      sort_order: item.sort_order,
    }));

    await supabase.from('invoice_items').insert(newItems);
  }

  return newInvoice.id;
}

// ============================================
// NEXT INVOICE NUMBER
// ============================================

export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return generateFallbackNumber();

  const year = new Date().getFullYear();

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', user.id)
    .ilike('invoice_number', `FACT-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const numPart = parseInt(lastNumber.replace(`FACT-${year}-`, ''), 10);
    if (!isNaN(numPart)) {
      return `FACT-${year}-${String(numPart + 1).padStart(3, '0')}`;
    }
  }

  return `FACT-${year}-001`;
}

function generateFallbackNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FACT-${year}-${month}${random}`;
}

// ============================================
// RECURRING INVOICES
// ============================================

export interface RecurringInvoiceData {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientId: string | null;
  date: string;
  dueDate: string;
  status: string;
  recurringFrequency: string;
  nextRecurringDate: string | null;
  subtotal: number;
  totalBtw: number;
  total: number;
  template: string | null;
  notes: string | null;
  generatedInvoices: {
    id: string;
    invoiceNumber: string;
    date: string;
    status: string;
    total: number;
  }[];
}

export async function getRecurringInvoices(): Promise<RecurringInvoiceData[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
    .order('next_recurring_date', { ascending: true });

  if (error || !invoices) return [];

  // For each recurring invoice, find generated copies
  // We match by client_id and notes containing the source invoice number
  const result: RecurringInvoiceData[] = [];

  for (const inv of invoices) {
    // Find invoices generated from this recurring one by looking for notes reference
    const { data: generated } = await supabase
      .from('invoices')
      .select('id, invoice_number, date, status, total')
      .eq('user_id', user.id)
      .eq('generated_from_recurring_id', inv.id)
      .order('date', { ascending: false });

    result.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientName: (inv.clients as any)?.name || 'Onbekend',
      clientId: inv.client_id,
      date: inv.date,
      dueDate: inv.due_date,
      status: inv.status,
      recurringFrequency: inv.recurring_frequency!,
      nextRecurringDate: inv.next_recurring_date,
      subtotal: Number(inv.subtotal) || 0,
      totalBtw: Number(inv.total_btw) || 0,
      total: Number(inv.total) || 0,
      template: inv.template,
      notes: inv.notes,
      generatedInvoices: (generated || []).map((g: any) => ({
        id: g.id,
        invoiceNumber: g.invoice_number,
        date: g.date,
        status: g.status,
        total: Number(g.total) || 0,
      })),
    });
  }

  return result;
}

export async function processRecurringInvoices(): Promise<{
  processed: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { processed: 0, errors: ['Niet ingelogd'] };

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

  if (error || !dueInvoices) {
    return { processed: 0, errors: [error?.message || 'Kan facturen niet ophalen'] };
  }

  let processed = 0;
  const errors: string[] = [];

  for (const inv of dueInvoices) {
    try {
      // Generate new invoice number
      const nextNumber = await getNextInvoiceNumber();

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

  return { processed, errors };
}

export async function pauseRecurring(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('invoices')
    .update({
      recurring_frequency: null,
      next_recurring_date: null,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function resumeRecurring(
  id: string,
  frequency: 'maandelijks' | 'kwartaal'
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Set the next recurring date based on frequency
  const now = new Date();
  let nextDate: Date;
  if (frequency === 'maandelijks') {
    nextDate = new Date(now);
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate = new Date(now);
    nextDate.setMonth(nextDate.getMonth() + 3);
  }

  const { error } = await supabase
    .from('invoices')
    .update({
      recurring_frequency: frequency,
      next_recurring_date: nextDate.toISOString().split('T')[0],
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}
