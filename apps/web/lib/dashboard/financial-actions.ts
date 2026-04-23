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

export interface MonthlyData {
  month: number;
  monthName: string;
  income: number;
  pendingRevenue: number;
  expenses: number;
  profit: number;
  btwOutput: number;
  btwInput: number;
  btwBalance: number;
  invoiceCount: number;
  expenseCount: number;
}

export interface FinancialOverview {
  year: number;
  months: MonthlyData[];
  yearTotal: { income: number; pendingRevenue: number; expenses: number; profit: number; btw: number };
  forecast: MonthlyData[];
  expensesByCategory: { category: string; amount: number }[];
  korActive: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

// ============================================
// FINANCIAL OVERVIEW
// ============================================

export async function getFinancialOverview(year: number): Promise<FinancialOverview> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyOverview: FinancialOverview = {
    year,
    months: [],
    yearTotal: { income: 0, pendingRevenue: 0, expenses: 0, profit: 0, btw: 0 },
    forecast: [],
    expensesByCategory: [],
    korActive: false,
  };

  if (!user) return emptyOverview;

  // Check KOR (Kleineondernemersregeling) status from profile.
  // kor_enabled is a boolean column added via migration 20240103000000_advanced_features.
  // If the profile or field does not exist, default to false.
  const { data: profile } = await supabase
    .from('profiles')
    .select('kor_enabled')
    .eq('id', user.id)
    .single();

  const korEnabled: boolean = profile?.kor_enabled ?? false;

  // Fetch paid invoices (recognized revenue) for the year
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select(`
      id, date, status, subtotal, total_btw, total,
      invoice_items (quantity, unit_price, btw_rate)
    `)
    .eq('user_id', user.id)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .in('status', ['betaald']);

  // Fetch sent-but-unpaid invoices (pending revenue / openstaand)
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select(`
      id, date, status, subtotal, total_btw, total
    `)
    .eq('user_id', user.id)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .in('status', ['verzonden']);

