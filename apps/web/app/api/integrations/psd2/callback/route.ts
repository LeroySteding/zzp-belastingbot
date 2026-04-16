/**
 * PSD2 OAuth2 Callback Route
 *
 * This route handles the redirect from the bank after the user has
 * authenticated and granted consent. It:
 * 1. Validates the state parameter (CSRF protection)
 * 2. Exchanges the authorization code for access + refresh tokens
 * 3. Encrypts and stores the tokens in the bank_connections table
 * 4. Fetches the user's accounts and stores them
 * 5. Redirects the user back to the bank import page
 *
 * URL: GET /api/integrations/psd2/callback?code=...&state=...
 *
 * The state parameter is a base64-encoded JSON string containing:
 * { user_id: string, bank: PSD2Bank }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPSD2Client } from '@/lib/integrations/psd2'
import { encryptToken } from '@/lib/integrations/psd2/encryption'
import type { PSD2Bank } from '@/lib/integrations/psd2/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Base redirect URL (used for both success and error)
    const baseRedirect = new URL('/belasting/import', request.url)
    baseRedirect.searchParams.set('tab', 'integrations')

    // Handle bank-side errors (user denied consent, etc.)
    if (error) {
      console.error(`PSD2 callback error: ${error} - ${errorDescription}`)
      baseRedirect.searchParams.set('psd2_error', errorDescription || error)
      return NextResponse.redirect(baseRedirect)
    }

    // Validate required parameters
    if (!code || !state) {
      baseRedirect.searchParams.set('psd2_error', 'Ongeldige callback parameters')
      return NextResponse.redirect(baseRedirect)
    }

    // Decode state parameter
    let stateData: { user_id: string; bank: PSD2Bank }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    } catch {
      baseRedirect.searchParams.set('psd2_error', 'Ongeldige state parameter')
      return NextResponse.redirect(baseRedirect)
    }

    // Verify the authenticated user matches the state
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      baseRedirect.searchParams.set('psd2_error', 'Niet ingelogd')
      return NextResponse.redirect(baseRedirect)
    }

    if (user.id !== stateData.user_id) {
      baseRedirect.searchParams.set('psd2_error', 'Gebruiker komt niet overeen')
      return NextResponse.redirect(baseRedirect)
    }

    const bank = stateData.bank

    // Create the PSD2 client for this bank
    const client = createPSD2Client(bank)

    // Build the callback URL (must match what was used in the auth request)
    const redirectUri = new URL('/api/integrations/psd2/callback', request.url).toString()

    // Exchange the authorization code for tokens
    const tokens = await client.exchangeCode(code, redirectUri)

    // Encrypt tokens before storing
    const accessTokenEncrypted = encryptToken(tokens.access_token)
    const refreshTokenEncrypted = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null

    // Calculate token expiry
    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString()

    // Fetch accounts using the new access token
    let accounts = []
    try {
      accounts = await client.getAccounts(tokens.access_token)
    } catch (accountError) {
      console.error('Failed to fetch accounts after auth:', accountError)
      // Non-fatal: we still save the connection, accounts can be fetched later
    }

    // Upsert the bank connection (insert or update if exists)
    const { error: dbError } = await supabase
      .from('bank_connections')
      .upsert(
        {
          user_id: user.id,
          bank,
          status: 'connected',
          consent_id: stateData.bank, // In production, this would come from the consent API
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: tokenExpiresAt,
          accounts: JSON.stringify(accounts),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,bank',
        }
      )

    if (dbError) {
      console.error('Failed to store bank connection:', dbError)
      baseRedirect.searchParams.set(
        'psd2_error',
        'Koppeling opslaan mislukt'
      )
      return NextResponse.redirect(baseRedirect)
    }

    // Success! Redirect back to the import page with success message
    baseRedirect.searchParams.set('psd2_success', bank)
    return NextResponse.redirect(baseRedirect)
  } catch (err) {
    console.error('PSD2 callback unexpected error:', err)

    const errorRedirect = new URL('/belasting/import', request.url)
    errorRedirect.searchParams.set('tab', 'integrations')
    errorRedirect.searchParams.set(
      'psd2_error',
      'Er is een onverwachte fout opgetreden bij het koppelen'
    )
    return NextResponse.redirect(errorRedirect)
  }
}
