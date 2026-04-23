'use server';

import { createClient } from '@/lib/supabase/server';
import { CompanyInfo, ClientInfo, LineItem } from '@/lib/factuur/types/invoice';
import { getCompanyInfo } from '@/lib/factuur/actions';

// ============================================
// TYPES
// ============================================

export type OfferteStatus = 'concept' | 'verzonden' | 'geaccepteerd' | 'afgewezen' | 'verlopen';

export interface Offerte {
  id: string;
  offerteNumber: string;
  date: string;
  validUntil: string;
  status: OfferteStatus;
  clientId?: string;
  notes?: string;
  template?: string;
  company: CompanyInfo;
  client: ClientInfo;
  items: LineItem[];
  subtotal: number;
  totalBtw: number;
  total: number;
  convertedInvoiceId?: string;
  convertedAt?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GET ALL OFFERTES
// ============================================

export async function getOffertes(): Promise<Offerte[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: offertes, error } = await supabase
    .from('offertes')
    .select(`
      *,
      clients (id, name, address, email, kvk, btw_number),
      offerte_items (id, description, quantity, unit_price, btw_rate, sort_order)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error || !offertes) return [];

  const companyInfo = await getCompanyInfo();

  return offertes.map((off) => ({
    id: off.id,
    offerteNumber: off.offerte_number,
    date: off.date,
    validUntil: off.valid_until,
    status: off.status as OfferteStatus,
    clientId: off.client_id || undefined,
    notes: off.notes || undefined,
    template: off.template || 'modern',
    company: companyInfo || {
      name: '',
      address: '',
      kvk: '',
      btwNumber: '',
      iban: '',
    },
    client: off.clients
      ? {
          name: off.clients.name,
          address: off.clients.address || '',
          email: off.clients.email || '',
          kvk: off.clients.kvk || undefined,
          btwNumber: off.clients.btw_number || undefined,
        }
      : { name: '', address: '' },
    items: (off.offerte_items || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        btwRate: item.btw_rate as 0 | 9 | 21,
      })),
    subtotal: Number(off.subtotal) || 0,
    totalBtw: Number(off.total_btw) || 0,
    total: Number(off.total) || 0,
    convertedInvoiceId: off.converted_invoice_id || undefined,
    convertedAt: off.converted_at || undefined,
    pdfUrl: off.pdf_url || undefined,
    createdAt: off.created_at,
    updatedAt: off.updated_at,
  }));
}

// ============================================
// GET SINGLE OFFERTE
// ============================================

export async function getOfferte(id: string): Promise<Offerte | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: off, error } = await supabase
    .from('offertes')
    .select(`
      *,
      clients (id, name, address, email, kvk, btw_number),
      offerte_items (id, description, quantity, unit_price, btw_rate, sort_order)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !off) return null;

  const companyInfo = await getCompanyInfo();

  return {
    id: off.id,
    offerteNumber: off.offerte_number,
    date: off.date,
    validUntil: off.valid_until,
    status: off.status as OfferteStatus,
    clientId: off.client_id || undefined,
    notes: off.notes || undefined,
    template: off.template || 'modern',
    company: companyInfo || {
      name: '',
      address: '',
      kvk: '',
      btwNumber: '',
      iban: '',
    },
    client: off.clients
      ? {
          name: off.clients.name,
          address: off.clients.address || '',
          email: off.clients.email || '',
          kvk: off.clients.kvk || undefined,
          btwNumber: off.clients.btw_number || undefined,
        }
      : { name: '', address: '' },
    items: (off.offerte_items || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        btwRate: item.btw_rate as 0 | 9 | 21,
      })),
    subtotal: Number(off.subtotal) || 0,
    totalBtw: Number(off.total_btw) || 0,
    total: Number(off.total) || 0,
    convertedInvoiceId: off.converted_invoice_id || undefined,
    convertedAt: off.converted_at || undefined,
    pdfUrl: off.pdf_url || undefined,
    createdAt: off.created_at,
    updatedAt: off.updated_at,
  };
}

// ============================================
// CREATE OFFERTE
// ============================================

