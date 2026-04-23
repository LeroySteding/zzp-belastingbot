/**
 * PSD2 OAuth2 Connect Route
 *
 * Initiates the OAuth2 flow by redirecting the user to the bank's
 * authorization page. This is a server-side route that builds the
 * correct auth URL with the user's ID in the state parameter.
 *
 * GET /api/integrations/psd2/connect?bank=rabobank&redirect_uri=...
 *
 * This route:
 * 1. Validates the user is authenticated
 * 2. Creates a state parameter with user_id and bank
 * 3. Builds the OAuth2 authorization URL
 * 4. Redirects the user to the bank's consent page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPSD2Client } from '@/lib/integrations/psd2'
import type { PSD2Bank } from '@/lib/integrations/psd2/types'

const VALID_BANKS: PSD2Bank[] = ['rabobank', 'revolut', 'bunq', 'knab']

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bank = searchParams.get('bank') as PSD2Bank | null
    const redirectUri = searchParams.get('redirect_uri')

    // Validate bank parameter
    if (!bank || !VALID_BANKS.includes(bank)) {
      return NextResponse.json(
        { error: 'Ongeldige bank parameter' },
        { status: 400 }
      )
    }

    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Redirect to login page with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', '/belasting/import')
      return NextResponse.redirect(loginUrl)
    }

    // Build callback URL (where the bank redirects back to after consent)
    const callbackUrl =
      redirectUri ||
      new URL('/api/integrations/psd2/callback', request.url).toString()

    // Build state parameter with user context
    // This is used to verify the callback and associate it with the right user
    const statePayload = {
      user_id: user.id,
      bank,
      // In production, add a CSRF token here:
      // csrf: crypto.randomUUID()
      // And store it in the session/cookie for verification in the callback
    }
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url')

    // Create a pending bank connection record (or update existing revoked one)
    await supabase.from('bank_connections').upsert(
      {
        user_id: user.id,
        bank,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,bank',
      }
    )

    // Get the PSD2 client and build the auth URL
    const client = createPSD2Client(bank)
    const authUrl = client.getAuthUrl(callbackUrl, state)

    // Redirect the user to the bank's authorization page
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('PSD2 connect error:', err)

    const errorMessage =
      err instanceof Error ? err.message : 'Onbekende fout'

    // If the bank is not yet implemented, show a user-friendly message
    if (errorMessage.includes('nog niet beschikbaar')) {
      const errorRedirect = new URL('/belasting/import', request.url)
      errorRedirect.searchParams.set('tab', 'integrations')
      errorRedirect.searchParams.set('psd2_error', errorMessage)
      return NextResponse.redirect(errorRedirect)
    }

    return NextResponse.json(
      {
        error: 'Er is een fout opgetreden bij het verbinden',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
