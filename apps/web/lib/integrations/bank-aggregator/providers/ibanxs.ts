/**
 * IBANXS Bank Aggregator Client
 *
 * IBANXS is een Nederlandse PSD2 provider met een DNB-licentie (AISP).
 * Primair gericht op Nederlandse banken.
 *
 * Website: https://www.ibanxs.nl/
 * API documentatie: https://docs.ibanxs.nl/
 *
 * Vereist:
 * - IBANXS API key (te verkrijgen via het IBANXS dashboard)
 * - Sandbox modus beschikbaar voor testen
 */

import type {
  BankAggregatorClient,
  SupportedBank,
  BankConnection,
  BankAccount,
  BankTransaction,
  TransactionFilter,
} from '../types';

export class IbanxsClient implements BankAggregatorClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, sandbox: boolean = false) {
    this.apiKey = apiKey;
    this.baseUrl = sandbox
      ? 'https://sandbox.ibanxs.nl/api/v1'
      : 'https://api.ibanxs.nl/api/v1';
  }

  // -----------------------------------------------------------------------
  // Beschikbare banken
  // -----------------------------------------------------------------------

  async getAvailableBanks(): Promise<SupportedBank[]> {
    // IBANXS dekt voornamelijk Nederlandse banken
    return [
      { id: 'ing', name: 'ING', country: 'NL', bic: 'INGBNL2A', available: true },
      { id: 'rabobank', name: 'Rabobank', country: 'NL', bic: 'RABONL2U', available: true },
      { id: 'abnamro', name: 'ABN AMRO', country: 'NL', bic: 'ABNANL2A', available: true },
      { id: 'sns', name: 'SNS', country: 'NL', bic: 'SNSBNL2A', available: true },
      { id: 'asn', name: 'ASN Bank', country: 'NL', bic: 'ASNBNL21', available: true },
      { id: 'regiobank', name: 'RegioBank', country: 'NL', bic: 'RBRBNL21', available: true },
      { id: 'knab', name: 'Knab', country: 'NL', bic: 'KNABNL2H', available: true },
      { id: 'bunq', name: 'bunq', country: 'NL', bic: 'BUNQNL2A', available: true },
    ];
  }

  // -----------------------------------------------------------------------
  // Verbinding starten
  // -----------------------------------------------------------------------

  async initiateConnection(
    bankId: string,
    redirectUrl: string
  ): Promise<{ authUrl: string; requisitionId: string }> {
    const response = await fetch(`${this.baseUrl}/connections`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_id: bankId,
        redirect_url: redirectUrl,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `IBANXS verbinding starten mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    return {
      authUrl: data.auth_url,
      requisitionId: data.id,
    };
  }

  // -----------------------------------------------------------------------
  // Verbinding voltooien
  // -----------------------------------------------------------------------

  async completeConnection(requisitionId: string): Promise<BankConnection> {
    const response = await fetch(
      `${this.baseUrl}/connections/${requisitionId}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `IBANXS verbinding ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    return this.mapConnection(data);
  }

  // -----------------------------------------------------------------------
  // Rekeningen ophalen
  // -----------------------------------------------------------------------

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    const response = await fetch(
      `${this.baseUrl}/connections/${connectionId}/accounts`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `IBANXS rekeningen ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    return (data.accounts || []).map(this.mapAccount);
  }

  // -----------------------------------------------------------------------
  // Transacties ophalen
  // -----------------------------------------------------------------------

  async getTransactions(filter: TransactionFilter): Promise<BankTransaction[]> {
    const params = new URLSearchParams({
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });

    const response = await fetch(
      `${this.baseUrl}/accounts/${filter.accountId}/transactions?${params}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `IBANXS transacties ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    const booked = data.transactions?.booked || [];
    return booked.map((tx: IbanxsTransactionResponse) =>
      this.mapTransaction(tx, filter.accountId)
    );
  }

  // -----------------------------------------------------------------------
  // Verbinding intrekken
  // -----------------------------------------------------------------------

  async revokeConnection(connectionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/connections/${connectionId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `IBANXS verbinding intrekken mislukt (${response.status}): ${errorBody}`
      );
    }
  }

  // -----------------------------------------------------------------------
  // Mappers: IBANXS formaat -> generieke types
  // -----------------------------------------------------------------------

  private mapConnection(data: IbanxsConnectionResponse): BankConnection {
    return {
      id: data.id,
      provider: 'ibanxs',
      bankId: data.bank_id,
      bankName: data.bank_name || data.bank_id,
      status: this.mapStatus(data.status),
      accounts: (data.accounts || []).map(this.mapAccount),
      consentExpiresAt: data.consent_expires_at,
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
    };
  }

  private mapAccount(data: IbanxsAccountResponse): BankAccount {
    return {
      id: data.id || data.resource_id || '',
      iban: data.iban,
      name: data.name || data.product || 'Rekening',
      currency: data.currency || 'EUR',
      balance: data.balance != null ? parseFloat(String(data.balance)) : undefined,
      balanceDate: data.balance_date,
    };
  }

  private mapTransaction(
    data: IbanxsTransactionResponse,
    accountId: string
  ): BankTransaction {
    return {
      id: data.transaction_id || data.entry_reference || crypto.randomUUID(),
      accountId,
      date: data.booking_date,
      amount: parseFloat(String(data.transaction_amount?.amount || '0')),
      currency: data.transaction_amount?.currency || 'EUR',
      description:
        data.remittance_information ||
        data.creditor_name ||
        data.debtor_name ||
        'Geen omschrijving',
      counterpartyName: data.creditor_name || data.debtor_name,
      counterpartyIban: data.creditor_iban || data.debtor_iban,
      reference: data.end_to_end_id,
      status: 'booked',
    };
  }

  private mapStatus(
    status: string
  ): 'pending' | 'active' | 'expired' | 'revoked' {
    switch (status) {
      case 'active':
      case 'connected':
      case 'valid':
        return 'active';
      case 'expired':
        return 'expired';
      case 'revoked':
      case 'deleted':
        return 'revoked';
      default:
        return 'pending';
    }
  }
}

// ---------------------------------------------------------------------------
// IBANXS-specifieke response types
// ---------------------------------------------------------------------------

interface IbanxsConnectionResponse {
  id: string;
  bank_id: string;
  bank_name?: string;
  status: string;
  accounts?: IbanxsAccountResponse[];
  consent_expires_at?: string;
  last_sync_at?: string;
  created_at: string;
}

interface IbanxsAccountResponse {
  id?: string;
  resource_id?: string;
  iban: string;
  name?: string;
  product?: string;
  currency?: string;
  balance?: number | string;
  balance_date?: string;
}

interface IbanxsTransactionResponse {
  transaction_id?: string;
  entry_reference?: string;
  booking_date: string;
  value_date?: string;
  transaction_amount: {
    amount: string;
    currency: string;
  };
  creditor_name?: string;
  creditor_iban?: string;
  debtor_name?: string;
  debtor_iban?: string;
  remittance_information?: string;
  end_to_end_id?: string;
}
