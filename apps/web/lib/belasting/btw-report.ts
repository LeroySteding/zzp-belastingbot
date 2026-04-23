'use server';

import { createClient } from '@/lib/supabase/server';

export interface BTWAangifteData {
  year: number;
  quarter: number;
  period: string; // "Q1 2024"

  // Rubrieken (Belastingdienst formulier velden)
  rubriek1a: { description: string; amount: number }; // Leveringen/diensten belast met hoog tarief (21%)
  rubriek1b: { description: string; amount: number }; // Leveringen/diensten belast met laag tarief (9%)
  rubriek1e: { description: string; amount: number }; // Leveringen/diensten belast met 0% / vrijgesteld

  rubriek5a: { description: string; amount: number }; // Verschuldigde BTW (output tax)
  rubriek5b: { description: string; amount: number }; // Voorbelasting (input tax from expenses)

  totalOwed: number; // 5a - 5b (positief = te betalen, negatief = terug te vragen)

  // Deadline informatie
  deadline: string; // Datum van de deadline
  deadlineDaysRemaining: number;
  deadlineUrgency: 'green' | 'orange' | 'red';

  // Detail data
  invoices21: Array<{ number: string; client: string; subtotal: number; btw: number }>;
  invoices9: Array<{ number: string; client: string; subtotal: number; btw: number }>;
  invoices0: Array<{ number: string; client: string; subtotal: number }>;
  expenses: Array<{ description: string; amount: number; btw: number; category: string; date: string }>;

  // Samenvattingen
  totalRevenue: number;
  totalExpenses: number;
  invoiceCount: number;
  expenseCount: number;
}

/**
 * Bereken de BTW-aangifte deadline voor een gegeven kwartaal
 * Q1 (jan-mrt): deadline 30 april
 * Q2 (apr-jun): deadline 31 juli
 * Q3 (jul-sep): deadline 31 oktober
 * Q4 (okt-dec): deadline 31 januari volgend jaar
 */
function getDeadlineForQuarter(year: number, quarter: number): { deadline: Date; label: string } {
  let deadline: Date;
  switch (quarter) {
    case 1:
      deadline = new Date(year, 3, 30, 23, 59, 59); // 30 april
      break;
    case 2:
      deadline = new Date(year, 6, 31, 23, 59, 59); // 31 juli
      break;
    case 3:
      deadline = new Date(year, 9, 31, 23, 59, 59); // 31 oktober
      break;
    case 4:
      deadline = new Date(year + 1, 0, 31, 23, 59, 59); // 31 januari volgend jaar
      break;
    default:
      deadline = new Date(year, 3, 30, 23, 59, 59);
  }

  const label = deadline.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return { deadline, label };
}

