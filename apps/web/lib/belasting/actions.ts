'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile, Expense } from '@/lib/belasting/types'

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
