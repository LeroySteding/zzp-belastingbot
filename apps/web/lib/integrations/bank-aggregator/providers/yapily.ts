/**
 * Yapily Bank Aggregator Client
 *
 * Yapily is een open banking platform met brede Europese dekking.
 * Biedt een gratis startplan en ondersteunt PSD2 AIS en PIS.
 *
 * Website: https://www.yapily.com/
 * API documentatie: https://docs.yapily.com/
 *
 * Vereist:
 * - Yapily Application UUID (apiKey)
 * - Yapily Application Secret (apiSecret)
 * - Sandbox modus beschikbaar voor testen
 *
 * Kenmerken:
 * - Basic Auth met application UUID + secret
 * - Brede Europese dekking
 * - Gratis startplan beschikbaar
 * - Consent-gebaseerde toegang
 */

import type {
  BankAggregatorClient,
  SupportedBank,
  BankConnection,
  BankAccount,
  BankTransaction,
  TransactionFilter,
} from '../types';

export class YapilyClient implements BankAggregatorClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, sandbox: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = sandbox
      ? 'https://api.sandbox.yapily.com'
      : 'https://api.yapily.com';
  }

  // -----------------------------------------------------------------------
  // Auth header (Basic Auth)
  // -----------------------------------------------------------------------

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString(
      'base64'
    );
    return `Basic ${credentials}`;
  }

  // -----------------------------------------------------------------------
  // Beschikbare banken
  // -----------------------------------------------------------------------

  async getAvailableBanks(): Promise<SupportedBank[]> {
    const response = await fetch(`${this.baseUrl}/institutions?country=NL`, {
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Fallback naar statische lijst
      return this.getDefaultDutchBanks();
    }

    const data = await response.json();
    if (!Array.isArray(data.data)) {
      return this.getDefaultDutchBanks();
    }

    return data.data.map(
      (inst: YapilyInstitutionResponse): SupportedBank => ({
        id: inst.id,
        name: inst.name,
        country: inst.countries?.[0]?.countryCode2 || 'NL',
        logo: inst.media?.[0]?.source,
        available: inst.features?.some(
          (f: YapilyFeatureResponse) =>
            f.featureScope === 'ACCOUNT' && f.enabled
        ) ?? true,
      })
    );
  }

  private getDefaultDutchBanks(): SupportedBank[] {
    return [
      { id: 'modelo-sandbox', name: 'Modelo Sandbox', country: 'NL', available: true },
      { id: 'ing-nl', name: 'ING', country: 'NL', bic: 'INGBNL2A', available: true },
      { id: 'rabobank-nl', name: 'Rabobank', country: 'NL', bic: 'RABONL2U', available: true },
      { id: 'abnamro-nl', name: 'ABN AMRO', country: 'NL', bic: 'ABNANL2A', available: true },
      { id: 'bunq-nl', name: 'bunq', country: 'NL', bic: 'BUNQNL2A', available: true },
      { id: 'knab-nl', name: 'Knab', country: 'NL', bic: 'KNABNL2H', available: true },
      { id: 'revolut-eu', name: 'Revolut', country: 'EU', bic: 'REVOLT21', available: true },
    ];
  }

  // -----------------------------------------------------------------------
  // Verbinding starten
  // -----------------------------------------------------------------------

  async initiateConnection(
    bankId: string,
    redirectUrl: string
  ): Promise<{ authUrl: string; requisitionId: string }> {
    // Stap 1: Maak een consent-aanvraag aan bij de instelling
    const response = await fetch(
      `${this.baseUrl}/account-auth-requests`,
      {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationUserId: crypto.randomUUID(),
          institutionId: bankId,
          callback: redirectUrl,
          oneTimeToken: false,
          accountRequest: {
            transactionFrom: this.getDateNDaysAgo(90),
            featureScope: [
              'ACCOUNTS',
              'ACCOUNT_TRANSACTIONS',
              'ACCOUNT_BALANCES',
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Yapily consent aanvraag mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    return {
      authUrl: data.data?.authorisationUrl || data.data?.qrCodeUrl || '',
      requisitionId: data.data?.id || data.data?.consentToken || '',
    };
  }

  // -----------------------------------------------------------------------
  // Verbinding voltooien
  // -----------------------------------------------------------------------

  async completeConnection(requisitionId: string): Promise<BankConnection> {
    // Gebruik het consent token om rekeningen op te halen
    const response = await fetch(`${this.baseUrl}/accounts`, {
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
        Consent: requisitionId,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Yapily rekeningen ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    const accounts: BankAccount[] = (data.data || []).map(
      this.mapAccount
    );

    return {
      id: requisitionId,
      provider: 'yapily',
      bankId: data.data?.[0]?.institutionId || 'unknown',
      bankName: data.data?.[0]?.institutionId || 'Bank',
      status: 'active',
      accounts,
      createdAt: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Rekeningen ophalen
  // -----------------------------------------------------------------------

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    const response = await fetch(`${this.baseUrl}/accounts`, {
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
        Consent: connectionId,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Yapily rekeningen ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    return (data.data || []).map(this.mapAccount);
  }

  // -----------------------------------------------------------------------
  // Transacties ophalen
  // -----------------------------------------------------------------------

  async getTransactions(filter: TransactionFilter): Promise<BankTransaction[]> {
    const params = new URLSearchParams({
      from: filter.dateFrom,
      before: filter.dateTo,
    });

    // Yapily vereist het consent token in de header
    // Het accountId bevat het connectionId en accountId gescheiden door een ':'
    const [consentToken, accountId] = this.parseAccountId(filter.accountId);

    const response = await fetch(
      `${this.baseUrl}/accounts/${accountId}/transactions?${params}`,
      {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          Consent: consentToken,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Yapily transacties ophalen mislukt (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();
    return (data.data || []).map(
      (tx: YapilyTransactionResponse): BankTransaction => ({
        id: tx.id || crypto.randomUUID(),
        accountId: filter.accountId,
        date: tx.bookingDateTime?.split('T')[0] || tx.date || '',
        amount: tx.amount || 0,
        currency: tx.currency || 'EUR',
        description:
          tx.description ||
          tx.reference ||
          tx.payeeDetails?.name ||
          tx.payerDetails?.name ||
          'Geen omschrijving',
        counterpartyName:
          tx.payeeDetails?.name || tx.payerDetails?.name,
        counterpartyIban:
          tx.payeeDetails?.accountIdentifications?.[0]?.identification ||
          tx.payerDetails?.accountIdentifications?.[0]?.identification,
        reference: tx.reference,
        status: tx.status === 'PENDING' ? 'pending' : 'booked',
      })
    );
  }

  // -----------------------------------------------------------------------
  // Verbinding intrekken
  // -----------------------------------------------------------------------

  async revokeConnection(connectionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/consents/${connectionId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Yapily verbinding intrekken mislukt (${response.status}): ${errorBody}`
      );
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private mapAccount(data: YapilyAccountResponse): BankAccount {
    return {
      id: data.id || '',
      iban:
        data.accountIdentifications?.find(
          (ai: YapilyAccountIdentification) => ai.type === 'IBAN'
        )?.identification || '',
      name: data.accountNames?.[0]?.name || data.type || 'Rekening',
      currency: data.currency || 'EUR',
      balance: data.balance,
      balanceDate: data.balanceDateTime?.split('T')[0],
    };
  }

  private parseAccountId(
    compositeId: string
  ): [string, string] {
    // Formaat: consentToken:accountId
    const separatorIndex = compositeId.indexOf(':');
    if (separatorIndex === -1) {
      return [compositeId, compositeId];
    }
    return [
      compositeId.substring(0, separatorIndex),
      compositeId.substring(separatorIndex + 1),
    ];
  }

  private getDateNDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

// ---------------------------------------------------------------------------
// Yapily-specifieke response types
// ---------------------------------------------------------------------------

interface YapilyInstitutionResponse {
  id: string;
  name: string;
  countries?: Array<{ countryCode2: string }>;
  media?: Array<{ source: string; type: string }>;
  features?: YapilyFeatureResponse[];
}

interface YapilyFeatureResponse {
  featureScope: string;
  enabled: boolean;
}

interface YapilyAccountResponse {
  id: string;
  type?: string;
  accountIdentifications?: YapilyAccountIdentification[];
  accountNames?: Array<{ name: string }>;
  currency?: string;
  balance?: number;
  balanceDateTime?: string;
  institutionId?: string;
}

interface YapilyAccountIdentification {
  type: string;
  identification: string;
}

interface YapilyTransactionResponse {
  id?: string;
  date?: string;
  bookingDateTime?: string;
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
  status?: string;
  payeeDetails?: {
    name?: string;
    accountIdentifications?: Array<{
      type: string;
      identification: string;
    }>;
  };
  payerDetails?: {
    name?: string;
    accountIdentifications?: Array<{
      type: string;
      identification: string;
    }>;
  };
}
