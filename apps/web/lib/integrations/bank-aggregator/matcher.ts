/**
 * Bank Transactie Matcher
 *
 * Automatische matching van banktransacties met bestaande facturen en uitgaven.
 * Gebruikt verschillende strategieen om transacties te koppelen:
 *
 * Inkomende betalingen (positieve bedragen):
 * 1. Exact bedrag matchen met onbetaalde facturen
 * 2. Omschrijving matchen met factuurnummer
 * 3. Tegenpartijnaam matchen met klant
 *
 * Uitgaande betalingen (negatieve bedragen):
 * 1. Bedrag + datum matchen met bestaande uitgaven
 * 2. Automatische categorisering op basis van trefwoorden
 * 3. Suggestie voor nieuwe uitgave
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { BankTransaction, TransactionMatch } from './types';

// ---------------------------------------------------------------------------
// Categorie trefwoorden voor automatische classificatie
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Telefoon/Internet': [
    'kpn',
    't-mobile',
    'vodafone',
    'ziggo',
    'xs4all',
    'telfort',
    'tele2',
    'simyo',
    'hollandsnieuwe',
    'internet',
    'telefoon',
    'glasvezel',
  ],
  Reizen: [
    'ns ',
    'ns.nl',
    'ov-chipkaart',
    'ovchipkaart',
    'translink',
    'connexxion',
    'arriva',
    'gvb',
    'ret',
    'htm',
    'flixbus',
    'benzine',
    'shell',
    'bp ',
    'total ',
    'esso',
    'tinq',
    'parkeren',
    'q-park',
    'parking',
    'schiphol',
    'uber',
    'taxi',
  ],
  Software: [
    'microsoft',
    'adobe',
    'google ',
    'github',
    'gitlab',
    'atlassian',
    'jira',
    'slack',
    'zoom',
    'dropbox',
    'apple.com',
    'aws',
    'amazon web',
    'digitalocean',
    'heroku',
    'vercel',
    'netlify',
    'figma',
    'notion',
    'openai',
    'anthropic',
    'jetbrains',
    'canva',
    'mailchimp',
    'hubspot',
  ],
  Verzekeringen: [
    'cz ',
    'interpolis',
    'centraal beheer',
    'nationale nederlanden',
    'nn ',
    'aegon',
    'asr',
    'achmea',
    'zilveren kruis',
    'menzis',
    'vgz',
    'ohra',
    'delta lloyd',
    'allianz',
    'hema verzekering',
    'inshared',
  ],
  Kantoorkosten: [
    'mediamarkt',
    'coolblue',
    'bol.com',
    'amazon.nl',
    'ikea',
    'gamma',
    'praxis',
    'office',
    'staples',
    'bruna',
    'hema ',
    'action ',
  ],
  'Administratie/Boekhouding': [
    'kvk',
    'kamer van koophandel',
    'belastingdienst',
    'moneybird',
    'exact online',
    'e-boekhouden',
    'mollie',
    'accountant',
    'notaris',
    'administratie',
  ],
  Bankkosten: [
    'bankkosten',
    'rente',
    'stornokosten',
    'incassokosten',
    'overschrijvingskosten',
  ],
  'Eten en drinken': [
    'albert heijn',
    'jumbo',
    'lidl',
    'aldi',
    'plus ',
    'spar ',
    'dirk',
    'dekamarkt',
    'thuisbezorgd',
    'deliveroo',
    'uber eats',
    'dominos',
    'mcdonalds',
    'starbucks',
  ],
  'Opleiding/Cursussen': [
    'udemy',
    'coursera',
    'pluralsight',
    'linkedin learning',
    'skillshare',
    'opleiding',
    'cursus',
    'training',
    'workshop',
    'conferentie',
    'seminar',
  ],
  Marketing: [
    'facebook ads',
    'google ads',
    'linkedin ads',
    'twitter ads',
    'instagram',
    'reclame',
    'drukkerij',
    'visitekaartjes',
    'flyers',
  ],
};

// ---------------------------------------------------------------------------
// Hoofd-matcher functie
// ---------------------------------------------------------------------------

/**
 * Match banktransacties met bestaande facturen en uitgaven.
 *
 * @param transactions - Lijst van banktransacties om te matchen
 * @returns Lijst van match-resultaten per transactie
 */
