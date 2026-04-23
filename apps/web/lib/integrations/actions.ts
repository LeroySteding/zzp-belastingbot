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
// Mollie Settings Types
// ---------------------------------------------------------------------------

export interface MolliePaymentMethods {
  ideal: boolean;
  creditcard: boolean;
  bancontact: boolean;
  sepa_direct_debit: boolean;
  paypal: boolean;
  klarna: boolean;
  bank_transfer: boolean;
}

export interface MollieSettings {
  payment_methods: MolliePaymentMethods;
  add_payment_link_to_emails: boolean;
  auto_mark_paid: boolean;
  recurring_enabled: boolean;
}

const DEFAULT_MOLLIE_SETTINGS: MollieSettings = {
  payment_methods: {
    ideal: true,
    creditcard: true,
    bancontact: false,
    sepa_direct_debit: false,
    paypal: false,
    klarna: false,
    bank_transfer: true,
  },
  add_payment_link_to_emails: true,
  auto_mark_paid: true,
  recurring_enabled: false,
};

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
// Mollie Settings CRUD
// ---------------------------------------------------------------------------

export async function getMollieSettings(): Promise<MollieSettings> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ...DEFAULT_MOLLIE_SETTINGS };

    const { data, error } = await supabase
      .from('profiles')
      .select('mollie_settings')
      .eq('id', user.id)
      .single();

    if (error || !data) return { ...DEFAULT_MOLLIE_SETTINGS };

    const raw = (data as Record<string, unknown>).mollie_settings;
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_MOLLIE_SETTINGS };

    // Merge with defaults so new fields always have a value
    const stored = raw as Partial<MollieSettings>;
    return {
      payment_methods: {
        ...DEFAULT_MOLLIE_SETTINGS.payment_methods,
        ...(stored.payment_methods || {}),
      },
      add_payment_link_to_emails:
        stored.add_payment_link_to_emails ?? DEFAULT_MOLLIE_SETTINGS.add_payment_link_to_emails,
      auto_mark_paid:
        stored.auto_mark_paid ?? DEFAULT_MOLLIE_SETTINGS.auto_mark_paid,
      recurring_enabled:
        stored.recurring_enabled ?? DEFAULT_MOLLIE_SETTINGS.recurring_enabled,
    };
  } catch {
    // Column may not exist yet
    return { ...DEFAULT_MOLLIE_SETTINGS };
  }
}

export async function updateMollieSettings(
  settings: Partial<MollieSettings>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Niet ingelogd' };

    // Read current settings first so we merge properly
    const current = await getMollieSettings();
    const merged: MollieSettings = {
      ...current,
      ...settings,
      payment_methods: {
        ...current.payment_methods,
        ...(settings.payment_methods || {}),
      },
    };

    const { error } = await supabase
      .from('profiles')
      .update({ mollie_settings: merged } as Record<string, unknown>)
      .eq('id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Onbekende fout bij opslaan';
    return { success: false, error: message };
  }
}

/**
 * Returns the prefix of the Mollie API key (e.g. "test_" or "live_") to
 * determine which mode the user is in without exposing the full key.
 */
export async function getMollieApiKeyPrefix(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('mollie_api_key')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    const key = (data as Record<string, unknown>).mollie_api_key as string | null;
    if (!key) return null;

    // Return the prefix portion (e.g. "test_" or "live_")
    if (key.startsWith('test_')) return 'test_';
    if (key.startsWith('live_')) return 'live_';
    return null;
  } catch {
    return null;
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
