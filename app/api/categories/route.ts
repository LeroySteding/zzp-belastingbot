import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { EXPENSE_CATEGORIES } from '@/lib/types'

export async function GET() {
  try {
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

    // Fetch all expenses grouped by category
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('category, amount_excl, btw_amount, amount_incl')
      .eq('user_id', user.id)

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
      return NextResponse.json(
        { error: 'Fout bij ophalen uitgaven' },
        { status: 500 }
      )
    }

    // Calculate statistics per category
    const categoryStats = EXPENSE_CATEGORIES.map((category) => {
      const categoryExpenses = expenses?.filter((e) => e.category === category) || []
      
      const count = categoryExpenses.length
      const totalExcl = categoryExpenses.reduce(
        (sum, e) => sum + Number(e.amount_excl),
        0
      )
      const totalBtw = categoryExpenses.reduce(
        (sum, e) => sum + Number(e.btw_amount),
        0
      )
      const totalIncl = categoryExpenses.reduce(
        (sum, e) => sum + Number(e.amount_incl),
        0
      )
      const avgAmount = count > 0 ? totalIncl / count : 0

      return {
        name: category,
        count,
        totalExcl,
        totalBtw,
        totalIncl,
        avgAmount,
      }
    })

    // Sort by total amount (descending)
    categoryStats.sort((a, b) => b.totalIncl - a.totalIncl)

    // Calculate overall totals
    const overallStats = {
      totalExpenses: expenses?.length || 0,
      totalExcl: expenses?.reduce((sum, e) => sum + Number(e.amount_excl), 0) || 0,
      totalBtw: expenses?.reduce((sum, e) => sum + Number(e.btw_amount), 0) || 0,
      totalIncl: expenses?.reduce((sum, e) => sum + Number(e.amount_incl), 0) || 0,
    }

    return NextResponse.json({
      categories: categoryStats,
      overall: overallStats,
    })
  } catch (error) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    )
  }
}