export async function generateBTWAangifte(year: number, quarter: number): Promise<BTWAangifteData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Datumbereik voor kwartaal
  const startMonth = (quarter - 1) * 3;
  const startDate = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
  const endMonth = startMonth + 3;
  const endDate = endMonth >= 12
    ? `${year + 1}-01-01`
    : `${year}-${String(endMonth + 1).padStart(2, '0')}-01`;

  // Haal betaalde facturen op voor het kwartaal met hun regels
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), clients(name)')
    .eq('user_id', user.id)
    .eq('status', 'betaald')
    .gte('date', startDate)
    .lt('date', endDate);

  // Haal uitgaven op voor het kwartaal
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lt('date', endDate);

  // Bereken rubrieken
  let revenue21 = 0, btw21 = 0;
  let revenue9 = 0, btw9 = 0;
  let revenue0 = 0;
  let inputBtw = 0;

  const invoices21List: Array<{ number: string; client: string; subtotal: number; btw: number }> = [];
  const invoices9List: Array<{ number: string; client: string; subtotal: number; btw: number }> = [];
  const invoices0List: Array<{ number: string; client: string; subtotal: number }> = [];

  for (const inv of invoices || []) {
    const clientName = (inv.clients as any)?.name || 'Onbekend';
    let invRevenue21 = 0, invBtw21 = 0;
    let invRevenue9 = 0, invBtw9 = 0;
    let invRevenue0 = 0;

    for (const item of inv.invoice_items || []) {
      const lineTotal = Number(item.quantity) * Number(item.unit_price);
      const lineBtw = lineTotal * Number(item.btw_rate) / 100;

      if (item.btw_rate === 21) {
        revenue21 += lineTotal;
        btw21 += lineBtw;
        invRevenue21 += lineTotal;
        invBtw21 += lineBtw;
      } else if (item.btw_rate === 9) {
        revenue9 += lineTotal;
        btw9 += lineBtw;
        invRevenue9 += lineTotal;
        invBtw9 += lineBtw;
      } else {
        revenue0 += lineTotal;
        invRevenue0 += lineTotal;
      }
    }

    // Voeg toe aan detaillijsten
    if (invRevenue21 > 0) {
      invoices21List.push({
        number: inv.invoice_number,
        client: clientName,
        subtotal: Math.round(invRevenue21 * 100) / 100,
        btw: Math.round(invBtw21 * 100) / 100,
      });
    }
    if (invRevenue9 > 0) {
      invoices9List.push({
        number: inv.invoice_number,
        client: clientName,
        subtotal: Math.round(invRevenue9 * 100) / 100,
        btw: Math.round(invBtw9 * 100) / 100,
      });
    }
    if (invRevenue0 > 0) {
      invoices0List.push({
        number: inv.invoice_number,
        client: clientName,
        subtotal: Math.round(invRevenue0 * 100) / 100,
      });
    }
  }

  // Bereken voorbelasting (input BTW) uit uitgaven
  const totalExpensesAmount = (expenses || []).reduce(
    (sum, e) => sum + Number(e.amount_excl || 0),
    0
  );

  for (const exp of expenses || []) {
    inputBtw += Number(exp.btw_amount || 0);
  }

  // Deadline informatie
  const { deadline, label: deadlineLabel } = getDeadlineForQuarter(year, quarter);
  const now = new Date();
  const deadlineDaysRemaining = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  let deadlineUrgency: 'green' | 'orange' | 'red';
  if (deadlineDaysRemaining > 30) deadlineUrgency = 'green';
  else if (deadlineDaysRemaining > 7) deadlineUrgency = 'orange';
  else deadlineUrgency = 'red';

  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

  const totalRevenue = revenue21 + revenue9 + revenue0;

  return {
    year,
    quarter,
    period: `${quarterNames[quarter - 1]} ${year}`,
    rubriek1a: {
      description: 'Leveringen/diensten belast met hoog tarief',
      amount: Math.round(revenue21 * 100) / 100,
    },
    rubriek1b: {
      description: 'Leveringen/diensten belast met laag tarief',
      amount: Math.round(revenue9 * 100) / 100,
    },
    rubriek1e: {
      description: 'Leveringen/diensten belast met 0% of vrijgesteld',
      amount: Math.round(revenue0 * 100) / 100,
    },
    rubriek5a: {
      description: 'Verschuldigde omzetbelasting',
      amount: Math.round((btw21 + btw9) * 100) / 100,
    },
    rubriek5b: {
      description: 'Voorbelasting',
      amount: Math.round(inputBtw * 100) / 100,
    },
    totalOwed: Math.round((btw21 + btw9 - inputBtw) * 100) / 100,
    deadline: deadlineLabel,
    deadlineDaysRemaining,
    deadlineUrgency,
    invoices21: invoices21List,
    invoices9: invoices9List,
    invoices0: invoices0List,
    expenses: (expenses || []).map((e) => ({
      description: e.description,
      amount: Number(e.amount_excl || 0),
      btw: Number(e.btw_amount || 0),
      category: e.category,
      date: e.date,
    })),
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpensesAmount * 100) / 100,
    invoiceCount: (invoices || []).length,
    expenseCount: (expenses || []).length,
  };
}