export async function matchTransactions(
  transactions: BankTransaction[]
): Promise<TransactionMatch[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const matches: TransactionMatch[] = [];

  for (const tx of transactions) {
    if (tx.amount > 0) {
      // Inkomende betaling: probeer te matchen met facturen
      const invoiceMatch = await matchToInvoice(supabase, user.id, tx);
      if (invoiceMatch) {
        matches.push(invoiceMatch);
        continue;
      }
    } else {
      // Uitgaande betaling: probeer te matchen met uitgaven
      const expenseMatch = await matchToExpense(supabase, user.id, tx);
      if (expenseMatch) {
        matches.push(expenseMatch);
        continue;
      }
    }

    // Geen directe match gevonden: maak een suggestie
    const category = categorizeByKeywords(tx.description, tx.counterpartyName);
    matches.push({
      transactionId: tx.id,
      matchType: 'suggestion',
      confidence: category ? 0.6 : 0.2,
      suggestedCategory: category || 'Overig',
    });
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Factuur matching
// ---------------------------------------------------------------------------

/**
 * Probeer een inkomende betaling te matchen met een onbetaalde factuur.
 */
async function matchToInvoice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tx: BankTransaction
): Promise<TransactionMatch | null> {
  // Strategie 1: Exact bedrag matchen met onbetaalde facturen
  const { data: amountMatches } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, total_amount')
    .eq('user_id', userId)
    .eq('status', 'sent')
    .eq('total_amount', tx.amount)
    .limit(5);

  if (amountMatches && amountMatches.length === 1) {
    return {
      transactionId: tx.id,
      matchType: 'invoice',
      matchedId: amountMatches[0].id,
      matchedDescription: `Factuur ${amountMatches[0].invoice_number} - ${amountMatches[0].client_name}`,
      confidence: 0.85,
    };
  }

  // Strategie 2: Omschrijving matchen met factuurnummer
  if (tx.description || tx.reference) {
    const searchText = `${tx.description || ''} ${tx.reference || ''}`.toUpperCase();

    const { data: allUnpaid } = await supabase
      .from('invoices')
      .select('id, invoice_number, client_name, total_amount')
      .eq('user_id', userId)
      .eq('status', 'sent');

    if (allUnpaid) {
      for (const invoice of allUnpaid) {
        if (
          invoice.invoice_number &&
          searchText.includes(invoice.invoice_number.toUpperCase())
        ) {
          return {
            transactionId: tx.id,
            matchType: 'invoice',
            matchedId: invoice.id,
            matchedDescription: `Factuur ${invoice.invoice_number} - ${invoice.client_name}`,
            confidence: 0.9,
          };
        }
      }
    }
  }

  // Strategie 3: Tegenpartij matchen met klant
  if (tx.counterpartyName) {
    const counterpartyLower = tx.counterpartyName.toLowerCase();

    const { data: clients } = await supabase
      .from('invoices')
      .select('id, invoice_number, client_name, total_amount')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .ilike('client_name', `%${counterpartyLower}%`)
      .limit(3);

    if (clients && clients.length === 1) {
      return {
        transactionId: tx.id,
        matchType: 'invoice',
        matchedId: clients[0].id,
        matchedDescription: `Factuur ${clients[0].invoice_number} - ${clients[0].client_name}`,
        confidence: 0.7,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Uitgave matching
// ---------------------------------------------------------------------------

/**
 * Probeer een uitgaande betaling te matchen met een bestaande uitgave.
 */
async function matchToExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tx: BankTransaction
): Promise<TransactionMatch | null> {
  const absAmount = Math.abs(tx.amount);

  // Strategie 1: Bedrag + datum matchen
  const { data: expenseMatches } = await supabase
    .from('expenses')
    .select('id, description, amount, date')
    .eq('user_id', userId)
    .eq('amount', absAmount)
    .eq('date', tx.date)
    .limit(3);

  if (expenseMatches && expenseMatches.length === 1) {
    return {
      transactionId: tx.id,
      matchType: 'expense',
      matchedId: expenseMatches[0].id,
      matchedDescription: expenseMatches[0].description,
      confidence: 0.9,
    };
  }

  // Strategie 2: Bedrag matchen (binnen 7 dagen)
  const txDate = new Date(tx.date);
  const dateFrom = new Date(txDate);
  dateFrom.setDate(dateFrom.getDate() - 7);
  const dateTo = new Date(txDate);
  dateTo.setDate(dateTo.getDate() + 7);

  const { data: nearbyExpenses } = await supabase
    .from('expenses')
    .select('id, description, amount, date')
    .eq('user_id', userId)
    .eq('amount', absAmount)
    .gte('date', dateFrom.toISOString().split('T')[0])
    .lte('date', dateTo.toISOString().split('T')[0])
    .limit(3);

  if (nearbyExpenses && nearbyExpenses.length === 1) {
    return {
      transactionId: tx.id,
      matchType: 'expense',
      matchedId: nearbyExpenses[0].id,
      matchedDescription: nearbyExpenses[0].description,
      confidence: 0.7,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Automatische categorisering
// ---------------------------------------------------------------------------

/**
 * Categoriseer een transactie op basis van trefwoorden in de omschrijving
 * en tegenpartijnaam.
 */
function categorizeByKeywords(
  description: string,
  counterpartyName?: string
): string | null {
  const searchText = `${description} ${counterpartyName || ''}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Uitgave aanmaken vanuit transactie
// ---------------------------------------------------------------------------

/**
 * Maak een uitgave aan vanuit een banktransactie.
 */
export async function createExpenseFromTransaction(
  transactionId: string,
  category: string,
  btwRate: number = 21
): Promise<{ success: boolean; expenseId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Haal de transactie op
  const { data: tx } = await supabase
    .from('bank_aggregator_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('transaction_id', transactionId)
    .single();

  if (!tx) {
    return { success: false, error: 'Transactie niet gevonden' };
  }

  const absAmount = Math.abs(tx.amount);

  // Maak de uitgave aan
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      description: tx.description,
      amount: absAmount,
      date: tx.date,
      category,
      btw_rate: btwRate,
      source: 'bank_aggregator',
      source_transaction_id: transactionId,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: `Uitgave aanmaken mislukt: ${error.message}` };
  }

  return { success: true, expenseId: expense?.id };
}

/**
 * Koppel een inkomende transactie aan een factuur (markeer als betaald).
 */
export async function matchTransactionToInvoice(
  transactionId: string,
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Markeer de factuur als betaald
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_source: 'bank_aggregator',
      payment_transaction_id: transactionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (error) {
    return {
      success: false,
      error: `Factuur bijwerken mislukt: ${error.message}`,
    };
  }

  return { success: true };
}
