import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichPerson, isApolloConfigured } from '@/lib/integrations/apollo';

// ---------------------------------------------------------------------------
// POST - Proxy Apollo enrichment requests
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Config check
    if (!isApolloConfigured()) {
      return NextResponse.json(
        {
          error: 'Apollo API key is niet geconfigureerd',
          configured: false,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { linkedinUrl, email, firstName, lastName, organizationName } = body;

    if (!linkedinUrl && !email && !(firstName && lastName)) {
      return NextResponse.json(
        { error: 'Geef minimaal een LinkedIn URL, e-mail, of naam op' },
        { status: 400 }
      );
    }

    const person = await enrichPerson({
      linkedinUrl,
      email,
      firstName,
      lastName,
      organizationName,
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Geen resultaten gevonden voor deze persoon' },
        { status: 404 }
      );
    }

    return NextResponse.json({ person });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Onbekende fout bij Apollo enrichment';
    console.error('[Apollo Enrich]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
