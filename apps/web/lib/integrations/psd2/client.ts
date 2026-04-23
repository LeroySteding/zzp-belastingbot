/**
 * Base PSD2 Client
 *
 * Abstract class that implements the common OAuth2 + PSD2 AIS flow.
 * Each bank (Rabobank, Revolut, bunq, Knab) extends this class and
 * provides its own endpoints/configuration.
 *
 * The PSD2 flow works as follows:
 * 1. getAuthUrl()       - Generate the OAuth2 authorization URL
 * 2. exchangeCode()     - Exchange the auth code (from callback) for tokens
 * 3. refreshToken()     - Refresh expired access tokens
 * 4. getAccounts()      - Fetch the user's bank accounts (IBAN, balance)
 * 5. getTransactions()  - Fetch transactions for a specific account
 *
 * All banks that support PSD2 in the Netherlands follow the Berlin Group
 * NextGenPSD2 standard (with minor variations). This base class handles
 * the commonalities.
 */

import type {
  PSD2BankConfig,
  OAuth2Tokens,
  BankAccount,
  PSD2Transaction,
} from './types'

export abstract class PSD2Client {
  protected config: PSD2BankConfig

  constructor(config: PSD2BankConfig) {
    this.config = config
  }

  // -----------------------------------------------------------------------
  // OAuth2 Flow
  // -----------------------------------------------------------------------

  /**
   * Build the OAuth2 authorization URL that redirects the user to the bank
   * for consent and Strong Customer Authentication (SCA).
   *
   * @param redirectUri - Your app's callback URL (e.g. https://app.example.com/api/integrations/psd2/callback)
   * @param state       - Opaque state parameter for CSRF protection (include user_id + bank)
   */
  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scopes.join(' '),
      state,
    })

    return `${this.config.authUrl}?${params.toString()}`
  }

  /**
   * Exchange the authorization code (received at the callback URL) for
   * access + refresh tokens.
   *
   * @param code        - The authorization code from the bank's callback
   * @param redirectUri - Must match the redirect_uri used in getAuthUrl()
   */
  async exchangeCode(code: string, redirectUri: string): Promise<OAuth2Tokens> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Token exchange failed (${response.status}): ${errorBody}`
      )
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    }
  }

  /**
   * Refresh an expired access token using the refresh token.
   */
  async refreshToken(refreshTokenValue: string): Promise<OAuth2Tokens> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Token refresh failed (${response.status}): ${errorBody}`
      )
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshTokenValue,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    }
  }

  // -----------------------------------------------------------------------
  // PSD2 AIS (Account Information Service) endpoints
  // -----------------------------------------------------------------------

  /**
   * Fetch the user's bank accounts.
   * Each bank may return accounts in a slightly different format;
   * subclasses can override this to handle bank-specific quirks.
   */
  abstract getAccounts(accessToken: string): Promise<BankAccount[]>

  /**
   * Fetch transactions for a specific IBAN within a date range.
   *
   * @param accessToken - Valid OAuth2 access token
   * @param iban        - The IBAN to fetch transactions for
   * @param dateFrom    - Start date (YYYY-MM-DD)
   * @param dateTo      - End date (YYYY-MM-DD)
   */
  abstract getTransactions(
    accessToken: string,
    iban: string,
    dateFrom: string,
    dateTo: string
  ): Promise<PSD2Transaction[]>

  // -----------------------------------------------------------------------
  // Helper: authenticated fetch
  // -----------------------------------------------------------------------

  /**
   * Make an authenticated GET request to a PSD2 API endpoint.
   * Includes the required PSD2 headers (X-Request-ID, etc.).
   */
  protected async authenticatedGet(
    url: string,
    accessToken: string,
    extraHeaders?: Record<string, string>
  ): Promise<Response> {
    const requestId = crypto.randomUUID()

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'X-Request-ID': requestId,
      ...extraHeaders,
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `PSD2 API request failed (${response.status} ${url}): ${errorBody}`
      )
    }

    return response
  }
}
