'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile, Expense, BankImport, BankTransaction } from '@/lib/belasting/types'

// ============================================
// PROFILE
// ============================================

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    company_name: data.company_name,
    btw_number: data.btw_number,
    kvk_number: data.kvk_number,
    iban: data.iban,
    phone: data.phone ?? null,
    email: data.email ?? null,
    address: data.address ?? null,
    kor_enabled: data.kor_enabled ?? false,
    kor_threshold: data.kor_threshold ?? 20000,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function updateProfile(data: {
  company_name: string
  btw_number?: string
  kvk_number?: string
  iban?: string
  email?: string
  phone?: string
  address?: string
  kor_enabled?: boolean
}): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({
      company_name: data.company_name,
      btw_number: data.btw_number || null,
      kvk_number: data.kvk_number || null,
      iban: data.iban || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      kor_enabled: data.kor_enabled ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single()

  if (error || !updated) return null

  return {
    id: updated.id,
    company_name: updated.company_name,
    btw_number: updated.btw_number,
    kvk_number: updated.kvk_number,
    iban: updated.iban,
    phone: updated.phone ?? null,
    email: updated.email ?? null,
    address: updated.address ?? null,
    kor_enabled: updated.kor_enabled ?? false,
    kor_threshold: updated.kor_threshold ?? 20000,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  }
}

// ============================================
// EXPENSES
// ============================================

export async function getExpenses(year?: number, quarter?: number): Promise<Expense[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (year !== undefined) {
    query = query.eq('year', year)
  }

  if (quarter !== undefined) {
    query = query.eq('quarter', quarter)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    description: row.description,
    amount_excl: Number(row.amount_excl),
    btw_rate: row.btw_rate as 0 | 9 | 21,
    btw_amount: Number(row.btw_amount),
    amount_incl: Number(row.amount_incl),
    category: row.category,
    date: row.date,
    receipt_path: row.receipt_path,
    quarter: row.quarter,
    year: row.year,
    is_recurring: row.is_recurring ?? false,
    recurring_frequency: row.recurring_frequency ?? null,
    recurring_end_date: row.recurring_end_date ?? null,
    parent_recurring_id: row.parent_recurring_id ?? null,
    source: row.source ?? 'manual',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function createExpense(input: {
  description: string
  amount_excl: number
  btw_rate: number
  category: string
  date: string
  is_recurring?: boolean
  recurring_frequency?: string | null
}): Promise<Expense | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      description: input.description,
      amount_excl: input.amount_excl,
      btw_rate: input.btw_rate,
      category: input.category,
      date: input.date,
      is_recurring: input.is_recurring ?? false,
      recurring_frequency: input.recurring_frequency ?? null,
      source: 'manual',
    })
    .select('*')
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    user_id: data.user_id,
    description: data.description,
    amount_excl: Number(data.amount_excl),
    btw_rate: data.btw_rate as 0 | 9 | 21,
    btw_amount: Number(data.btw_amount),
    amount_incl: Number(data.amount_incl),
    category: data.category,
    date: data.date,
    receipt_path: data.receipt_path,
    quarter: data.quarter,
    year: data.year,
    is_recurring: data.is_recurring ?? false,
    recurring_frequency: data.recurring_frequency ?? null,
    recurring_end_date: data.recurring_end_date ?? null,
    parent_recurring_id: data.parent_recurring_id ?? null,
    source: data.source ?? 'manual',
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return !error
}

// ============================================
// QUARTER SUMMARY
// ============================================

export async function calculateQuarterSummary(
  year: number,
  quarter: number
): Promise<{
  totalExcl: string
  totalBTW: string
  totalIncl: string
  count: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { totalExcl: '0.00', totalBTW: '0.00', totalIncl: '0.00', count: 0 }

  const { data, error } = await supabase
    .from('expenses')
    .select('amount_excl, btw_amount, amount_incl')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)

  if (error || !data) {
    return { totalExcl: '0.00', totalBTW: '0.00', totalIncl: '0.00', count: 0 }
  }

  const totalExcl = data.reduce((sum, row) => sum + Number(row.amount_excl), 0)
  const totalBTW = data.reduce((sum, row) => sum + Number(row.btw_amount), 0)
  const totalIncl = data.reduce((sum, row) => sum + Number(row.amount_incl), 0)

  return {
    totalExcl: totalExcl.toFixed(2),
    totalBTW: totalBTW.toFixed(2),
    totalIncl: totalIncl.toFixed(2),
    count: data.length,
  }
}

// ============================================
// BANK IMPORTS
// ============================================

export async function importBankTransactions(
  transactions: BankTransaction[],
  bankName: string,
  filename: string
): Promise<{ success: boolean; importId?: string; imported?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  if (!transactions.length) {
    return { success: false, error: 'Geen transacties om te importeren' }
  }

  // Create bank_import record
  const { data: importRecord, error: importError } = await supabase
    .from('bank_imports')
    .insert({
      user_id: user.id,
      filename,
      bank_name: bankName,
      import_date: new Date().toISOString().split('T')[0],
      total_transactions: transactions.length,
      transactions_imported: 0,
      status: 'pending',
    })
    .select('id')
    .single()

  if (importError || !importRecord) {
    return { success: false, error: `Import record aanmaken mislukt: ${importError?.message || 'Onbekende fout'}` }
  }

  // Insert expenses from parsed transactions
  const expenses = transactions.map((tx) => {
    const dateObj = new Date(tx.date)
    const month = dateObj.getMonth() + 1
    const quarter = Math.ceil(month / 3)
    const year = dateObj.getFullYear()

    return {
      user_id: user.id,
      description: tx.description,
      amount_excl: tx.amount,
      btw_rate: tx.btw_rate ?? 21,
      category: tx.category || 'Overig',
      date: tx.date,
      quarter,
      year,
      source: 'bank_import' as const,
    }
  })

  const { data: inserted, error: expenseError } = await supabase
    .from('expenses')
    .insert(expenses)
    .select('id')

  if (expenseError) {
    // Mark import as failed
    await supabase
      .from('bank_imports')
      .update({ status: 'failed' })
      .eq('id', importRecord.id)

    return { success: false, error: `Transacties importeren mislukt: ${expenseError.message}` }
  }

  const importedCount = inserted?.length ?? 0

  // Update bank_import record with success
  await supabase
    .from('bank_imports')
    .update({
      transactions_imported: importedCount,
      status: 'completed',
    })
    .eq('id', importRecord.id)

  return {
    success: true,
    importId: importRecord.id,
    imported: importedCount,
  }
}

export async function getBankImports(): Promise<BankImport[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('bank_imports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    filename: row.filename,
    bank_name: row.bank_name,
    import_date: row.import_date,
    total_transactions: row.total_transactions,
    transactions_imported: row.transactions_imported,
    status: row.status,
    created_at: row.created_at,
  }))
}
