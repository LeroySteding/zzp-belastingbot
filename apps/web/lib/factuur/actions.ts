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
