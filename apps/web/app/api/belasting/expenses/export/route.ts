import { createClient } from '@/lib/supabase/server'
import { exportExpensesToCSV } from '@/lib/belasting/csv-export'
import { NextResponse } from 'next/server'
import { Expense } from '@/lib/belasting/types'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const quarter = searchParams.get('quarter')

    // Build query
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (year) {
      query = query.eq('year', parseInt(year))
    }
    if (quarter) {
      query = query.eq('quarter', parseInt(quarter))
    }

    const { data: expenses, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Fout bij het ophalen van uitgaven', details: error.message },
        { status: 500 }
      )
    }

    // Generate CSV
    const csv = exportExpensesToCSV(expenses as Expense[])
    
    // Create filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filterStr = year && quarter 
      ? `_${year}_Q${quarter}` 
      : year 
        ? `_${year}` 
        : ''
    const filename = `uitgaven${filterStr}_${timestamp}.csv`

    // Return CSV as download
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Server fout bij exporteren', details: String(error) },
      { status: 500 }
    )
  }
}
