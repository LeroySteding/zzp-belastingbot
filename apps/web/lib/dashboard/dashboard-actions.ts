'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// HELPERS
// ============================================

/** Round a number to 2 decimal places for consistent currency formatting. */
const round2 = (n: number) => Math.round(n * 100) / 100;

// ============================================
// TYPES
// ============================================

export interface RevenueByMonth {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface InvoiceAgingData {
  label: string;
  count: number;
  total: number;
  color: string;
}

export interface TopClient {
  clientName: string;
  revenue: number;
  invoiceCount: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface CashFlowData {
  income: number;
  expenses: number;
  net: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface UpcomingDeadline {
  type: string;
  title: string;
  date: string;
  daysRemaining: number;
  urgency: 'green' | 'orange' | 'red';
  href: string;
}

export interface DashboardSummary {
  revenueByMonth: RevenueByMonth[];
  invoiceAging: InvoiceAgingData[];
  topClients: TopClient[];
  expenseCategories: ExpenseCategory[];
  cashFlow: CashFlowData;
  deadlines: UpcomingDeadline[];
  totalRevenue: number;
  revenueTrend: number;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec',
];

function emptySummary(): DashboardSummary {
  return {
    revenueByMonth: [],
    invoiceAging: [],
    topClients: [],
    expenseCategories: [],
    cashFlow: { income: 0, expenses: 0, net: 0, trend: 'neutral' },
    deadlines: [],
    totalRevenue: 0,
    revenueTrend: 0,
  };
}

// ============================================
// MAIN FUNCTION
// ============================================

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return emptySummary();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  // Run all queries in parallel
  const [
    invoicesResult,
    expensesResult,
    agingResult,
    topClientsResult,
    projectDeadlinesResult,
  ] = await Promise.all([
    // 1. Revenue invoices (last 6 months) - only 'betaald' counts as recognized revenue
    supabase
      .from('invoices')
      .select('id, date, status, subtotal, total')
      .eq('user_id', user.id)
      .in('status', ['betaald'])
      .gte('date', sixMonthsAgoStr)
      .order('date', { ascending: true }),

    // 2. Expenses (last 6 months)
    supabase
      .from('expenses')
      .select('id, date, amount_excl, amount_incl, category')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgoStr),

    // 3. Invoice aging (open invoices)
    supabase
      .from('invoices')
      .select('id, invoice_number, due_date, total, client_id')
      .eq('user_id', user.id)
      .eq('status', 'verzonden'),

    // 4. Top clients (current year paid invoices with clients)
    supabase
      .from('invoices')
      .select('id, subtotal, total, client_id, clients(name)')
      .eq('user_id', user.id)
      .in('status', ['betaald'])
      .gte('date', yearStart)
      .lte('date', yearEnd),

    // 5. Project deadlines within 30 days
    supabase
      .from('projects')
      .select('id, name, deadline, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .not('deadline', 'is', null)
      .lte('deadline', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ]);

  const invoices = invoicesResult.data || [];
  const expenses = expensesResult.data || [];
  const agingInvoices = agingResult.data || [];
  const clientInvoices = topClientsResult.data || [];
  const projectDeadlines = projectDeadlinesResult.data || [];

  // ---- Revenue by Month ----
  const monthlyMap: Record<string, { income: number; expenses: number }> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = { income: 0, expenses: 0 };
  }

  for (const inv of invoices) {
    const d = new Date(inv.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap[key]) {
      monthlyMap[key].income += Number(inv.subtotal) || 0;
    }
  }

  for (const exp of expenses) {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap[key]) {
      monthlyMap[key].expenses += Number(exp.amount_excl) || 0;
    }
  }

  // Also group expenses by category
  const categoryTotals: Record<string, number> = {};
  let totalExpenseAmount = 0;
  for (const exp of expenses) {
    const cat = exp.category || 'Overig';
    const amt = Number(exp.amount_excl) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalExpenseAmount += amt;
  }

  const revenueByMonth: RevenueByMonth[] = Object.entries(monthlyMap).map(([key, val]) => {
    const [yr, mo] = key.split('-');
    const monthIdx = parseInt(mo, 10) - 1;
    return {
      month: MONTH_NAMES_SHORT[monthIdx],
      income: round2(val.income),
      expenses: round2(val.expenses),
      profit: round2(val.income - val.expenses),
    };
  });

  // ---- Invoice Aging ----
  const agingBuckets = {
    opTijd: { count: 0, total: 0 },
    binnenkort: { count: 0, total: 0 },
    verlopen: { count: 0, total: 0 },
  };

