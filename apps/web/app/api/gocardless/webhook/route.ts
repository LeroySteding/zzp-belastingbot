import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  processWebhookEvent,
  type GoCardlessEvent,
} from '@/lib/integrations/gocardless';

// ---------------------------------------------------------------------------
// POST - GoCardless webhook handler
//
// GoCardless stuurt webhooks voor betalingsgebeurtenissen (betaald,
// mislukt, geannuleerd, etc.). De webhook signature wordt gevalideerd
// met HMAC-SHA256 en het webhook secret.
//
// Bij een succesvolle betaling wordt de gekoppelde factuur automatisch
// als betaald gemarkeerd.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Controleer of GoCardless is geconfigureerd
    if (!process.env.GOCARDLESS_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'GoCardless is niet geconfigureerd' },
        { status: 500 }
      );
    }

    // Lees de raw body voor signature verificatie
    const body = await request.text();
    const signature = request.headers.get('Webhook-Signature') || '';

    // Verifieer de webhook signature
    if (!signature) {
      console.error('GoCardless webhook: ontbrekende signature');
      return NextResponse.json(
        { error: 'Ontbrekende webhook signature' },
        { status: 401 }
      );
    }

    try {
      const isValid = await verifyWebhookSignature(body, signature);
      if (!isValid) {
        console.error('GoCardless webhook: ongeldige signature');
        return NextResponse.json(
          { error: 'Ongeldige webhook signature' },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error(
        'GoCardless webhook signature verificatie mislukt:',
        err instanceof Error ? err.message : err
      );
      return NextResponse.json(
        { error: 'Signature verificatie mislukt' },
        { status: 500 }
      );
    }

    // Parse de webhook payload
    const payload = JSON.parse(body);
    const events: GoCardlessEvent[] = payload.events || [];

    // Verwerk elk event
    const results: { id: string; status: string }[] = [];

    for (const event of events) {
      try {
        await processWebhookEvent(event);
        results.push({ id: event.id, status: 'verwerkt' });
      } catch (err) {
        console.error(
          `GoCardless webhook event ${event.id} verwerking mislukt:`,
          err instanceof Error ? err.message : err
        );
        results.push({ id: event.id, status: 'mislukt' });
      }
    }

    return NextResponse.json({
      message: `${results.length} events verwerkt`,
      results,
    });
  } catch (err) {
    console.error(
      'GoCardless webhook fout:',
      err instanceof Error ? err.message : err
    );
    // Retourneer 200 om te voorkomen dat GoCardless blijft herproberen
    return NextResponse.json(
      { error: 'Webhook verwerking mislukt' },
      { status: 200 }
    );
  }
}
