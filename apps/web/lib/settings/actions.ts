'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  email_invoice_paid: boolean;
  email_invoice_overdue: boolean;
  email_weekly_summary: boolean;
  push_invoice_paid: boolean;
  push_invoice_overdue: boolean;
  push_deadlines: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  email_invoice_paid: true,
  email_invoice_overdue: true,
  email_weekly_summary: true,
  push_invoice_paid: true,
  push_invoice_overdue: true,
  push_deadlines: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATION_PREFS;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return DEFAULT_NOTIFICATION_PREFS;

  return {
    email_invoice_paid: data.email_invoice_paid ?? true,
    email_invoice_overdue: data.email_invoice_overdue ?? true,
    email_weekly_summary: data.email_weekly_summary ?? true,
    push_invoice_paid: data.push_invoice_paid ?? true,
    push_invoice_overdue: data.push_invoice_overdue ?? true,
    push_deadlines: data.push_deadlines ?? true,
  };
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// AUTH HELPERS
// ============================================

export async function getAuthEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? null;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
