'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================

export interface AssistantResponse {
  answer: string;
  data?: { label: string; value: number }[];
  type: 'text' | 'currency' | 'chart' | 'list';
  suggestions?: string[];
}

// ============================================
// Date helpers
// ============================================

function getCurrentQuarterRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const year = now.getFullYear();
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1).toISOString().split('T')[0];
  const end = new Date(year, startMonth + 3, 0).toISOString().split('T')[0];
  return { start, end, label: `Q${quarter} ${year}` };
}

function getCurrentMonthRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toISOString().split('T')[0];
  const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
  const label = now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  return { start, end, label };
}

function getCurrentYearRange(): { start: string; end: string; label: string } {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31`, label: String(year) };
}

function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

// ============================================
// Query handlers
// ============================================

async function getRevenueQuery(question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  // Determine time range from question
  let range: { start: string; end: string; label: string };
  if (/jaar/i.test(question)) {
    range = getCurrentYearRange();
  } else if (/kwartaal/i.test(question)) {
    range = getCurrentQuarterRange();
  } else {
    range = getCurrentMonthRange();
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, status, date')
    .eq('user_id', userId)
    .eq('status', 'betaald')
    .gte('date', range.start)
    .lte('date', range.end);

  const rows = invoices || [];
  const total = rows.reduce((s, r) => s + Number(r.total), 0);
  const count = rows.length;

  // Build monthly chart data for year view
  let chartData: { label: string; value: number }[] | undefined;
  if (/jaar/i.test(question)) {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Number(range.label), i, 1);
      return { label: d.toLocaleDateString('nl-NL', { month: 'short' }), value: 0 };
    });
    rows.forEach((r) => {
      const m = new Date(r.date).getMonth();
      months[m].value += Number(r.total);
    });
    chartData = months;
  }

  return {
    answer: `Je omzet ${range.label.startsWith('Q') ? 'dit kwartaal' : /jaar/i.test(question) ? 'dit jaar' : 'deze maand'} (${range.label}) is ${formatEur(total)} (${count} betaalde ${count === 1 ? 'factuur' : 'facturen'}).`,
    data: chartData,
    type: chartData ? 'chart' : 'currency',
    suggestions: ['Hoeveel staat er open?', 'Wat zijn mijn uitgaven deze maand?', 'Hoeveel BTW moet ik afdragen?'],
  };
}

async function getOutstandingQuery(_question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, client_id, clients(name)')
    .eq('user_id', userId)
    .eq('status', 'verzonden');

  const rows = invoices || [];
  const total = rows.reduce((s, r) => s + Number(r.total), 0);

  const listData = rows.map((r: any) => ({
    label: `${r.invoice_number} - ${r.clients?.name || 'Onbekend'}`,
    value: Number(r.total),
  }));

  return {
    answer: rows.length === 0
      ? 'Er staan geen facturen open. Alles is betaald!'
      : `Er ${rows.length === 1 ? 'staat 1 factuur' : `staan ${rows.length} facturen`} open voor totaal ${formatEur(total)}.`,
    data: listData.length > 0 ? listData : undefined,
    type: rows.length > 0 ? 'list' : 'text',
    suggestions: ['Omzet dit kwartaal', 'Hoeveel BTW moet ik afdragen?', 'Hoeveel uur heb ik deze week gewerkt?'],
  };
}

async function getExpensesQuery(question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  let range: { start: string; end: string; label: string };
  if (/jaar/i.test(question)) {
    range = getCurrentYearRange();
  } else if (/kwartaal/i.test(question)) {
    range = getCurrentQuarterRange();
  } else {
    range = getCurrentMonthRange();
  }

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount_incl, category')
    .eq('user_id', userId)
    .gte('date', range.start)
    .lte('date', range.end);

  const rows = expenses || [];
  const total = rows.reduce((s, r) => s + Number(r.amount_incl), 0);

  // Group by category
  const catMap: Record<string, number> = {};
  rows.forEach((r) => {
    const cat = r.category || 'Overig';
    catMap[cat] = (catMap[cat] || 0) + Number(r.amount_incl);
  });
  const categories = Object.entries(catMap).map(([label, value]) => ({ label, value }));
  categories.sort((a, b) => b.value - a.value);

  const periodLabel = /jaar/i.test(question) ? 'dit jaar' : /kwartaal/i.test(question) ? 'dit kwartaal' : 'deze maand';

  return {
    answer: rows.length === 0
      ? `Je hebt ${periodLabel} nog geen uitgaven geregistreerd.`
      : `Je uitgaven ${periodLabel} zijn ${formatEur(total)} verdeeld over ${categories.length} ${categories.length === 1 ? 'categorie' : 'categorieën'}.`,
    data: categories.length > 0 ? categories : undefined,
    type: categories.length > 0 ? 'chart' : 'currency',
    suggestions: ['Omzet dit kwartaal', 'Hoeveel BTW moet ik afdragen?', 'Hoeveel winst heb ik gemaakt?'],
  };
}

async function getProfitQuery(question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  let range: { start: string; end: string; label: string };
  if (/jaar/i.test(question)) {
    range = getCurrentYearRange();
  } else if (/kwartaal/i.test(question)) {
    range = getCurrentQuarterRange();
  } else {
    range = getCurrentMonthRange();
  }

  const [{ data: invoices }, { data: expenses }] = await Promise.all([
    supabase
      .from('invoices')
      .select('total')
      .eq('user_id', userId)
      .eq('status', 'betaald')
      .gte('date', range.start)
      .lte('date', range.end),
    supabase
      .from('expenses')
      .select('amount_incl')
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end),
  ]);

  const revenue = (invoices || []).reduce((s, r) => s + Number(r.total), 0);
  const costs = (expenses || []).reduce((s, r) => s + Number(r.amount_incl), 0);
  const profit = revenue - costs;

  const periodLabel = /jaar/i.test(question) ? 'dit jaar' : /kwartaal/i.test(question) ? 'dit kwartaal' : 'deze maand';

  return {
    answer: `Resultaat ${periodLabel}: ${formatEur(revenue)} omzet - ${formatEur(costs)} kosten = ${formatEur(profit)} ${profit >= 0 ? 'winst' : 'verlies'}.`,
    data: [
      { label: 'Omzet', value: revenue },
      { label: 'Kosten', value: costs },
      { label: 'Resultaat', value: profit },
    ],
    type: 'chart',
    suggestions: ['Omzet dit jaar', 'Wat zijn mijn uitgaven?', 'Hoeveel BTW moet ik afdragen?'],
  };
}

async function getBtwQuery(_question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  const quarter = getCurrentQuarterRange();
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  const year = now.getFullYear();

  // BTW output: from paid invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_btw')
    .eq('user_id', userId)
    .eq('status', 'betaald')
    .gte('date', quarter.start)
    .lte('date', quarter.end);

  const btwOutput = (invoices || []).reduce((s, r) => s + Number(r.total_btw), 0);

  // BTW input: from expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('btw_amount')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', q);

  const btwInput = (expenses || []).reduce((s, r) => s + Number(r.btw_amount), 0);
  const btwToPay = btwOutput - btwInput;

  return {
    answer: `BTW Q${q} ${year}: ${formatEur(btwOutput)} (af te dragen) - ${formatEur(btwInput)} (voorbelasting) = ${formatEur(btwToPay)} ${btwToPay >= 0 ? 'af te dragen' : 'terug te ontvangen'}.`,
    data: [
      { label: 'BTW output', value: btwOutput },
      { label: 'BTW input', value: btwInput },
      { label: 'Saldo', value: btwToPay },
    ],
    type: 'chart',
    suggestions: ['Hoeveel winst heb ik gemaakt?', 'Omzet dit kwartaal', 'Openstaande facturen'],
  };
}

async function getClientQuery(_question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId);

  const clientList = clients || [];

  if (clientList.length === 0) {
    return {
      answer: 'Je hebt nog geen klanten aangemaakt.',
      type: 'text',
      suggestions: ['Nieuwe factuur', 'Omzet dit kwartaal'],
    };
  }

  // Revenue per client
  const clientRevenue: { label: string; value: number }[] = [];
  for (const client of clientList) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total')
      .eq('user_id', userId)
      .eq('client_id', client.id)
      .eq('status', 'betaald');

    const total = (invoices || []).reduce((s, r) => s + Number(r.total), 0);
    clientRevenue.push({ label: client.name, value: total });
  }
  clientRevenue.sort((a, b) => b.value - a.value);

  return {
    answer: `Je hebt ${clientList.length} ${clientList.length === 1 ? 'klant' : 'klanten'}. Top klant: ${clientRevenue[0]?.label || '-'} (${formatEur(clientRevenue[0]?.value || 0)}).`,
    data: clientRevenue.slice(0, 10),
    type: 'chart',
    suggestions: ['Openstaande facturen', 'Omzet dit jaar', 'Hoeveel uur heb ik gewerkt?'],
  };
}

async function getHoursQuery(question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  let start: string;
  let end: string;
  let periodLabel: string;

  if (/maand/i.test(question)) {
    const r = getCurrentMonthRange();
    start = r.start;
    end = r.end;
    periodLabel = 'deze maand';
  } else {
    const r = getCurrentWeekRange();
    start = r.start;
    end = r.end;
    periodLabel = 'deze week';
  }

  const { data: entries } = await supabase
    .from('time_entries')
    .select('duration_minutes, project_id')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  const rows = entries || [];
  const totalMinutes = rows.reduce((s, r) => s + (r.duration_minutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Count unique projects
  const uniqueProjects = new Set(rows.map((r) => r.project_id)).size;

  // Group by project
  const projectMap: Record<string, number> = {};
  rows.forEach((r) => {
    const pid = r.project_id || 'overig';
    projectMap[pid] = (projectMap[pid] || 0) + (r.duration_minutes || 0);
  });

  // Try to get project names
  const projectIds = Object.keys(projectMap).filter((k) => k !== 'overig');
  let projectData: { label: string; value: number }[] = [];

  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds);

    const nameMap: Record<string, string> = {};
    (projects || []).forEach((p) => { nameMap[p.id] = p.name; });

    projectData = Object.entries(projectMap).map(([pid, mins]) => ({
      label: nameMap[pid] || 'Overig',
      value: Math.round((mins / 60) * 10) / 10,
    }));
    projectData.sort((a, b) => b.value - a.value);
  }

  return {
    answer: rows.length === 0
      ? `Je hebt ${periodLabel} nog geen uren geregistreerd.`
      : `Je hebt ${periodLabel} ${totalHours} uur geregistreerd over ${uniqueProjects} ${uniqueProjects === 1 ? 'project' : 'projecten'}.`,
    data: projectData.length > 0 ? projectData : undefined,
    type: projectData.length > 0 ? 'chart' : 'text',
    suggestions: ['Omzet dit kwartaal', 'Openstaande facturen', 'Wat zijn mijn uitgaven?'],
  };
}

async function getInvoiceQuery(_question: string, userId: string): Promise<AssistantResponse> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('status, total')
    .eq('user_id', userId);

  const rows = invoices || [];
  const byStatus: Record<string, { count: number; total: number }> = {};
  rows.forEach((r) => {
    const s = r.status || 'onbekend';
    if (!byStatus[s]) byStatus[s] = { count: 0, total: 0 };
    byStatus[s].count++;
    byStatus[s].total += Number(r.total);
  });

  const statusLabels: Record<string, string> = {
    concept: 'Concept',
    verzonden: 'Verzonden',
    betaald: 'Betaald',
  };

  const parts = Object.entries(byStatus).map(([status, info]) =>
    `${info.count} ${statusLabels[status] || status} (${formatEur(info.total)})`
  );

  const chartData = Object.entries(byStatus).map(([status, info]) => ({
    label: statusLabels[status] || status,
    value: info.total,
  }));

  return {
    answer: rows.length === 0
      ? 'Je hebt nog geen facturen aangemaakt.'
      : `Je hebt ${rows.length} facturen: ${parts.join(', ')}.`,
    data: chartData.length > 0 ? chartData : undefined,
    type: chartData.length > 0 ? 'chart' : 'text',
    suggestions: ['Openstaande facturen', 'Omzet dit kwartaal', 'Hoeveel winst heb ik?'],
  };
}

// ============================================
// Pattern matching
// ============================================

const QUERY_PATTERNS: {
  pattern: RegExp;
  handler: (question: string, userId: string) => Promise<AssistantResponse>;
}[] = [
  { pattern: /omzet.*(maand|kwartaal|jaar)/i, handler: getRevenueQuery },
  { pattern: /omzet/i, handler: getRevenueQuery },
  { pattern: /openstaand|onbetaald|open.*factuur/i, handler: getOutstandingQuery },
  { pattern: /uitgaven|kosten/i, handler: getExpensesQuery },
  { pattern: /winst|verlies|resultaat/i, handler: getProfitQuery },
  { pattern: /btw|belasting/i, handler: getBtwQuery },
  { pattern: /klant|client/i, handler: getClientQuery },
  { pattern: /uren|tijd|uur|gewerkt/i, handler: getHoursQuery },
  { pattern: /factuur|facturen/i, handler: getInvoiceQuery },
];

// ============================================
// Main entry point
// ============================================

export async function askFinancialQuestion(question: string): Promise<AssistantResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      answer: 'Je bent niet ingelogd. Log eerst in om financiële vragen te stellen.',
      type: 'text',
    };
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: 'Stel een vraag over je financiën, bijvoorbeeld "Hoeveel omzet heb ik dit kwartaal?"',
      type: 'text',
      suggestions: [
        'Omzet dit kwartaal',
        'Openstaande facturen',
        'BTW overzicht',
        'Uren deze week',
      ],
    };
  }

  // Find the first matching pattern
  for (const { pattern, handler } of QUERY_PATTERNS) {
    if (pattern.test(trimmed)) {
      try {
        return await handler(trimmed, user.id);
      } catch (err: any) {
        console.error('Assistant query error:', err);
        return {
          answer: 'Er is een fout opgetreden bij het ophalen van de gegevens. Probeer het opnieuw.',
          type: 'text',
        };
      }
    }
  }

  // No pattern matched
  return {
    answer: `Ik begrijp je vraag helaas niet. Probeer een van de volgende onderwerpen: omzet, openstaande facturen, uitgaven, winst/verlies, BTW, klanten, uren of facturen.`,
    type: 'text',
    suggestions: [
      'Hoeveel omzet heb ik dit kwartaal?',
      'Hoeveel staat er open?',
      'Wat zijn mijn uitgaven deze maand?',
      'Hoeveel BTW moet ik afdragen?',
      'Hoeveel uur heb ik deze week gewerkt?',
    ],
  };
}
