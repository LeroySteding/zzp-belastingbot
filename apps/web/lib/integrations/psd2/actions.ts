/**
 * PSD2 Server Actions
 *
 * Server actions for managing PSD2 bank connections.
 * These run on the server and interact with Supabase directly.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { BankConnection, PSD2Bank } from './types'

// ---------------------------------------------------------------------------
// Read bank connections
// ---------------------------------------------------------------------------

/**
 * Get all PSD2 bank connections for the authenticated user.
 */
export async function getBankConnections(): Promise<BankConnection[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    bank: row.bank as PSD2Bank,
    status: row.status,
    consent_id: row.consent_id,
    access_token_encrypted: row.access_token_encrypted,
    refresh_token_encrypted: row.refresh_token_encrypted,
    token_expires_at: row.token_expires_at,
    last_sync_at: row.last_sync_at,
    accounts: row.accounts || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

/**
 * Get a specific bank connection by bank name.
 */
export async function getBankConnection(
  bank: PSD2Bank
): Promise<BankConnection | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('bank', bank)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    user_id: data.user_id,
    bank: data.bank as PSD2Bank,
    status: data.status,
    consent_id: data.consent_id,
    access_token_encrypted: data.access_token_encrypted,
    refresh_token_encrypted: data.refresh_token_encrypted,
    token_expires_at: data.token_expires_at,
    last_sync_at: data.last_sync_at,
    accounts: data.accounts || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Revoke / disconnect
// ---------------------------------------------------------------------------

/**
 * Revoke a bank connection (mark as revoked, clear tokens).
 */
export async function revokeBankConnection(
  bank: PSD2Bank
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('bank_connections')
    .update({
      status: 'revoked',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('bank', bank)

  if (error) {
    return { success: false, error: `Ontkoppelen mislukt: ${error.message}` }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Delete connection entirely
// ---------------------------------------------------------------------------

/**
 * Delete a bank connection record entirely.
 */
export async function deleteBankConnection(
  bank: PSD2Bank
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('bank', bank)

  if (error) {
    return { success: false, error: `Verwijderen mislukt: ${error.message}` }
  }

  return { success: true }
}
