/**
 * Bank Aggregator Server Actions
 *
 * Server actions voor het beheren van bank aggregator configuratie,
 * verbindingen en transactie-synchronisatie.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createBankAggregator, AGGREGATOR_PROVIDERS } from './index';
import type {
  AggregatorProvider,
  BankAggregatorConfig,
  BankConnection,
  BankTransaction,
  TransactionFilter,
} from './types';

// ---------------------------------------------------------------------------
// Configuratie
// ---------------------------------------------------------------------------

/**
 * Haal de huidige aggregator configuratie op voor de ingelogde gebruiker.
 */
export async function getAggregatorConfig(): Promise<{
  provider: AggregatorProvider | null;
  configured: boolean;
  sandboxMode: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { provider: null, configured: false, sandboxMode: true };

  const { data } = await supabase
    .from('user_settings')
    .select('bank_aggregator_provider, bank_aggregator_sandbox')
    .eq('user_id', user.id)
    .single();

  if (!data?.bank_aggregator_provider) {
    return { provider: null, configured: false, sandboxMode: true };
  }

  return {
    provider: data.bank_aggregator_provider as AggregatorProvider,
    configured: true,
    sandboxMode: data.bank_aggregator_sandbox ?? true,
  };
}

/**
 * Sla de aggregator configuratie op (provider + API keys).
 */
export async function saveAggregatorConfig(config: {
  provider: AggregatorProvider;
  apiKey: string;
  apiSecret?: string;
  sandboxMode: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Valideer de provider
  const providerInfo = AGGREGATOR_PROVIDERS.find(
    (p) => p.id === config.provider
  );
  if (!providerInfo) {
    return { success: false, error: 'Onbekende provider' };
  }

  // Valideer API keys
  if (!config.apiKey.trim()) {
    return { success: false, error: 'API key is verplicht' };
  }

  if (providerInfo.requiresSecret && !config.apiSecret?.trim()) {
    return {
      success: false,
      error: `${providerInfo.name} vereist ook een API secret`,
    };
  }

  // Probeer een testverbinding te maken om de API key te valideren
  try {
    const client = createBankAggregator({
      provider: config.provider,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      sandboxMode: config.sandboxMode,
    });
    await client.getAvailableBanks();
  } catch (err) {
    return {
      success: false,
      error: `API key validatie mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}`,
    };
  }

  // Sla op in de database
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      bank_aggregator_provider: config.provider,
      bank_aggregator_api_key_encrypted: config.apiKey, // TODO: versleutelen met encryptToken()
      bank_aggregator_api_secret_encrypted: config.apiSecret || null,
      bank_aggregator_sandbox: config.sandboxMode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return {
      success: false,
      error: `Opslaan mislukt: ${error.message}`,
    };
  }

  return { success: true };
}

/**
 * Verwijder de aggregator configuratie.
 */
export async function removeAggregatorConfig(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  const { error } = await supabase
    .from('user_settings')
    .update({
      bank_aggregator_provider: null,
      bank_aggregator_api_key_encrypted: null,
      bank_aggregator_api_secret_encrypted: null,
      bank_aggregator_sandbox: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: `Verwijderen mislukt: ${error.message}` };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Verbindingen
// ---------------------------------------------------------------------------

/**
 * Haal alle bank aggregator verbindingen op voor de ingelogde gebruiker.
 */
export async function getAggregatorConnections(): Promise<BankConnection[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('bank_aggregator_connections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    provider: row.provider as AggregatorProvider,
    bankId: row.bank_id,
    bankName: row.bank_name,
    status: row.status,
    accounts: row.accounts || [],
    consentExpiresAt: row.consent_expires_at,
    lastSyncAt: row.last_sync_at,
    createdAt: row.created_at,
  }));
}

/**
 * Start een nieuwe bankverbinding via de aggregator.
 */
export async function initiateAggregatorConnection(
  bankId: string,
  redirectUrl: string
): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Haal configuratie op
  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'bank_aggregator_provider, bank_aggregator_api_key_encrypted, bank_aggregator_api_secret_encrypted, bank_aggregator_sandbox'
    )
    .eq('user_id', user.id)
    .single();

  if (!settings?.bank_aggregator_provider) {
    return {
      success: false,
      error: 'Geen bank aggregator geconfigureerd',
    };
  }

  try {
    const client = createBankAggregator({
      provider: settings.bank_aggregator_provider as AggregatorProvider,
      apiKey: settings.bank_aggregator_api_key_encrypted,
      apiSecret: settings.bank_aggregator_api_secret_encrypted || undefined,
      sandboxMode: settings.bank_aggregator_sandbox ?? true,
    });

    const result = await client.initiateConnection(bankId, redirectUrl);

    // Sla de pending verbinding op
    await supabase.from('bank_aggregator_connections').insert({
      user_id: user.id,
      provider: settings.bank_aggregator_provider,
      bank_id: bankId,
      bank_name: bankId,
      requisition_id: result.requisitionId,
      status: 'pending',
      accounts: [],
      created_at: new Date().toISOString(),
    });

    return { success: true, authUrl: result.authUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Verbinding starten mislukt',
    };
  }
}

/**
 * Voltooi een bankverbinding na de OAuth callback.
 */
