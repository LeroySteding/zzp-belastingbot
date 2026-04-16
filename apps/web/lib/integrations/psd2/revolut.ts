/**
 * Revolut Business PSD2 Client
 *
 * Implements the Revolut Business API for fetching accounts and transactions.
 *
 * Note: Revolut Business API is NOT strictly a PSD2/Berlin Group API.
 * It uses its own REST API format. However, we wrap it in the same
 * PSD2Client interface for consistency within our integration framework.
 *
 * Production setup requirements:
 * 1. Register at https://developer.revolut.com/
 * 2. Create a Business API application
 * 3. Generate an API certificate (RSA or EC key pair)
 * 4. Upload the public key to the Revolut developer portal
 * 5. Set the following env vars:
 *    - REVOLUT_CLIENT_ID: Your app's client_id from the Revolut portal
 *    - REVOLUT_CLIENT_SECRET: Your app's client_assertion_jwt_secret or client_secret
 *
 * Sandbox vs Production:
 * - Sandbox: https://sandbox-b2b.revolut.com/api/1.0
 * - Production: https://b2b.revolut.com/api/1.0
 *
 * API documentation: https://developer.revolut.com/docs/business/business-api
 *
 * Important notes:
 * - Revolut uses JWT-based authentication (client_assertion) in production
 * - Access tokens expire after 40 minutes
 * - Refresh tokens are long-lived but can be revoked
 * - Rate limit: 100 requests per minute
 */

import { PSD2Client } from './client'
import type { PSD2BankConfig, BankAccount, PSD2Transaction } from './types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const USE_SANDBOX = process.env.REVOLUT_USE_SANDBOX !== 'false'

const SANDBOX_BASE = 'https://sandbox-b2b.revolut.com/api/1.0'
const PRODUCTION_BASE = 'https://b2b.revolut.com/api/1.0'

const BASE_URL = USE_SANDBOX ? SANDBOX_BASE : PRODUCTION_BASE

const REVOLUT_CONFIG: PSD2BankConfig = {
  bank: 'revolut',
  displayName: 'Revolut Business',
  // Revolut uses a slightly different OAuth2 flow
  authUrl: USE_SANDBOX
    ? 'https://sandbox-business.revolut.com/app-confirm'
    : 'https://business.revolut.com/app-confirm',
  tokenUrl: `${BASE_URL}/auth/token`,
  aisBaseUrl: BASE_URL,
  clientId: process.env.REVOLUT_CLIENT_ID || '',
  clientSecret: process.env.REVOLUT_CLIENT_SECRET || '',
  scopes: ['READ'],
}

// ---------------------------------------------------------------------------
// Client implementation
// ---------------------------------------------------------------------------

export class RevolutClient extends PSD2Client {
  constructor() {
    super(REVOLUT_CONFIG)
  }

