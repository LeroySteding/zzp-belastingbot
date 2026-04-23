/**
 * PSD2 Open Banking Integration Types
 *
 * These types define the data structures for PSD2 bank connections
 * used by Dutch banks (Rabobank, Revolut, bunq, Knab) under the
 * EU Payment Services Directive 2 (PSD2).
 *
 * To use PSD2 APIs in production, your organisation needs:
 * - An AISP (Account Information Service Provider) license from DNB (De Nederlandsche Bank)
 * - Or operate under an agent/passporting arrangement with a licensed AISP
 * - eIDAS certificates (QWAC + QSeal) from a qualified Trust Service Provider
 * - Registration with each bank's developer portal
 */

// ---------------------------------------------------------------------------
// Bank Connection (stored in Supabase bank_connections table)
// ---------------------------------------------------------------------------

/** Supported banks for PSD2 integration */
export type PSD2Bank = 'rabobank' | 'revolut' | 'bunq' | 'knab'

/** Connection lifecycle status */
export type ConnectionStatus = 'pending' | 'connected' | 'expired' | 'revoked'

export interface BankConnection {
  id: string
  user_id: string
  bank: PSD2Bank
  status: ConnectionStatus
  consent_id: string | null
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  last_sync_at: string | null
  accounts: BankAccount[]
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Bank Account (returned by AIS /accounts endpoint)
// ---------------------------------------------------------------------------

export interface BankAccount {
  iban: string
  name: string
  currency: string
  balance?: number
}

// ---------------------------------------------------------------------------
// Bank Transaction (returned by AIS /transactions endpoint)
// ---------------------------------------------------------------------------

export interface PSD2Transaction {
  /** Bank-assigned unique transaction ID */
  id: string
  /** ISO date string (YYYY-MM-DD) */
  date: string
  /** Positive for credit, negative for debit */
  amount: number
  /** Currency code, e.g. EUR */
  currency: string
  /** Transaction description / remittance info */
  description: string
  /** Name of the counterparty */
  counterparty_name?: string
  /** IBAN of the counterparty */
  counterparty_iban?: string
}

// ---------------------------------------------------------------------------
// OAuth2 / Consent types
// ---------------------------------------------------------------------------

export interface OAuth2Tokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

export interface ConsentResponse {
  consent_id: string
  status: 'received' | 'valid' | 'expired' | 'rejected'
  /** URL to redirect the user to for SCA (Strong Customer Authentication) */
  auth_url?: string
}

// ---------------------------------------------------------------------------
// Configuration per bank
// ---------------------------------------------------------------------------

export interface PSD2BankConfig {
  bank: PSD2Bank
  /** Human-readable display name */
  displayName: string
  /** OAuth2 authorization endpoint */
  authUrl: string
  /** OAuth2 token endpoint */
  tokenUrl: string
  /** AIS (Account Information Service) base URL */
  aisBaseUrl: string
  /** Client ID from env vars */
  clientId: string
  /** Client Secret from env vars */
  clientSecret: string
  /** OAuth2 scopes required */
  scopes: string[]
}

// ---------------------------------------------------------------------------
// Sync result
// ---------------------------------------------------------------------------

export interface SyncResult {
  bank: PSD2Bank
  transactions_fetched: number
  transactions_imported: number
  errors: string[]
}
