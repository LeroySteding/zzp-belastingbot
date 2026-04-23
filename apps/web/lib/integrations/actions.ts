'use server';

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntegrationStatus {
  id: string;
  name: string;
  provider: string;
  connected: boolean;
  lastSync?: string;
  accountInfo?: string;
}

// ---------------------------------------------------------------------------
// Mollie
// ---------------------------------------------------------------------------

export async function getMollieStatus(): Promise<IntegrationStatus> {
  const base: IntegrationStatus = {
    id: 'mollie',
    name: 'Mollie',
    provider: 'mollie',
    connected: false,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return base;

    // Defensively query - mollie_api_key column may not exist yet
    const { data, error } = await supabase
      .from('profiles')
      .select('mollie_api_key')
      .eq('id', user.id)
      .single();

    if (error || !data) return base;

    const hasKey = !!(data as Record<string, unknown>).mollie_api_key;

    return {
      ...base,
      connected: hasKey,
    };
  } catch {
    // Column may not exist - return disconnected
    return base;
  }
}

export async function saveMollieApiKey(
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  // Validate key format
  if (!apiKey.startsWith('live_') && !apiKey.startsWith('test_')) {
    return {
      success: false,
      error: 'Ongeldige API key. Moet beginnen met live_ of test_',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Niet ingelogd' };

    const { error } = await supabase
      .from('profiles')
      .update({ mollie_api_key: apiKey } as Record<string, unknown>)
      .eq('id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Onbekende fout bij opslaan';
    return { success: false, error: message };
  }
}

export async function disconnectMollie(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase
      .from('profiles')
      .update({ mollie_api_key: null } as Record<string, unknown>)
      .eq('id', user.id);

    return { success: true };
  } catch {
    return { success: false };
  }
}

// ---------------------------------------------------------------------------
// All integration statuses
// ---------------------------------------------------------------------------

export async function getAllIntegrationStatuses(): Promise<IntegrationStatus[]> {
  const statuses: IntegrationStatus[] = [];

  // Mollie
  const mollieStatus = await getMollieStatus();
  statuses.push(mollieStatus);

  // PSD2 bank connections
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: connections } = await supabase
        .from('bank_connections')
        .select('bank, status, last_sync_at, accounts')
        .eq('user_id', user.id);

      const banks = ['rabobank', 'revolut', 'bunq', 'knab'] as const;
      const bankNames: Record<string, string> = {
        rabobank: 'Rabobank',
        revolut: 'Revolut Business',
        bunq: 'bunq',
        knab: 'Knab',
      };

      for (const bank of banks) {
        const conn = connections?.find((c) => c.bank === bank);
        const accounts = conn?.accounts as Array<{ iban?: string }> | undefined;

        statuses.push({
          id: `psd2-${bank}`,
          name: bankNames[bank],
          provider: 'psd2',
          connected: conn?.status === 'connected',
          lastSync: conn?.last_sync_at ?? undefined,
          accountInfo:
            accounts && accounts.length > 0
              ? accounts.map((a) => a.iban).join(', ')
              : undefined,
        });
      }
    }
  } catch {
    // bank_connections table may not exist yet - push empty statuses
    const bankNames: Record<string, string> = {
      rabobank: 'Rabobank',
      revolut: 'Revolut Business',
      bunq: 'bunq',
      knab: 'Knab',
    };
    for (const [bank, name] of Object.entries(bankNames)) {
      statuses.push({
        id: `psd2-${bank}`,
        name,
        provider: 'psd2',
        connected: false,
      });
    }
  }

  return statuses;
}
