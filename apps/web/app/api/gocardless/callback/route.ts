import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeRedirectFlow } from '@/lib/integrations/gocardless';

// ---------------------------------------------------------------------------
// GET - OAuth callback voor GoCardless redirect flows
//
// Nadat een klant toestemming heeft gegeven voor automatische incasso,
// wordt deze callback aangeroepen. De redirect flow wordt voltooid en
// het mandaat wordt opgeslagen.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectFlowId = searchParams.get('redirect_flow_id');
    const sessionToken = searchParams.get('session_token');

    if (!redirectFlowId || !sessionToken) {
      return NextResponse.redirect(
        new URL('/belasting/bank-sync?error=missing_params', request.url)
      );
    }

    // Controleer of GoCardless is geconfigureerd
    if (!process.env.GOCARDLESS_ACCESS_TOKEN) {
      return NextResponse.redirect(
        new URL('/belasting/bank-sync?error=not_configured', request.url)
      );
    }

    // Controleer of de gebruiker is ingelogd
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?redirect=/belasting/bank-sync', request.url)
      );
    }

    // Voltooi de redirect flow
    const completedFlow = await completeRedirectFlow(
      redirectFlowId,
      sessionToken
    );

    // Sla het mandaat op in de database
    if (completedFlow.links.mandate && completedFlow.links.customer) {
      await supabase.from('gocardless_mandates').upsert(
        {
          user_id: user.id,
          mandate_id: completedFlow.links.mandate,
          customer_id: completedFlow.links.customer,
          redirect_flow_id: redirectFlowId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, mandate_id' }
      );
    }

    // Redirect naar de bank sync pagina met succes
    return NextResponse.redirect(
      new URL('/belasting/bank-sync?gocardless=success', request.url)
    );
  } catch (err) {
    console.error('GoCardless callback fout:', err instanceof Error ? err.message : err);
    return NextResponse.redirect(
      new URL('/belasting/bank-sync?error=callback_failed', request.url)
    );
  }
}
