/**
 * Bank Aggregator Types
 *
 * Provider-agnostische types voor bank aggregator integraties.
 * Ondersteunt meerdere PSD2 providers (IBANXS, Enable Banking, Yapily)
 * via een uniforme interface.
 */

// ---------------------------------------------------------------------------
// Provider configuratie
// ---------------------------------------------------------------------------

/** Ondersteunde aggregator providers */
export type AggregatorProvider = 'ibanxs' | 'enable_banking' | 'yapily' | 'direct_psd2';

/** Configuratie voor een bank aggregator provider */
export interface BankAggregatorConfig {
  provider: AggregatorProvider;
  apiKey?: string;
  apiSecret?: string;
  sandboxMode: boolean;
}

// ---------------------------------------------------------------------------
// Beschikbare banken
// ---------------------------------------------------------------------------

/** Een bank die beschikbaar is via de aggregator */
export interface SupportedBank {
  id: string;
  name: string;
  country: string;
  logo?: string;
  bic?: string;
  available: boolean;
}

// ---------------------------------------------------------------------------
// Bankverbinding
// ---------------------------------------------------------------------------

/** Een actieve verbinding met een bank via de aggregator */
export interface BankConnection {
  id: string;
  provider: AggregatorProvider;
  bankId: string;
  bankName: string;
  status: 'pending' | 'active' | 'expired' | 'revoked';
  accounts: BankAccount[];
  consentExpiresAt?: string;
  lastSyncAt?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Bankrekening
// ---------------------------------------------------------------------------

/** Een bankrekening gekoppeld aan een verbinding */
export interface BankAccount {
  id: string;
  iban: string;
  name: string;
  currency: string;
  balance?: number;
  balanceDate?: string;
}

// ---------------------------------------------------------------------------
// Transactie
// ---------------------------------------------------------------------------

/** Een banktransactie opgehaald via de aggregator */
export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  /** Positief = bijschrijving, negatief = afschrijving */
  amount: number;
  currency: string;
  description: string;
  counterpartyName?: string;
  counterpartyIban?: string;
  category?: string;
  reference?: string;
  status: 'booked' | 'pending';
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** Filter voor het ophalen van transacties */
export interface TransactionFilter {
  accountId: string;
  dateFrom: string;
  dateTo: string;
}

// ---------------------------------------------------------------------------
// Matching resultaten
// ---------------------------------------------------------------------------

/** Resultaat van automatische transactie-matching */
export interface TransactionMatch {
  transactionId: string;
  matchType: 'invoice' | 'expense' | 'suggestion';
  matchedId?: string;
  matchedDescription?: string;
  confidence: number;
  suggestedCategory?: string;
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

/**
 * De interface die alle bank aggregator providers moeten implementeren.
 * Elke provider (IBANXS, Enable Banking, Yapily) implementeert deze
 * interface met zijn eigen API-aanroepen en response mapping.
 */
export interface BankAggregatorClient {
  /** Haal de lijst op van beschikbare banken bij deze provider */
  getAvailableBanks(): Promise<SupportedBank[]>;

  /** Start een nieuwe bankverbinding via OAuth/consent flow */
  initiateConnection(
    bankId: string,
    redirectUrl: string
  ): Promise<{ authUrl: string; requisitionId: string }>;

  /** Voltooi een bankverbinding na de OAuth callback */
  completeConnection(requisitionId: string): Promise<BankConnection>;

  /** Haal de rekeningen op voor een verbinding */
  getAccounts(connectionId: string): Promise<BankAccount[]>;

  /** Haal transacties op met een filter */
  getTransactions(filter: TransactionFilter): Promise<BankTransaction[]>;

  /** Trek een bankverbinding in */
  revokeConnection(connectionId: string): Promise<void>;
}
