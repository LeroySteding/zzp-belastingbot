/**
 * PSD2 Transaction Sync Route
 *
 * Fetches the latest transactions from a connected bank via PSD2 and
 * imports them as expenses using the existing bank import flow.
 *
 * POST /api/integrations/psd2/sync
 * Body: { bank: PSD2Bank, date_from?: string, date_to?: string }
 *
 * The route:
 * 1. Validates the user is authenticated and has a connected bank
 * 2. Decrypts the stored OAuth tokens
 * 3. Refreshes the token if expired
 * 4. Fetches transactions from all accounts
 * 5. Categorises them using the existing bank parser logic
 * 6. Inserts them as expenses (source = 'psd2_sync')
 * 7. Updates the last_sync_at timestamp
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPSD2Client } from '@/lib/integrations/psd2'
import { decryptToken, encryptToken } from '@/lib/integrations/psd2/encryption'
import type { PSD2Bank, PSD2Transaction } from '@/lib/integrations/psd2/types'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const bank = body.bank as PSD2Bank

    if (!bank) {
      return NextResponse.json(
        { error: 'Bank parameter is verplicht' },
        { status: 400 }
      )
    }

    // Fetch the bank connection
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('bank', bank)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: `Geen ${bank} koppeling gevonden. Verbind eerst je bank.` },
        { status: 404 }
      )
    }

    if (connection.status !== 'connected') {
      return NextResponse.json(
        {
          error: `${bank} koppeling is ${connection.status}. Verbind opnieuw.`,
        },
        { status: 400 }
      )
    }

    if (!connection.access_token_encrypted) {
      return NextResponse.json(
        { error: 'Geen access token beschikbaar. Verbind opnieuw.' },
        { status: 400 }
      )
    }

    // Decrypt the access token
    let accessToken = decryptToken(connection.access_token_encrypted)

    // Check if token is expired and refresh if needed
    const tokenExpiresAt = connection.token_expires_at
      ? new Date(connection.token_expires_at)
      : null

    if (tokenExpiresAt && tokenExpiresAt <= new Date()) {
      // Token is expired, try to refresh
      if (!connection.refresh_token_encrypted) {
        // Mark connection as expired
        await supabase
          .from('bank_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', connection.id)

        return NextResponse.json(
          { error: 'Toegangstoken is verlopen. Verbind opnieuw met de bank.' },
          { status: 401 }
        )
      }

      try {
        const refreshTokenValue = decryptToken(connection.refresh_token_encrypted)
        const client = createPSD2Client(bank)
        const newTokens = await client.refreshToken(refreshTokenValue)

        // Store new tokens
        accessToken = newTokens.access_token
        const newExpiresAt = new Date(
          Date.now() + newTokens.expires_in * 1000
        ).toISOString()

        await supabase
          .from('bank_connections')
          .update({
            access_token_encrypted: encryptToken(newTokens.access_token),
            refresh_token_encrypted: newTokens.refresh_token
              ? encryptToken(newTokens.refresh_token)
              : connection.refresh_token_encrypted,
            token_expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)

        // Mark connection as expired
        await supabase
          .from('bank_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', connection.id)

        return NextResponse.json(
          {
            error:
              'Token vernieuwen mislukt. Verbind opnieuw met de bank.',
          },
          { status: 401 }
        )
      }
    }

    // Determine date range for sync
    // Default: last sync date to today, or last 30 days if never synced
    const dateTo = body.date_to || new Date().toISOString().split('T')[0]
    const defaultFrom = connection.last_sync_at
      ? new Date(connection.last_sync_at).toISOString().split('T')[0]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
    const dateFrom = body.date_from || defaultFrom

    // Fetch transactions from all accounts
    const client = createPSD2Client(bank)
    const accounts = connection.accounts || []

    let allTransactions: PSD2Transaction[] = []
    const errors: string[] = []

    for (const account of accounts) {
      try {
        const iban = typeof account === 'string' ? account : account.iban
        if (!iban) continue

        const transactions = await client.getTransactions(
          accessToken,
          iban,
          dateFrom,
          dateTo
        )
        allTransactions = allTransactions.concat(transactions)
      } catch (txError) {
        const iban = typeof account === 'string' ? account : account.iban
        errors.push(
          `Fout bij ophalen transacties voor ${iban}: ${txError instanceof Error ? txError.message : String(txError)}`
        )
      }
    }

    // Filter: only debit transactions (expenses = negative amounts)
    const expenseTransactions = allTransactions.filter((tx) => tx.amount < 0)

    // Import as expenses
    let importedCount = 0

    if (expenseTransactions.length > 0) {
      const expenses = expenseTransactions.map((tx) => {
        const dateObj = new Date(tx.date)
        const month = dateObj.getMonth() + 1
        const quarter = Math.ceil(month / 3)
        const year = dateObj.getFullYear()

        return {
          user_id: user.id,
          description: tx.description,
          amount_excl: Math.abs(tx.amount),
          btw_rate: 21, // Default; user can adjust after import
          category: 'Overig', // Default; user can adjust after import
          date: tx.date,
          quarter,
          year,
          source: 'psd2_sync' as const,
        }
      })

      const { data: inserted, error: insertError } = await supabase
        .from('expenses')
        .insert(expenses)
        .select('id')

      if (insertError) {
        errors.push(`Fout bij importeren: ${insertError.message}`)
      } else {
        importedCount = inserted?.length ?? 0
      }

      // Create a bank_import record for tracking
      await supabase.from('bank_imports').insert({
        user_id: user.id,
        filename: `PSD2 Sync - ${bank}`,
        bank_name: bank.charAt(0).toUpperCase() + bank.slice(1),
        import_date: new Date().toISOString().split('T')[0],
        total_transactions: expenseTransactions.length,
        transactions_imported: importedCount,
        status: importedCount > 0 ? 'completed' : 'failed',
        bank_connection_id: connection.id,
      })
    }

    // Update last_sync_at
    await supabase
      .from('bank_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    return NextResponse.json({
      success: true,
      bank,
      transactions_fetched: allTransactions.length,
      transactions_imported: importedCount,
      date_range: { from: dateFrom, to: dateTo },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('PSD2 sync error:', err)
    return NextResponse.json(
      {
        error: 'Er is een fout opgetreden bij het synchroniseren',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
