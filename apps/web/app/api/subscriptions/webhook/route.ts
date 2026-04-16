import { NextRequest, NextResponse } from 'next/server';
import createMollieClient from '@mollie/api-client';
import { createClient } from '@supabase/supabase-js';
import { getPlanByAmount } from '@/lib/subscriptions/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const mollieKey = process.env.MOLLIE_API_KEY;
    if (!mollieKey) {
      return NextResponse.json({ error: 'Mollie not configured' }, { status: 500 });
    }

    const mollie = createMollieClient({ apiKey: mollieKey });
    const body = await request.formData();
    const paymentId = body.get('id') as string;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    const payment = await mollie.payments.get(paymentId);
    const metadata = payment.metadata as any;

    if (!metadata?.user_id || metadata?.type !== 'subscription') {
      return new Response('OK', { status: 200 });
    }

    if (payment.status === 'paid') {
      // Calculate period end (1 month from now)
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: metadata.user_id,
          plan: metadata.plan_id,
          status: 'active',
          mollie_payment_id: paymentId,
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } else if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired') {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          plan: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', metadata.user_id);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Subscription webhook error:', error);
    return new Response('OK', { status: 200 });
  }
}
