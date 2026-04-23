/**
 * Enable Banking Aggregator Client
 *
 * Enable Banking (opvolger van Nordigen/GoCardless Bank Account Data)
 * is een Europese PSD2 aggregator met brede dekking van EU-banken.
 *
 * Website: https://enablebanking.com/
 * API documentatie: https://enablebanking.com/docs/
 *
 * Vereist:
 * - Enable Banking API key (te verkrijgen via het dashboard)
 * - Sandbox modus beschikbaar voor testen
 *
 * Kenmerken:
 * - Brede Europese dekking (2000+ banken)
 * - Gratis tier beschikbaar
 * - Berlin Group NextGenPSD2 compatibel
 */

import type {
  BankAggregatorClient,
  SupportedBank,
  BankConnection,
  BankAccount,
  BankTransaction,
  TransactionFilter,
} from '../types';

export class EnableBankingClient implements BankAggregatorClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, sandbox: boolean = false) {
    this.apiKey = apiKey;
    this.baseUrl = sandbox
      ? 'https://api.sandbox.enablebanking.com/v1'
      : 'https://api.enablebanking.com/v1';
  }

  // -----------------------------------------------------------------------
  // Beschikbare banken
  // -----------------------------------------------------------------------

  async getAvailableBanks(): Promise<SupportedBank[]> {
    const response = await fetch(`${this.baseUrl}/aspsps?country=NL`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      // Fallback naar een statische lijst van Nederlandse banken
      return this.getDefaultDutchBanks();
    }

    const data = await response.json();
    if (!Array.isArray(data.aspsps)) {
      return this.getDefaultDutchBanks();
    }

    return data.aspsps.map(
      (aspsp: EnableBankingAspspResponse): SupportedBank => ({
        id: aspsp.name.toLowerCase().replace(/\s+/g, '_'),
        name: aspsp.name,
        country: aspsp.country || 'NL',
        logo: aspsp.logo,
        bic: aspsp.bic,
        available: true,
      })
    );
  }

  private getDefaultDutchBanks(): SupportedBank[] {
    return [
      { id: 'ing', name: 'ING', country: 'NL', bic: 'INGBNL2A', available: true },
      { id: 'rabobank', name: 'Rabobank', country: 'NL', bic: 'RABONL2U', available: true },
      { id: 'abnamro', name: 'ABN AMRO', country: 'NL', bic: 'ABNANL2A', available: true },
      { id: 'sns', name: 'SNS', country: 'NL', bic: 'SNSBNL2A', available: true },
      { id: 'asn', name: 'ASN Bank', country: 'NL', bic: 'ASNBNL21', available: true },
      { id: 'regiobank', name: 'RegioBank', country: 'NL', bic: 'RBRBNL21', available: true },
      { id: 'knab', name: 'Knab', country: 'NL', bic: 'KNABNL2H', available: true },
      { id: 'bunq', name: 'bunq', country: 'NL', bic: 'BUNQNL2A', available: true },
      { id: 'triodos', name: 'Triodos Bank', country: 'NL', bic: 'TRIONL2U', available: true },
      { id: 'revolut', name: 'Revolut', country: 'EU', bic: 'REVOLT21', available: true },
    ];
  }

  // -----------------------------------------------------------------------
  // Verbinding starten
  // -----------------------------------------------------------------------

  async initiateConnection(
    bankId: string,
    redirectUrl: string
  ): Promise<{ authUrl: string; requisitionId: string }> {
    // Stap 1: Maak een end-user agreement aan
    const agreementResponse = await fetch(`${this.baseUrl}/agreements/enduser`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        institution_id: bankId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ['balances', 'details', 'transactions'],
      }),
    });

    if (!agreementResponse.ok) {
      const errorBody = await agreementResponse.text();
      throw new Error(
        `Enable Banking overeenkomst aanmaken mislukt (${agreementResponse.status}): ${errorBody}`
      );
    }

    const agreement = await agreementResponse.json();

    // Stap 2: Maak een requisitie aan
    const requisitionResponse = await fetch(`${this.baseUrl}/requisitions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: bankId,
        agreement: agreement.id,
        user_language: 'NL',
      }),
    });

    if (!requisitionResponse.ok) {
      const errorBody = await requisitionResponse.text();
      throw new Error(
        `Enable Banking requisitie aanmaken mislukt (${requisitionResponse.status}): ${errorBody}`
      );
    }

    const requisition = await requisitionResponse.json();
    return {
      authUrl: requisition.link,
      requisitionId: requisition.id,
    };
  }

  // -----------------------------------------------------------------------
  // Verbinding voltooien
  // -----------------------------------------------------------------------

  async completeConnection(requisitionId: string): Promise<BankConnection> {
    const response = await fetch(
      `${this.baseUrl}/requisitions/${requisitionId}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Enable Banking requisitie ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();

    // Haal account details op voor alle gekoppelde rekeningen
    const accounts: BankAccount[] = [];
    for (const accountId of data.accounts || []) {
      try {
        const account = await this.fetchAccountDetails(accountId);
        if (account) accounts.push(account);
      } catch {
        // Ga door met de volgende rekening als ophalen mislukt
      }
    }

    return {
      id: data.id,
      provider: 'enable_banking',
      bankId: data.institution_id,
      bankName: data.institution_id,
      status: this.mapStatus(data.status),
      accounts,
      consentExpiresAt: data.agreement_expires_at,
      lastSyncAt: undefined,
      createdAt: data.created || new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Rekeningen ophalen
  // -----------------------------------------------------------------------

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    const response = await fetch(
      `${this.baseUrl}/requisitions/${connectionId}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Enable Banking rekeningen ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    const accounts: BankAccount[] = [];

    for (const accountId of data.accounts || []) {
      try {
        const account = await this.fetchAccountDetails(accountId);
        if (account) accounts.push(account);
      } catch {
        // Ga door met de volgende rekening
      }
    }

    return accounts;
  }

  private async fetchAccountDetails(
    accountId: string
  ): Promise<BankAccount | null> {
    const [detailsRes, balancesRes] = await Promise.all([
      fetch(`${this.baseUrl}/accounts/${accountId}/details`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
      fetch(`${this.baseUrl}/accounts/${accountId}/balances`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    ]);

    if (!detailsRes.ok) return null;

    const details = await detailsRes.json();
    let balance: number | undefined;
    let balanceDate: string | undefined;

    if (balancesRes.ok) {
      const balancesData = await balancesRes.json();
      const balanceEntry = balancesData.balances?.[0];
      if (balanceEntry?.balanceAmount) {
        balance = parseFloat(balanceEntry.balanceAmount.amount);
        balanceDate = balanceEntry.referenceDate;
      }
    }

    return {
      id: accountId,
      iban: details.account?.iban || details.iban || '',
      name: details.account?.name || details.ownerName || 'Rekening',
      currency: details.account?.currency || details.currency || 'EUR',
      balance,
      balanceDate,
    };
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
        `Enable Banking transacties ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    const booked = data.transactions?.booked || [];

    return booked.map(
      (tx: EnableBankingTransactionResponse): BankTransaction => ({
        id:
          tx.transactionId ||
          tx.internalTransactionId ||
          crypto.randomUUID(),
        accountId: filter.accountId,
        date: tx.bookingDate,
        amount: parseFloat(tx.transactionAmount?.amount || '0'),
        currency: tx.transactionAmount?.currency || 'EUR',
        description:
          tx.remittanceInformationUnstructured ||
          tx.remittanceInformationStructured ||
          tx.creditorName ||
          tx.debtorName ||
          'Geen omschrijving',
        counterpartyName: tx.creditorName || tx.debtorName,
        counterpartyIban:
          tx.creditorAccount?.iban || tx.debtorAccount?.iban,
        reference: tx.endToEndId,
        status: 'booked',
      })
    );
  }

  // -----------------------------------------------------------------------
  // Verbinding intrekken
  // -----------------------------------------------------------------------

  async revokeConnection(connectionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/requisitions/${connectionId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Enable Banking verbinding intrekken mislukt (${response.status}): ${errorBody}`
      );
    }
  }

  // -----------------------------------------------------------------------
  // Status mapping
  // -----------------------------------------------------------------------

  private mapStatus(
    status: string
  ): 'pending' | 'active' | 'expired' | 'revoked' {
    switch (status) {
      case 'LN': // Linked
      case 'CR': // Created (with accounts)
        return 'active';
      case 'EX': // Expired
        return 'expired';
      case 'RJ': // Rejected
      case 'SA': // Suspended
        return 'revoked';
      default:
        return 'pending';
    }
  }
}

// ---------------------------------------------------------------------------
// Enable Banking-specifieke response types
// ---------------------------------------------------------------------------

interface EnableBankingAspspResponse {
  id: string;
  name: string;
  bic?: string;
  country?: string;
  logo?: string;
}

interface EnableBankingTransactionResponse {
  transactionId?: string;
  internalTransactionId?: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  creditorAccount?: { iban?: string };
  debtorName?: string;
  debtorAccount?: { iban?: string };
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: string;
  endToEndId?: string;
}
