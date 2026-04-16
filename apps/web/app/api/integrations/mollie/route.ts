import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncMolliePayments, getPaymentMatches } from '@/lib/integrations/mollie';

// ---------------------------------------------------------------------------
// GET - Fetch Mollie payments with match status
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // Check if Mollie is configured
    if (!process.env.MOLLIE_API_KEY) {
      return NextResponse.json({
        configured: false,
        matches: [],
        message: 'Mollie API key is niet geconfigureerd',
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const matches = await getPaymentMatches(user.id);

    // Calculate stats
    const matched = matches.filter((m) => m.status === 'matched').length;
    const unmatched = matches.filter((m) => m.status === 'unmatched').length;
    const ignored = matches.filter((m) => m.status === 'ignored').length;

    return NextResponse.json({
      configured: true,
      matches,
      stats: {
        total: matches.length,
        matched,
        unmatched,
        ignored,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST - Trigger sync: match payments to invoices and update statuses
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Check if Mollie is configured
    if (!process.env.MOLLIE_API_KEY) {
      return NextResponse.json(
        { error: 'Mollie API key is niet geconfigureerd' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const result = await syncMolliePayments(user.id);

    return NextResponse.json({
      message: `Synchronisatie voltooid: ${result.matched} gematcht, ${result.unmatched} niet gematcht`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH - Manually match/unmatch a payment to an invoice
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMatchId, invoiceId, action } = body;

    if (!paymentMatchId) {
      return NextResponse.json({ error: 'paymentMatchId is verplicht' }, { status: 400 });
    }

    if (action === 'ignore') {
      // Mark payment as ignored
      const { error } = await supabase
        .from('payment_matches')
        .update({ status: 'ignored', invoice_id: null })
        .eq('id', paymentMatchId)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Betaling genegeerd' });
    }

    if (action === 'match' && invoiceId) {
      // Manual match: link payment to invoice
      const { error: matchError } = await supabase
        .from('payment_matches')
        .update({ status: 'matched', invoice_id: invoiceId })
        .eq('id', paymentMatchId)
        .eq('user_id', user.id);

      if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 500 });
      }

      // Update invoice status to betaald
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'betaald', paid_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (invoiceError) {
        return NextResponse.json({ error: invoiceError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Betaling gematcht aan factuur' });
    }

    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
