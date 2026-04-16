import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  searchPeople,
  searchCompanies,
  isApolloConfigured,
} from '@/lib/integrations/apollo';

// ---------------------------------------------------------------------------
// POST - Proxy Apollo search requests (people or companies)
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
    const {
      type = 'people',
      domains,
      titles,
      locations,
      employeeRanges,
      keywords,
      industries,
      page,
      perPage,
    } = body;

    if (type === 'companies') {
      const result = await searchCompanies({
        keywords,
        locations,
        employeeRanges,
        industries,
        page,
        perPage,
      });
      return NextResponse.json({ type: 'companies', ...result });
    }

    // Default: people search
    const result = await searchPeople({
      domains,
      titles,
      locations,
      employeeRanges,
      keywords,
      page,
      perPage,
    });
    return NextResponse.json({ type: 'people', ...result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Onbekende fout bij Apollo zoeken';
    console.error('[Apollo Search]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