export async function createOfferte(input: {
  offerteNumber: string;
  date: string;
  validUntil: string;
  clientId?: string;
  notes?: string;
  template?: string;
  items: LineItem[];
}): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Validate items
  if (!input.items || input.items.length === 0) {
    return null;
  }

  // Calculate totals
  let subtotal = 0;
  let totalBtw = 0;
  input.items.forEach((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;
    totalBtw += itemTotal * (item.btwRate / 100);
  });

  if (subtotal <= 0) {
    return null;
  }

  const { data: offerte, error } = await supabase
    .from('offertes')
    .insert({
      user_id: user.id,
      client_id: input.clientId || null,
      offerte_number: input.offerteNumber,
      date: input.date,
      valid_until: input.validUntil,
      status: 'concept',
      notes: input.notes || null,
      template: input.template || 'modern',
      subtotal: Math.round(subtotal * 100) / 100,
      total_btw: Math.round(totalBtw * 100) / 100,
      total: Math.round((subtotal + totalBtw) * 100) / 100,
    })
    .select('id')
    .single();

  if (error || !offerte) return null;

  // Insert offerte items
  const itemsToInsert = input.items.map((item, index) => ({
    offerte_id: offerte.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    btw_rate: item.btwRate,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from('offerte_items')
    .insert(itemsToInsert);

  if (itemsError) return null;

  return offerte.id;
}

// ============================================
// UPDATE OFFERTE STATUS
// ============================================

export async function updateOfferteStatus(
  id: string,
  status: OfferteStatus
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('offertes')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// DELETE OFFERTE
// ============================================

export async function deleteOfferte(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Delete offerte items first (cascade)
  await supabase.from('offerte_items').delete().eq('offerte_id', id);

  const { error } = await supabase
    .from('offertes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// CONVERT TO INVOICE - KEY FEATURE
// ============================================

export async function convertToInvoice(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch the offerte with items
  const { data: offerte } = await supabase
    .from('offertes')
    .select(`
      *,
      offerte_items (description, quantity, unit_price, btw_rate, sort_order)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!offerte) return null;

  // Check if offerte status allows conversion
  if (offerte.status === 'afgewezen' || offerte.status === 'verlopen') {
    return null;
  }

  // Check if already converted to an invoice
  if (offerte.converted_invoice_id) {
    return null;
  }

  // Check validity date - if expired and status is 'verzonden', auto-update to 'verlopen'
  if (offerte.valid_until && new Date(offerte.valid_until) < new Date()) {
    await supabase.from('offertes').update({ status: 'verlopen' }).eq('id', id);
    return null;
  }

  // Generate next invoice number
  const year = new Date().getFullYear();
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', user.id)
    .ilike('invoice_number', `FACT-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  let invoiceNumber = `FACT-${year}-001`;
  if (lastInvoice && lastInvoice.length > 0) {
    const numPart = parseInt(lastInvoice[0].invoice_number.replace(`FACT-${year}-`, ''), 10);
    if (!isNaN(numPart)) {
      invoiceNumber = `FACT-${year}-${String(numPart + 1).padStart(3, '0')}`;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Create the invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: offerte.client_id,
      invoice_number: invoiceNumber,
      date: today,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'concept',
      notes: offerte.notes,
      template: offerte.template,
      subtotal: offerte.subtotal,
      total_btw: offerte.total_btw,
      total: offerte.total,
    })
    .select('id')
    .single();

  if (invoiceError || !invoice) return null;

  // Copy offerte items to invoice items
  if (offerte.offerte_items?.length) {
    const invoiceItems = offerte.offerte_items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      btw_rate: item.btw_rate,
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Clean up the invoice if items failed
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return null;
    }
  }

  // Update the offerte: mark as accepted and link the invoice
  await supabase
    .from('offertes')
    .update({
      status: 'geaccepteerd',
      converted_invoice_id: invoice.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return invoice.id;
}

// ============================================
// NEXT OFFERTE NUMBER
// ============================================

export async function getNextOfferteNumber(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return generateFallbackOfferteNumber();

  const year = new Date().getFullYear();

  const { data } = await supabase
    .from('offertes')
    .select('offerte_number')
    .eq('user_id', user.id)
    .ilike('offerte_number', `OFF-${year}-%`)
    .order('offerte_number', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastNumber = data[0].offerte_number;
    const numPart = parseInt(lastNumber.replace(`OFF-${year}-`, ''), 10);
    if (!isNaN(numPart)) {
      return `OFF-${year}-${String(numPart + 1).padStart(3, '0')}`;
    }
  }

  return `OFF-${year}-001`;
}

function generateFallbackOfferteNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `OFF-${year}-${month}${random}`;
}
