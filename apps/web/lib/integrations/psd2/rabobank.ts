/**
 * Rabobank PSD2 Client
 *
 * Implements the Rabobank PSD2 API (based on Berlin Group NextGenPSD2).
 *
 * Production setup requirements:
 * 1. Register at https://developer.rabobank.nl/
 * 2. Create an app and subscribe to the following APIs:
 *    - Account Information (AIS) - for reading accounts and transactions
 *    - OAuth 2.0 - for authentication
 * 3. Obtain eIDAS certificates (QWAC + QSeal) from a qualified TSP
 * 4. Configure your certificates in the Rabobank developer portal
 * 5. Set the following env vars:
 *    - RABOBANK_CLIENT_ID: Your app's client ID from the Rabobank developer portal
 *    - RABOBANK_CLIENT_SECRET: Your app's client secret
 *
 * Sandbox vs Production:
 * - Sandbox: https://api-sandbox.rabobank.nl (no real bank data, no eIDAS needed)
 * - Production: https://api.rabobank.nl (requires AISP license + eIDAS certs)
 *
 * API documentation: https://developer.rabobank.nl/api-marketplace
 *
 * Rate limits:
 * - Sandbox: 5 requests/second
 * - Production: varies per endpoint, typically 10 req/s
 *
 * Consent validity:
 * - Maximum 90 days per PSD2 regulation
 * - Maximum 4 times/day access without PSU (Payment Service User) presence
 */

import { PSD2Client } from './client'
import type { PSD2BankConfig, BankAccount, PSD2Transaction } from './types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Toggle between sandbox and production */
const USE_SANDBOX = process.env.RABOBANK_USE_SANDBOX !== 'false'

const SANDBOX_BASE = 'https://api-sandbox.rabobank.nl'
const PRODUCTION_BASE = 'https://api.rabobank.nl'

const BASE_URL = USE_SANDBOX ? SANDBOX_BASE : PRODUCTION_BASE

const RABOBANK_CONFIG: PSD2BankConfig = {
  bank: 'rabobank',
  displayName: 'Rabobank',
  authUrl: `${BASE_URL}/openapi/sandbox/oauth2/authorize`,
  tokenUrl: `${BASE_URL}/openapi/sandbox/oauth2/token`,
  aisBaseUrl: `${BASE_URL}/openapi/sandbox/payments/account-information/ais/v3`,
  clientId: process.env.RABOBANK_CLIENT_ID || '',
  clientSecret: process.env.RABOBANK_CLIENT_SECRET || '',
  scopes: ['ais.balances.read', 'ais.transactions.read'],
}

// In production, the endpoints differ slightly:
// authUrl:    https://api.rabobank.nl/openapi/oauth2/authorize
// tokenUrl:   https://api.rabobank.nl/openapi/oauth2/token
// aisBaseUrl: https://api.rabobank.nl/openapi/payments/account-information/ais/v3

// ---------------------------------------------------------------------------
// Client implementation
// ---------------------------------------------------------------------------

export class RabobankClient extends PSD2Client {
  constructor() {
    super(RABOBANK_CONFIG)
  }

  /**
   * Fetch all accounts linked to the consent.
   *
   * Rabobank returns accounts in the Berlin Group format:
   * {
   *   accounts: [
   *     {
   *       resourceId: "...",
   *       iban: "NL12RABO0123456789",
   *       currency: "EUR",
   *       name: "Betaalrekening",
   *       balances: [{ balanceAmount: { amount: "1234.56", currency: "EUR" } }]
   *     }
   *   ]
   * }
   */
  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    const url = `${this.config.aisBaseUrl}/accounts?withBalance=true`
    const response = await this.authenticatedGet(url, accessToken)
    const data = await response.json()

    if (!data.accounts || !Array.isArray(data.accounts)) {
      return []
    }

