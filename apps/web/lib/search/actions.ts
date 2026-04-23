'use server';

import { createClient } from '@/lib/supabase/server';

export interface SearchResult {
  id: string;
  type: 'invoice' | 'client' | 'project' | 'expense' | 'offerte' | 'lead' | 'contract';
  title: string;
  subtitle?: string;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const searchTerm = `%${query}%`;
  const results: SearchResult[] = [];

  // Run all searches in parallel
  const [invoices, clients, projects, expenses, offertes, leads, contracts] = await Promise.all([
    // Facturen - zoek op factuurnummer
    supabase
      .from('invoices')
      .select('id, invoice_number, total, status, clients(name)')
      .eq('user_id', user.id)
      .ilike('invoice_number', searchTerm)
      .limit(5),
    // Klanten - zoek op naam, e-mail
    supabase
      .from('clients')
      .select('id, name, email')
      .eq('user_id', user.id)
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5),
    // Projecten - zoek op naam
    supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .ilike('name', searchTerm)
      .limit(5),
    // Uitgaven - zoek op omschrijving
    supabase
      .from('expenses')
      .select('id, description, amount_incl, category')
      .eq('user_id', user.id)
      .ilike('description', searchTerm)
      .limit(5),
    // Offertes - zoek op offertenummer
    supabase
      .from('offertes')
      .select('id, offerte_number, total, clients(name)')
      .eq('user_id', user.id)
      .ilike('offerte_number', searchTerm)
      .limit(5),
    // Leads - zoek op bedrijfsnaam
    Promise.resolve(
      supabase
        .from('leads')
        .select('id, company_name, stage')
        .eq('user_id', user.id)
        .ilike('company_name', searchTerm)
        .limit(5),
    ).catch(() => ({ data: null })),
    // Contracten - zoek op titel
    Promise.resolve(
      supabase
        .from('contracts')
        .select('id, title, status')
        .eq('user_id', user.id)
        .ilike('title', searchTerm)
        .limit(5),
    ).catch(() => ({ data: null })),
  ]);

  // Facturen
  if (invoices.data) {
    for (const inv of invoices.data) {
      results.push({
        id: inv.id,
        type: 'invoice',
        title: `Factuur ${inv.invoice_number}`,
        subtitle: `${(inv as any).clients?.name || ''} - €${inv.total?.toFixed(2) || '0'}`,
        href: `/dashboard/invoices/${inv.id}`,
      });
    }
  }

  // Klanten
  if (clients.data) {
    for (const c of clients.data) {
      results.push({
        id: c.id,
        type: 'client',
        title: c.name,
        subtitle: c.email || '',
        href: `/dashboard/invoices?client=${c.id}`,
      });
    }
  }

  // Projecten
  if (projects.data) {
    for (const p of projects.data) {
      results.push({
        id: p.id,
        type: 'project',
        title: p.name,
        href: `/dashboard/projects/${p.id}`,
      });
    }
  }

  // Uitgaven
  if (expenses.data) {
    for (const e of expenses.data) {
      results.push({
        id: e.id,
        type: 'expense',
        title: e.description || e.category,
        subtitle: `€${e.amount_incl?.toFixed(2) || '0'}`,
        href: '/dashboard/expenses',
      });
    }
  }

  // Offertes
  if (offertes.data) {
    for (const o of offertes.data) {
      results.push({
        id: o.id,
        type: 'offerte',
        title: `Offerte ${o.offerte_number}`,
        subtitle: `${(o as any).clients?.name || ''}`,
        href: `/dashboard/offertes/${o.id}`,
      });
    }
  }

  // Leads
  if (leads?.data) {
    for (const l of (leads as any).data) {
      results.push({
        id: l.id,
        type: 'lead',
        title: l.company_name,
        subtitle: l.stage,
        href: '/dashboard/leads',
      });
    }
  }

  // Contracten
  if (contracts?.data) {
    for (const c of (contracts as any).data) {
      results.push({
        id: c.id,
        type: 'contract',
        title: c.title,
        subtitle: c.status,
        href: `/dashboard/contracts/${c.id}`,
      });
    }
  }

  return results;
}
