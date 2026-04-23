import { NextRequest, NextResponse } from 'next/server';
import { processMollieWebhook } from '@/lib/integrations/mollie';

// ---------------------------------------------------------------------------
// POST - Mollie sends webhooks when a payment status changes
// Mollie requires a 200 OK response; any other status causes retries.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Mollie sends the payment id as form data
    const formData = await request.formData();
    const paymentId = formData.get('id') as string | null;

    if (!paymentId) {
      // Return 200 anyway so Mollie does not keep retrying
      return new NextResponse('OK', { status: 200 });
    }

    // Check if Mollie is configured
    if (!process.env.MOLLIE_API_KEY) {
      // Return 200 to prevent retries even when misconfigured
      return new NextResponse('OK', { status: 200 });
    }

    await processMollieWebhook(paymentId);

    return new NextResponse('OK', { status: 200 });
  } catch (err: any) {
    // Always return 200 to Mollie to prevent infinite retry loops.
    // Log the error server-side for debugging.
    console.error('Mollie webhook error:', err.message);
    return new NextResponse('OK', { status: 200 });
  }
}
