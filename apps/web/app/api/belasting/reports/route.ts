import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { calculateBtwRubrieken, groupExpensesByCategory } from '@/lib/belasting/btw-calculations'

const createReportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createReportSchema.parse(body)
    const { year, quarter } = validatedData

    // Fetch expenses for the specified quarter
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .order('date', { ascending: true })

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
      return NextResponse.json(
        { error: 'Fout bij ophalen uitgaven' },
        { status: 500 }
      )
    }

    if (!expenses || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Geen uitgaven gevonden voor dit kwartaal' },
        { status: 400 }
      )
    }

    // Calculate totals
    const total_excl = expenses.reduce(
      (sum, e) => sum + Number(e.amount_excl),
      0
    )
    const total_btw = expenses.reduce(
      (sum, e) => sum + Number(e.btw_amount),
      0
    )
    const total_incl = expenses.reduce(
      (sum, e) => sum + Number(e.amount_incl),
      0
    )

    // Check if report already exists
    const { data: existingReport, error: checkError } = await supabase
      .from('btw_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error('Error checking existing report:', checkError)
      return NextResponse.json(
        { error: 'Fout bij controleren bestaand rapport' },
        { status: 500 }
      )
    }

    let report

    if (existingReport) {
      // Update existing report
      const { data: updatedReport, error: updateError } = await supabase
        .from('btw_reports')
        .update({
          total_excl,
          total_btw,
          total_incl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReport.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating report:', updateError)
        return NextResponse.json(
          { error: 'Fout bij bijwerken rapport' },
          { status: 500 }
        )
      }

      report = updatedReport
    } else {
      // Create new report
      const { data: newReport, error: createError } = await supabase
        .from('btw_reports')
        .insert({
          user_id: user.id,
          year,
          quarter,
          total_excl,
          total_btw,
          total_incl,
          status: 'concept',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating report:', createError)
        return NextResponse.json(
          { error: 'Fout bij aanmaken rapport' },
          { status: 500 }
        )
      }

      report = newReport
    }

    // Calculate rubrieken
    const rubrieken = calculateBtwRubrieken(expenses)
    const expensesByCategory = groupExpensesByCategory(expenses)

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        rubrieken,
        expensesByCategory,
        expenseCount: expenses.length,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/reports:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ongeldige invoer', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Fetch all reports for the user
    const { data: reports, error: reportsError } = await supabase
      .from('btw_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return NextResponse.json(
        { error: 'Fout bij ophalen rapporten' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('Error in GET /api/reports:', error)
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    )
  }
}