  for (const inv of agingInvoices) {
    const dueDate = new Date(inv.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const total = Number(inv.total) || 0;

    if (diffDays < 0) {
      agingBuckets.verlopen.count++;
      agingBuckets.verlopen.total += total;
    } else if (diffDays <= 7) {
      agingBuckets.binnenkort.count++;
      agingBuckets.binnenkort.total += total;
    } else {
      agingBuckets.opTijd.count++;
      agingBuckets.opTijd.total += total;
    }
  }

  const invoiceAging: InvoiceAgingData[] = [
    { label: 'Op tijd', count: agingBuckets.opTijd.count, total: round2(agingBuckets.opTijd.total), color: '#22c55e' },
    { label: 'Binnenkort', count: agingBuckets.binnenkort.count, total: round2(agingBuckets.binnenkort.total), color: '#f97316' },
    { label: 'Verlopen', count: agingBuckets.verlopen.count, total: round2(agingBuckets.verlopen.total), color: '#ef4444' },
  ];

  // ---- Top Clients ----
  const clientMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const inv of clientInvoices) {
    const clientId = inv.client_id || 'unknown';
    const clientData = inv.clients as any;
    const clientName = clientData?.name || 'Onbekend';
    if (!clientMap[clientId]) {
      clientMap[clientId] = { name: clientName, revenue: 0, count: 0 };
    }
    clientMap[clientId].revenue += Number(inv.subtotal) || 0;
    clientMap[clientId].count += 1;
  }

  const topClients: TopClient[] = Object.values(clientMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(c => ({
      clientName: c.name,
      revenue: round2(c.revenue),
      invoiceCount: c.count,
    }));

  // ---- Expense Categories ----
  const expenseCategories: ExpenseCategory[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percentage: totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ---- Cash Flow ----
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const currentData = monthlyMap[currentMonthKey] || { income: 0, expenses: 0 };
  const prevData = monthlyMap[prevMonthKey] || { income: 0, expenses: 0 };

  const currentNet = currentData.income - currentData.expenses;
  const prevNet = prevData.income - prevData.expenses;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (currentNet > prevNet) trend = 'up';
  else if (currentNet < prevNet) trend = 'down';

  const cashFlow: CashFlowData = {
    income: round2(currentData.income),
    expenses: round2(currentData.expenses),
    net: round2(currentNet),
    trend,
  };

  // ---- Total Revenue & Trend ----
  const totalRevenue = revenueByMonth.reduce((sum, m) => sum + m.income, 0);
  const currentMonthIncome = currentData.income;
  const prevMonthIncome = prevData.income;
  const revenueTrend = prevMonthIncome > 0
    ? Math.round(((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100)
    : 0;

  // ---- Deadlines ----
  const deadlines: UpcomingDeadline[] = [];

  // Overdue invoices as deadlines
  for (const inv of agingInvoices) {
    const dueDate = new Date(inv.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      let urgency: 'green' | 'orange' | 'red' = 'green';
      if (diffDays < 0) urgency = 'red';
      else if (diffDays <= 3) urgency = 'orange';

      deadlines.push({
        type: 'factuur',
        title: `Factuur ${inv.invoice_number || inv.id.slice(0, 8)}`,
        date: inv.due_date,
        daysRemaining: diffDays,
        urgency,
        href: `/factuur/invoices/${inv.id}`,
      });
    }
  }

  // BTW deadline: next quarter end + 1 month
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const quarterEndMonth = currentQuarter * 3;
  const btwDeadline = new Date(currentYear, quarterEndMonth, 1); // 1st of month after quarter end = last day of quarter end month +1
  // Actually: quarter end month (0-indexed) = quarterEndMonth - 1. Deadline = 1 month after quarter end.
  // Quarter 1 ends Mar 31, deadline Apr 30. Quarter 2 ends Jun 30, deadline Jul 31, etc.
  const btwDeadlineDate = new Date(currentYear, quarterEndMonth, 0); // last day of quarterEndMonth
  // Deadline is end of next month after quarter: e.g. Q1 -> deadline last day of April
  const btwFinalDeadline = new Date(currentYear, quarterEndMonth + 1, 0); // last day of month after quarter end
  const btwDaysRemaining = Math.ceil((btwFinalDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (btwDaysRemaining > 0 && btwDaysRemaining <= 60) {
    let btwUrgency: 'green' | 'orange' | 'red' = 'green';
    if (btwDaysRemaining <= 7) btwUrgency = 'red';
    else if (btwDaysRemaining <= 14) btwUrgency = 'orange';

    deadlines.push({
      type: 'btw',
      title: `BTW Aangifte Q${currentQuarter}`,
      date: btwFinalDeadline.toISOString().split('T')[0],
      daysRemaining: btwDaysRemaining,
      urgency: btwUrgency,
      href: '/belasting',
    });
  }

  // Project deadlines
  for (const proj of projectDeadlines) {
    if (!proj.deadline) continue;
    const deadlineDate = new Date(proj.deadline);
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let urgency: 'green' | 'orange' | 'red' = 'green';
    if (daysRemaining < 0) urgency = 'red';
    else if (daysRemaining <= 7) urgency = 'orange';

    deadlines.push({
      type: 'project',
      title: proj.name,
      date: proj.deadline,
      daysRemaining,
      urgency,
      href: `/uren/projects`,
    });
  }

  // Sort deadlines by days remaining (most urgent first)
  deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    revenueByMonth,
    invoiceAging,
    topClients,
    expenseCategories,
    cashFlow,
    deadlines,
    totalRevenue: round2(totalRevenue),
    revenueTrend,
  };
}