  /**
   * Override getAuthUrl for Revolut's specific OAuth flow.
   *
   * Revolut Business uses a consent screen at /app-confirm
   * with slightly different parameters than standard OAuth2.
   */
  override getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      // Revolut does not use scopes in the auth URL
    })

    return `${this.config.authUrl}?${params.toString()}`
  }

  /**
   * Fetch all Revolut Business accounts.
   *
   * Revolut returns accounts as:
   * [
   *   {
   *     "id": "uuid",
   *     "name": "Main EUR",
   *     "balance": 1234.56,
   *     "currency": "EUR",
   *     "state": "active",
   *     "public": false
   *   }
   * ]
   *
   * Note: Revolut accounts may not have IBANs (especially non-EUR accounts).
   * We construct a pseudo-IBAN reference for consistency.
   */
  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    const url = `${this.config.aisBaseUrl}/accounts`
    const response = await this.authenticatedGet(url, accessToken)
    const data: RevolutAccountResponse[] = await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    // Only return active EUR accounts
    return data
      .filter((account) => account.state === 'active' && account.currency === 'EUR')
      .map((account) => ({
        iban: account.iban || `REVOLUT-${account.id}`,
        name: account.name || 'Revolut rekening',
        currency: account.currency,
        balance: account.balance,
      }))
  }

  /**
   * Fetch transactions for a specific account.
   *
   * Revolut returns transactions as:
   * [
   *   {
   *     "id": "uuid",
   *     "type": "card_payment",
   *     "state": "completed",
   *     "created_at": "2024-01-15T10:30:00.000Z",
   *     "completed_at": "2024-01-15T10:30:00.000Z",
   *     "legs": [
   *       {
   *         "leg_id": "uuid",
   *         "amount": -49.99,
   *         "currency": "EUR",
   *         "description": "Albert Heijn",
   *         "account_id": "uuid",
   *         "counterparty": {
   *           "account_type": "external",
   *           "name": "Albert Heijn B.V."
   *         }
   *       }
   *     ]
   *   }
   * ]
   */
  async getTransactions(
    accessToken: string,
    iban: string,
    dateFrom: string,
    dateTo: string
  ): Promise<PSD2Transaction[]> {
    // Revolut uses ISO dates for the from/to filter
    const from = new Date(dateFrom).toISOString()
    const to = new Date(dateTo + 'T23:59:59.999Z').toISOString()

    // Resolve account_id from IBAN (or use the Revolut ID directly)
    const accountId = await this.resolveAccountId(accessToken, iban)

    const params = new URLSearchParams({
      from,
      to,
      count: '1000', // Max per page
    })

    if (accountId) {
      params.set('account', accountId)
    }

    const url = `${this.config.aisBaseUrl}/transactions?${params.toString()}`
    const response = await this.authenticatedGet(url, accessToken)
    const data: RevolutTransactionResponse[] = await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    return data
      .filter((tx) => tx.state === 'completed')
      .flatMap((tx) =>
        (tx.legs || [])
          .filter((leg) => leg.currency === 'EUR')
          .map(
            (leg): PSD2Transaction => ({
              id: tx.id,
              date: tx.completed_at
                ? tx.completed_at.split('T')[0]
                : tx.created_at.split('T')[0],
              amount: leg.amount,
              currency: leg.currency,
              description: leg.description || tx.reference || 'Geen omschrijving',
              counterparty_name: tx.counterparty?.name || leg.counterparty?.name,
              counterparty_iban: tx.counterparty?.iban,
            })
          )
      )
  }

  /**
   * Resolve a Revolut account ID from an IBAN or pseudo-IBAN.
   */
  private async resolveAccountId(
    accessToken: string,
    iban: string
  ): Promise<string | null> {
    // If it's a Revolut pseudo-IBAN (REVOLUT-<uuid>), extract the UUID
    if (iban.startsWith('REVOLUT-')) {
      return iban.replace('REVOLUT-', '')
    }

    // Otherwise, look up by IBAN
    const url = `${this.config.aisBaseUrl}/accounts`
    const response = await this.authenticatedGet(url, accessToken)
    const accounts: RevolutAccountResponse[] = await response.json()

    const match = accounts.find((a) => a.iban === iban)
    return match?.id || null
  }
}

// ---------------------------------------------------------------------------
// Revolut-specific response types
// ---------------------------------------------------------------------------

interface RevolutAccountResponse {
  id: string
  name: string
  balance: number
  currency: string
  state: 'active' | 'inactive'
  public: boolean
  iban?: string
}

interface RevolutTransactionResponse {
  id: string
  type: string
  state: 'created' | 'pending' | 'completed' | 'declined' | 'failed' | 'reverted'
  reference?: string
  created_at: string
  completed_at?: string
  counterparty?: {
    name?: string
    iban?: string
    account_type?: string
  }
  legs: Array<{
    leg_id: string
    amount: number
    currency: string
    description?: string
    account_id: string
    counterparty?: {
      name?: string
    }
  }>
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

export function createRevolutClient(): RevolutClient {
  return new RevolutClient()
}
