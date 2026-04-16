import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { BtwReportPDF } from '@/lib/belasting/btw-report-pdf'
import { calculateBtwRubrieken, groupExpensesByCategory } from '@/lib/belasting/btw-calculations'
import React from 'react'
import type { BtwReportData, Profile, Expense } from '@/lib/belasting/types/reports'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Fetch the report
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

    // Fetch expenses for the quarter
    const { data: rawExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', report.year)
      .eq('quarter', report.quarter)
      .order('date', { ascending: true })

    if (expensesError) {
      return NextResponse.json(
        { error: 'Fout bij ophalen uitgaven' },
        { status: 500 }
      )
    }

    const expenses: Expense[] = (rawExpenses || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      description: row.description as string,
      amount_excl: Number(row.amount_excl),
      btw_rate: Number(row.btw_rate),
      btw_amount: Number(row.btw_amount),
      amount_incl: Number(row.amount_incl),
      category: row.category as string,
      date: row.date as string,
      receipt_path: (row.receipt_path as string) || null,
      quarter: row.quarter as number,
      year: row.year as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }))

    // Fetch user profile for company info
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const profile: Profile = {
      id: profileData?.id ?? user.id,
      company_name: profileData?.company_name ?? null,
      btw_number: profileData?.btw_number ?? null,
      kvk_number: profileData?.kvk_number ?? null,
      iban: profileData?.iban ?? null,
      created_at: profileData?.created_at ?? new Date().toISOString(),
      updated_at: profileData?.updated_at ?? new Date().toISOString(),
    }

    // Calculate rubrieken and category groupings
    const rubrieken = calculateBtwRubrieken(expenses)
    const expensesByCategory = groupExpensesByCategory(expenses)

    // Assemble the data shape expected by BtwReportPDF
    const reportData: BtwReportData = {
      profile,
      report: {
        id: report.id,
        user_id: report.user_id,
        year: report.year,
        quarter: report.quarter,
        total_excl: Number(report.total_excl),
        total_btw: Number(report.total_btw),
        total_incl: Number(report.total_incl),
        pdf_path: report.pdf_path ?? null,
        status: report.status,
        created_at: report.created_at,
        updated_at: report.updated_at,
      },
      rubrieken,
      expenses,
      expensesByCategory,
    }

    // Render PDF to buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(BtwReportPDF, { data: reportData }) as any
    const pdfBuffer = await renderToBuffer(element)

    // Convert Node.js Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF with correct headers
    const filename = `btw-rapport-Q${report.quarter}-${report.year}.pdf`

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Fout bij genereren PDF' },
      { status: 500 }
    )
  }
}