  // Fetch expenses for the year
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year);

  // Build monthly data
  const monthlyMap: Record<number, MonthlyData> = {};
  for (let m = 1; m <= 12; m++) {
    monthlyMap[m] = {
      month: m,
      monthName: MONTH_NAMES[m - 1],
      income: 0,
      pendingRevenue: 0,
      expenses: 0,
      profit: 0,
      btwOutput: 0,
      btwInput: 0,
      btwBalance: 0,
      invoiceCount: 0,
      expenseCount: 0,
    };
  }

  // Aggregate paid invoice income by month (recognized revenue)
  if (paidInvoices) {
    for (const inv of paidInvoices) {
      const month = new Date(inv.date).getMonth() + 1;
      const md = monthlyMap[month];
      md.income += Number(inv.subtotal) || 0;
      md.btwOutput += Number(inv.total_btw) || 0;
      md.invoiceCount += 1;
    }
  }

  // Aggregate pending (verzonden) invoices as openstaand revenue
  if (pendingInvoices) {
    for (const inv of pendingInvoices) {
      const month = new Date(inv.date).getMonth() + 1;
      const md = monthlyMap[month];
      md.pendingRevenue += Number(inv.subtotal) || 0;
    }
  }

  // Aggregate expenses by month and category
  const categoryTotals: Record<string, number> = {};
  if (expenses) {
    for (const exp of expenses) {
      const month = new Date(exp.date).getMonth() + 1;
      const md = monthlyMap[month];
      md.expenses += Number(exp.amount_excl) || 0;
      md.btwInput += Number(exp.btw_amount) || 0;
      md.expenseCount += 1;

      const cat = exp.category || 'Overig';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount_excl);
    }
  }

  // Determine KOR active status: enabled in profile AND yearly revenue < 20000
  const yearlyIncomeRaw = Object.values(monthlyMap).reduce((s, md) => s + md.income, 0);
  const korActive = korEnabled && yearlyIncomeRaw < 20000;

  // Calculate profit and BTW balance per month
  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
  const actualMonths: MonthlyData[] = [];

  for (let m = 1; m <= 12; m++) {
    const md = monthlyMap[m];

    // KOR users don't charge or reclaim BTW
    if (korActive) {
      md.btwOutput = 0;
      md.btwInput = 0;
    }

    md.profit = round2(md.income - md.expenses);
    md.btwBalance = round2(md.btwOutput - md.btwInput);
    md.income = round2(md.income);
    md.pendingRevenue = round2(md.pendingRevenue);
    md.expenses = round2(md.expenses);
    md.btwOutput = round2(md.btwOutput);
    md.btwInput = round2(md.btwInput);

    if (m <= currentMonth) {
      actualMonths.push(md);
    }
  }

  // Calculate year totals (actual months only)
  const yearTotal = {
    income: round2(actualMonths.reduce((s, m) => s + m.income, 0)),
    pendingRevenue: round2(actualMonths.reduce((s, m) => s + m.pendingRevenue, 0)),
    expenses: round2(actualMonths.reduce((s, m) => s + m.expenses, 0)),
    profit: round2(actualMonths.reduce((s, m) => s + m.profit, 0)),
    btw: round2(actualMonths.reduce((s, m) => s + m.btwBalance, 0)),
  };

  // Forecasting: average of last 3 actual months, project forward
  const forecast: MonthlyData[] = [];
  if (currentMonth < 12 && new Date().getFullYear() === year) {
    const lookback = actualMonths.slice(-3);
    const avgIncome = lookback.length > 0
      ? lookback.reduce((s, m) => s + m.income, 0) / lookback.length : 0;
    const avgPendingRevenue = lookback.length > 0
      ? lookback.reduce((s, m) => s + m.pendingRevenue, 0) / lookback.length : 0;
    const avgExpenses = lookback.length > 0
      ? lookback.reduce((s, m) => s + m.expenses, 0) / lookback.length : 0;
    const avgBtwOutput = lookback.length > 0
      ? lookback.reduce((s, m) => s + m.btwOutput, 0) / lookback.length : 0;
    const avgBtwInput = lookback.length > 0
      ? lookback.reduce((s, m) => s + m.btwInput, 0) / lookback.length : 0;

    for (let m = currentMonth + 1; m <= 12; m++) {
      forecast.push({
        month: m,
        monthName: MONTH_NAMES[m - 1],
        income: round2(avgIncome),
        pendingRevenue: round2(avgPendingRevenue),
        expenses: round2(avgExpenses),
        profit: round2(avgIncome - avgExpenses),
        btwOutput: round2(avgBtwOutput),
        btwInput: round2(avgBtwInput),
        btwBalance: round2(avgBtwOutput - avgBtwInput),
        invoiceCount: 0,
        expenseCount: 0,
      });
    }
  }

  const expensesByCategory = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);

  return {
    year,
    months: actualMonths,
    yearTotal,
    forecast,
    expensesByCategory,
    korActive,
  };
}

// ============================================
// CSV EXPORT
// ============================================

export async function exportFinancialCSV(year: number): Promise<string> {
  const overview = await getFinancialOverview(year);

  const rows: string[] = [
    'Maand,Omzet,Kosten,Winst,BTW Af te dragen,BTW Voorbelasting,BTW Saldo,Facturen,Uitgaven',
  ];

  for (const m of overview.months) {
    rows.push(
      `${m.monthName},${m.income.toFixed(2)},${m.expenses.toFixed(2)},${m.profit.toFixed(2)},${m.btwOutput.toFixed(2)},${m.btwInput.toFixed(2)},${m.btwBalance.toFixed(2)},${m.invoiceCount},${m.expenseCount}`
    );
  }

  if (overview.forecast.length > 0) {
    rows.push('');
    rows.push('Prognose');
    for (const m of overview.forecast) {
      rows.push(
        `${m.monthName} (prognose),${m.income.toFixed(2)},${m.expenses.toFixed(2)},${m.profit.toFixed(2)},${m.btwOutput.toFixed(2)},${m.btwInput.toFixed(2)},${m.btwBalance.toFixed(2)},0,0`
      );
    }
  }

  rows.push('');
  rows.push(
    `Totaal ${year},${overview.yearTotal.income.toFixed(2)},${overview.yearTotal.expenses.toFixed(2)},${overview.yearTotal.profit.toFixed(2)},${overview.yearTotal.btw.toFixed(2)},,,`
  );

  return rows.join('\n');
}
