'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  timestamp: string;
  href?: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Run all queries in parallel
  const [
    invoicesResult,
    timeEntriesResult,
    expensesResult,
    leadsResult,
    offertesResult,
  ] = await Promise.all([
    // 1. Recent invoices
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, clients(name), updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),

    // 2. Recent time entries
    supabase
      .from('time_entries')
      .select('id, date, duration_minutes, description, projects(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5),

    // 3. Recent expenses
    supabase
      .from('expenses')
      .select('id, description, amount_incl, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    // 4. Recent leads (try/catch)
    (async () => {
      try {
        const result = await supabase
          .from('leads')
          .select('id, company_name, stage, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        return result;
      } catch {
        return { data: null, error: null };
      }
    })(),

    // 5. Recent offertes (try/catch)
    (async () => {
      try {
        const result = await supabase
          .from('offertes')
          .select('id, offerte_number, status, total, clients(name), updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);
        return result;
      } catch {
        return { data: null, error: null };
      }
    })(),
  ]);

  const activities: ActivityItem[] = [];

  // Map invoices
  const invoices = invoicesResult.data || [];
  for (const inv of invoices) {
    const clientData = inv.clients as any;
    const clientName = clientData?.name || '';
    const statusLabels: Record<string, string> = {
      concept: 'Concept',
      verzonden: 'Verzonden',
      betaald: 'Betaald',
      verlopen: 'Verlopen',
    };
    activities.push({
      id: `inv-${inv.id}`,
      type: 'factuur',
      title: `Factuur ${inv.invoice_number}`,
      subtitle: `${clientName}${clientName ? ' - ' : ''}${statusLabels[inv.status] || inv.status}`,
      icon: 'file-text',
      color: '#3b82f6',
      timestamp: inv.updated_at,
      href: `/factuur/invoices/${inv.id}`,
    });
  }

  // Map time entries
  const timeEntries = timeEntriesResult.data || [];
  for (const entry of timeEntries) {
    const projectData = entry.projects as any;
    const projectName = projectData?.name || '';
    const hours = Math.round((entry.duration_minutes / 60) * 10) / 10;
    activities.push({
      id: `time-${entry.id}`,
      type: 'uren',
      title: `${hours}u geregistreerd`,
      subtitle: `${projectName}${entry.description ? ' - ' + entry.description : ''}`,
      icon: 'clock',
      color: '#8b5cf6',
      timestamp: entry.date + 'T12:00:00Z',
      href: '/uren/track',
    });
  }

  // Map expenses
  const expenseItems = expensesResult.data || [];
  for (const exp of expenseItems) {
    activities.push({
      id: `exp-${exp.id}`,
      type: 'uitgave',
      title: exp.description,
      subtitle: exp.category,
      icon: 'receipt',
      color: '#f97316',
      timestamp: exp.created_at,
      href: '/belasting/expenses',
    });
  }

  // Map leads
  const leads = leadsResult.data || [];
  for (const lead of leads) {
    const stageLabels: Record<string, string> = {
      nieuw: 'Nieuw',
      gecontacteerd: 'Gecontacteerd',
      geinteresseerd: 'Geinteresseerd',
      offerte: 'Offerte',
      gewonnen: 'Gewonnen',
      verloren: 'Verloren',
    };
    activities.push({
      id: `lead-${lead.id}`,
      type: 'lead',
      title: lead.company_name,
      subtitle: stageLabels[lead.stage] || lead.stage,
      icon: 'target',
      color: '#10b981',
      timestamp: lead.created_at,
      href: '/leads',
    });
  }

  // Map offertes
  const offertes = offertesResult.data || [];
  for (const off of offertes) {
    const clientData = off.clients as any;
    const clientName = clientData?.name || '';
    const statusLabels: Record<string, string> = {
      concept: 'Concept',
      verzonden: 'Verzonden',
      geaccepteerd: 'Geaccepteerd',
      afgewezen: 'Afgewezen',
      verlopen: 'Verlopen',
    };
    activities.push({
      id: `off-${off.id}`,
      type: 'offerte',
      title: `Offerte ${off.offerte_number}`,
      subtitle: `${clientName}${clientName ? ' - ' : ''}${statusLabels[off.status] || off.status}`,
      icon: 'scroll-text',
      color: '#6366f1',
      timestamp: off.updated_at,
      href: `/offertes/${off.id}`,
    });
  }

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities.slice(0, limit);
}
