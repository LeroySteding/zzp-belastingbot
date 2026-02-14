import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import React from 'react'
import { renderToStream } from '@react-pdf/renderer'
import { BtwReportPDF } from '@/lib/pdf/btw-report-pdf'
import { calculateBtwRubrieken, groupExpensesByCategory } from '@/lib/btw-calculations'
import { BtwReportData } from '@/lib/types/reports'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from('btw_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Rapport niet gevonden' },
        { status: 404 }
      )
    }

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', report.year)
      .eq('quarter', report.quarter)
      .order('date', { ascending: true })

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
      return NextResponse.json(
        { error: 'Fout bij ophalen uitgaven' },
        { status: 500 }
      )
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Continue with empty profile if not found
    }

    // Calculate rubrieken and category breakdown
    const rubrieken = calculateBtwRubrieken(expenses || [])
    const expensesByCategory = groupExpensesByCategory(expenses || [])

    // Prepare data for PDF
    const pdfData: BtwReportData = {
      profile: profile || {
        id: user.id,
        company_name: null,
        btw_number: null,
        kvk_number: null,
        iban: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      report,
      rubrieken,
      expenses: expenses || [],
      expensesByCategory,
    }

    // Generate PDF
    const pdfElement = React.createElement(BtwReportPDF, { data: pdfData })
    // @ts-expect-error - Type mismatch between React element and @react-pdf/renderer types
    const stream = await renderToStream(pdfElement)

    // Convert stream to buffer for Next.js response
    const chunks: Buffer[] = []
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    
    const buffer = Buffer.concat(chunks)

    // Return PDF with appropriate headers
    const filename = `BTW-Rapport-Q${report.quarter}-${report.year}.pdf`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Fout bij genereren PDF', details: String(error) },
      { status: 500 }
    )
  }
}
