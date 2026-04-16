'use server';

import { createClient } from '@/lib/supabase/server';

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

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  return data?.onboarding_completed === true;
}

export async function completeOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niet ingelogd' };

  // Update or insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
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
    });

  if (profileError) {
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

  return { success: true };
}