export async function completeAggregatorConnection(
  requisitionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Haal de pending verbinding op
  const { data: connection } = await supabase
    .from('bank_aggregator_connections')
    .select('*, user_settings!inner(*)')
    .eq('user_id', user.id)
    .eq('requisition_id', requisitionId)
    .single();

  if (!connection) {
    return { success: false, error: 'Verbinding niet gevonden' };
  }

  // Haal settings op
  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'bank_aggregator_provider, bank_aggregator_api_key_encrypted, bank_aggregator_api_secret_encrypted, bank_aggregator_sandbox'
    )
    .eq('user_id', user.id)
    .single();

  if (!settings?.bank_aggregator_provider) {
    return { success: false, error: 'Configuratie niet gevonden' };
  }

  try {
    const client = createBankAggregator({
      provider: settings.bank_aggregator_provider as AggregatorProvider,
      apiKey: settings.bank_aggregator_api_key_encrypted,
      apiSecret: settings.bank_aggregator_api_secret_encrypted || undefined,
      sandboxMode: settings.bank_aggregator_sandbox ?? true,
    });

    const completed = await client.completeConnection(requisitionId);

    // Update de verbinding in de database
    await supabase
      .from('bank_aggregator_connections')
      .update({
        status: completed.status,
        bank_name: completed.bankName,
        accounts: completed.accounts,
        consent_expires_at: completed.consentExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('requisition_id', requisitionId);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Voltooien mislukt',
    };
  }
}

/**
 * Trek een bankverbinding in.
 */
export async function revokeAggregatorConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Haal settings op
  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'bank_aggregator_provider, bank_aggregator_api_key_encrypted, bank_aggregator_api_secret_encrypted, bank_aggregator_sandbox'
    )
    .eq('user_id', user.id)
    .single();

  if (settings?.bank_aggregator_provider) {
    try {
      const client = createBankAggregator({
        provider: settings.bank_aggregator_provider as AggregatorProvider,
        apiKey: settings.bank_aggregator_api_key_encrypted,
        apiSecret: settings.bank_aggregator_api_secret_encrypted || undefined,
        sandboxMode: settings.bank_aggregator_sandbox ?? true,
      });
      await client.revokeConnection(connectionId);
    } catch {
      // Ga door met het verwijderen uit de database, zelfs als de API-call mislukt
    }
  }

  const { error } = await supabase
    .from('bank_aggregator_connections')
    .update({
      status: 'revoked',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('id', connectionId);

  if (error) {
    return { success: false, error: `Intrekken mislukt: ${error.message}` };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Transacties synchroniseren
// ---------------------------------------------------------------------------

/**
 * Synchroniseer transacties voor alle actieve verbindingen.
 */
export async function syncAggregatorTransactions(
  dateFrom?: string,
  dateTo?: string
): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, synced: 0, errors: ['Niet ingelogd'] };

  // Haal settings op
  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'bank_aggregator_provider, bank_aggregator_api_key_encrypted, bank_aggregator_api_secret_encrypted, bank_aggregator_sandbox'
    )
    .eq('user_id', user.id)
    .single();

  if (!settings?.bank_aggregator_provider) {
    return {
      success: false,
      synced: 0,
      errors: ['Geen aggregator geconfigureerd'],
    };
  }

  // Haal actieve verbindingen op
  const connections = await getAggregatorConnections();
  const activeConnections = connections.filter((c) => c.status === 'active');

  if (activeConnections.length === 0) {
    return {
      success: false,
      synced: 0,
      errors: ['Geen actieve verbindingen'],
    };
  }

  const client = createBankAggregator({
    provider: settings.bank_aggregator_provider as AggregatorProvider,
    apiKey: settings.bank_aggregator_api_key_encrypted,
    apiSecret: settings.bank_aggregator_api_secret_encrypted || undefined,
    sandboxMode: settings.bank_aggregator_sandbox ?? true,
  });

  // Standaard datumbereik: laatste 30 dagen
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const from = dateFrom || defaultFrom.toISOString().split('T')[0];
  const to = dateTo || now.toISOString().split('T')[0];

  let totalSynced = 0;
  const errors: string[] = [];

  for (const connection of activeConnections) {
    for (const account of connection.accounts) {
      try {
        const filter: TransactionFilter = {
          accountId: account.id,
          dateFrom: from,
          dateTo: to,
        };

        const transactions = await client.getTransactions(filter);

        // Sla transacties op in de database
        for (const tx of transactions) {
          const { error } = await supabase
            .from('bank_aggregator_transactions')
            .upsert(
              {
                user_id: user.id,
                connection_id: connection.id,
                account_id: account.id,
                transaction_id: tx.id,
                date: tx.date,
                amount: tx.amount,
                currency: tx.currency,
                description: tx.description,
                counterparty_name: tx.counterpartyName,
                counterparty_iban: tx.counterpartyIban,
                category: tx.category,
                reference: tx.reference,
                status: tx.status,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id, transaction_id' }
            );

          if (!error) totalSynced++;
        }

        // Update last_sync_at
        await supabase
          .from('bank_aggregator_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);
      } catch (err) {
        errors.push(
          `${connection.bankName} (${account.iban}): ${err instanceof Error ? err.message : 'Synchronisatie mislukt'}`
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    synced: totalSynced,
    errors,
  };
}

/**
 * Haal opgeslagen transacties op uit de database.
 */
export async function getAggregatorTransactions(
  dateFrom?: string,
  dateTo?: string
): Promise<BankTransaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('bank_aggregator_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (dateFrom) {
    query = query.gte('date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('date', dateTo);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.transaction_id,
    accountId: row.account_id,
    date: row.date,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    counterpartyName: row.counterparty_name,
    counterpartyIban: row.counterparty_iban,
    category: row.category,
    reference: row.reference,
    status: row.status,
  }));
}
