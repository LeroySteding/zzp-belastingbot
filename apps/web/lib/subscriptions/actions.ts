'use server';

import createMollieClient from '@mollie/api-client';
import { createClient } from '@/lib/supabase/server';
import { PLANS, type PlanId } from './config';

function getMollieClient() {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return null;
  return createMollieClient({ apiKey: key });
}

export async function createSubscriptionPayment(planId: PlanId) {
  const mollie = getMollieClient();
  if (!mollie) return { error: 'Mollie niet geconfigureerd' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  const plan = PLANS[planId];
  if (!plan || plan.price === 0) return { error: 'Ongeldig plan' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const payment = await mollie.payments.create({
    amount: {
      currency: 'EUR',
      value: (plan.price / 100).toFixed(2),
    },
    description: `ZZP Platform - ${plan.name} abonnement`,
    redirectUrl: `${appUrl}/settings?subscription=success&plan=${planId}`,
    webhookUrl: `${appUrl}/api/subscriptions/webhook`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
      type: 'subscription',
    },
  });

  // Save pending subscription
  await supabase.from('subscriptions').upsert({
    user_id: user.id,
    plan: planId,
    status: 'pending',
    mollie_payment_id: payment.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return { checkoutUrl: payment.getCheckoutUrl() };
}

export async function getUserSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plan: 'free' as PlanId, status: 'active' as const };

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!subscription || subscription.status !== 'active') {
    return { plan: 'free' as PlanId, status: 'active' as const };
  }

  return {
    plan: (subscription.plan || 'free') as PlanId,
    status: subscription.status as string,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null,
  };
}

export async function cancelSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  return { success: true };
}
