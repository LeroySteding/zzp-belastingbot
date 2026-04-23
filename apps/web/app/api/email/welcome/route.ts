export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { buildWelcomeEmail } from '@/lib/email/emails';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get the user's display name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || user.email?.split('@')[0] || 'gebruiker';

    const { subject, html, text } = buildWelcomeEmail(userName);

    const result = await sendEmail({
      to: user.email!,
      subject,
      html,
      text,
      tags: [{ name: 'type', value: 'welcome' }],
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    console.error('Welcome email error:', err);
    return NextResponse.json(
      { error: 'Welkomstmail verzenden mislukt' },
      { status: 500 },
    );
  }
}
