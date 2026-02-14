import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service niet beschikbaar' },
        { status: 503 }
      )
    }

    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Geldig e-mailadres vereist' },
        { status: 400 }
      )
    }

    // Get user agent and referrer for analytics
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email.toLowerCase().trim(),
          user_agent: userAgent,
          referrer: referrer,
        },
      ])
      .select()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Dit e-mailadres staat al op de wachtlijst!' },
          { status: 400 }
        )
      }
      console.error('Waitlist error:', error)
      return NextResponse.json(
        { error: 'Er ging iets mis. Probeer het later opnieuw.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Je staat op de wachtlijst!', data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Er ging iets mis. Probeer het later opnieuw.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Waitlist count error:', error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 }, { status: 200 })
  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
