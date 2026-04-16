'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

export interface MonthlyData {
  month: number;
  monthName: string;
  income: number;
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
  yearTotal: { income: number; expenses: number; profit: number; btw: number };
  forecast: MonthlyData[];
  expensesByCategory: { category: string; amount: number }[];
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
    yearTotal: { income: 0, expenses: 0, profit: 0, btw: 0 },
    forecast: [],
    expensesByCategory: [],
  };

  if (!user) return emptyOverview;

  // Fetch paid invoices for the year
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, date, status, subtotal, total_btw, total,
      invoice_items (quantity, unit_price, btw_rate)
    `)
    .eq('user_id', user.id)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .in('status', ['betaald', 'verzonden']);

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
      expenses: 0,
      profit: 0,
      btwOutput: 0,
      btwInput: 0,
      btwBalance: 0,
      invoiceCount: 0,
      expenseCount: 0,
    };
  }

  // Aggregate invoice income by month
  if (invoices) {
    for (const inv of invoices) {
      const month = new Date(inv.date).getMonth() + 1;
      const md = monthlyMap[month];
      md.income += Number(inv.subtotal) || 0;
      md.btwOutput += Number(inv.total_btw) || 0;
      md.invoiceCount += 1;
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

  // Calculate profit and BTW balance per month
  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
  const actualMonths: MonthlyData[] = [];

  for (let m = 1; m <= 12; m++) {
    const md = monthlyMap[m];
    md.profit = md.income - md.expenses;
    md.btwBalance = md.btwOutput - md.btwInput;
    if (m <= currentMonth) {
      actualMonths.push(md);
    }
  }

  // Calculate year totals (actual months only)
  const yearTotal = {
    income: actualMonths.reduce((s, m) => s + m.income, 0),
    expenses: actualMonths.reduce((s, m) => s + m.expenses, 0),
    profit: actualMonths.reduce((s, m) => s + m.profit, 0),
    btw: actualMonths.reduce((s, m) => s + m.btwBalance, 0),
  };

  // Forecasting: average of last 3 actual months, project forward
  const forecast: MonthlyData[] = [];
  if (currentMonth < 12 && new Date().getFullYear() === year) {
    const lookback = actualMonths.slice(-3);
    const avgIncome = lookback.length > 0
      ? lookback.reduce((s, m) => s + m.income, 0) / lookback.length : 0;
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
        income: Math.round(avgIncome * 100) / 100,
        expenses: Math.round(avgExpenses * 100) / 100,
        profit: Math.round((avgIncome - avgExpenses) * 100) / 100,
        btwOutput: Math.round(avgBtwOutput * 100) / 100,
        btwInput: Math.round(avgBtwInput * 100) / 100,
        btwBalance: Math.round((avgBtwOutput - avgBtwInput) * 100) / 100,
        invoiceCount: 0,
        expenseCount: 0,
      });
    }
  }

  const expensesByCategory = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  return {
    year,
    months: actualMonths,
    yearTotal,
    forecast,
    expensesByCategory,
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
