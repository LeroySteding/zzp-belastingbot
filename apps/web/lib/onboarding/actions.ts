'use server';

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { buildWelcomeEmail } from '@/lib/email/emails';

export interface OnboardingData {
  displayName: string;
  companyName: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  address: string;
  services: string[];
  hourlyRate: number | null;
  firstClient?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export async function isOnboardingComplete(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  // If column doesn't exist yet, check if profile has company_name set
  if (error?.message?.includes('column')) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single();
    return !!fallback?.company_name;
  }

  return data?.onboarding_completed === true;
}

export async function completeOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Update or insert profile - try with all fields first, fallback to base fields
  const fullPayload = {
    id: user.id,
    display_name: data.displayName,
    company_name: data.companyName,
    kvk_number: data.kvkNumber,
    btw_number: data.btwNumber,
    iban: data.iban,
    address: data.address,
    services: data.services,
    hourly_rate: data.hourlyRate,
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let { error: profileError } = await supabase
    .from('profiles')
    .upsert(fullPayload);

  // Fallback: if columns don't exist yet, save only base columns
  if (profileError?.message?.includes('column') || profileError?.code === 'PGRST204') {
    const basePayload = {
      id: user.id,
      company_name: data.companyName,
      kvk_number: data.kvkNumber,
      btw_number: data.btwNumber,
      iban: data.iban,
      address: data.address,
      updated_at: new Date().toISOString(),
    };
    const { error: fallbackError } = await supabase
      .from('profiles')
      .upsert(basePayload);
    if (fallbackError) {
      return { success: false, error: fallbackError.message };
    }
  } else if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Create first client if provided
  if (data.firstClient && data.firstClient.name) {
    const { error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: data.firstClient.name,
        email: data.firstClient.email,
        phone: data.firstClient.phone || null,
      });

    if (clientError) {
      // Non-fatal: profile was saved, client creation failed
      console.error('Failed to create first client:', clientError.message);
    }
  }

  // Send welcome email (non-fatal if it fails)
  try {
    if (user.email) {
      const { subject, html, text } = buildWelcomeEmail(data.displayName);
      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        tags: [{ name: 'type', value: 'welcome' }],
      });
    }
  } catch {
    // Non-fatal: onboarding succeeded, welcome email failed
    console.error('Failed to send welcome email');
  }

  return { success: true };
}