    return data.accounts.map((account: RabobankAccountResponse) => ({
      iban: account.iban,
      name: account.name || 'Rabobank rekening',
      currency: account.currency || 'EUR',
      balance: account.balances?.[0]?.balanceAmount
        ? parseFloat(account.balances[0].balanceAmount.amount)
        : undefined,
    }))
  }

  /**
   * Fetch transactions for a specific account.
   *
   * Rabobank returns transactions in the Berlin Group format:
   * {
   *   transactions: {
   *     booked: [
   *       {
   *         transactionId: "...",
   *         bookingDate: "2024-01-15",
   *         transactionAmount: { amount: "-49.99", currency: "EUR" },
   *         creditorName: "Albert Heijn",
   *         creditorAccount: { iban: "NL..." },
   *         remittanceInformationUnstructured: "Betaalautomaat 15:23..."
   *       }
   *     ],
   *     pending: [...]
   *   }
   * }
   *
   * Note: Rabobank allows fetching up to 90 days of history per PSD2 rules.
   * For the initial fetch after consent, up to 12 months may be available.
   */
  async getTransactions(
    accessToken: string,
    iban: string,
    dateFrom: string,
    dateTo: string
  ): Promise<PSD2Transaction[]> {
    // Rabobank uses resourceId internally, but we can query by IBAN
    // First, resolve the account resourceId
    const accountId = await this.resolveAccountId(accessToken, iban)
    if (!accountId) {
      throw new Error(`Account not found for IBAN ${iban}`)
    }

    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      bookingStatus: 'booked', // Only confirmed transactions
    })

    const url = `${this.config.aisBaseUrl}/accounts/${accountId}/transactions?${params.toString()}`
    const response = await this.authenticatedGet(url, accessToken)
    const data = await response.json()

    const bookedTransactions = data.transactions?.booked || []

    return bookedTransactions.map(
      (tx: RabobankTransactionResponse): PSD2Transaction => ({
        id: tx.transactionId || tx.entryReference || crypto.randomUUID(),
        date: tx.bookingDate,
        amount: parseFloat(tx.transactionAmount.amount),
        currency: tx.transactionAmount.currency || 'EUR',
        description:
          tx.remittanceInformationUnstructured ||
          tx.remittanceInformationStructured ||
          tx.creditorName ||
          tx.debtorName ||
          'Geen omschrijving',
        counterparty_name: tx.creditorName || tx.debtorName,
        counterparty_iban:
          tx.creditorAccount?.iban || tx.debtorAccount?.iban,
      })
    )
  }

  /**
   * Resolve a Rabobank internal account resourceId from an IBAN.
   */
  private async resolveAccountId(
    accessToken: string,
    iban: string
  ): Promise<string | null> {
    const accounts = await this.getAccountsRaw(accessToken)
    const match = accounts.find(
      (a: RabobankAccountResponse) => a.iban === iban
    )
    return match?.resourceId || null
  }

  private async getAccountsRaw(
    accessToken: string
  ): Promise<RabobankAccountResponse[]> {
    const url = `${this.config.aisBaseUrl}/accounts`
    const response = await this.authenticatedGet(url, accessToken)
    const data = await response.json()
    return data.accounts || []
  }
}

// ---------------------------------------------------------------------------
// Rabobank-specific response types (Berlin Group format)
// ---------------------------------------------------------------------------

interface RabobankAccountResponse {
  resourceId: string
  iban: string
  currency: string
  name?: string
  balances?: Array<{
    balanceType: string
    balanceAmount: {
      amount: string
      currency: string
    }
  }>
}

interface RabobankTransactionResponse {
  transactionId?: string
  entryReference?: string
  bookingDate: string
  valueDate?: string
  transactionAmount: {
    amount: string
    currency: string
  }
  creditorName?: string
  creditorAccount?: { iban?: string }
  debtorName?: string
  debtorAccount?: { iban?: string }
  remittanceInformationUnstructured?: string
  remittanceInformationStructured?: string
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

export function createRabobankClient(): RabobankClient {
  return new RabobankClient()
}
