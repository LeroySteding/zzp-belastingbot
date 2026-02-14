import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { BankTransaction } from '@/lib/types'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { importId, transactions } = body as {
      importId: string
      transactions: BankTransaction[]
    }

    if (!importId || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Ongeldige gegevens' },
        { status: 400 }
      )
    }

    // Verify import belongs to user
    const { data: importRecord, error: importCheckError } = await supabase
      .from('bank_imports')
      .select('*')
      .eq('id', importId)
      .eq('user_id', user.id)
      .single()

    if (importCheckError || !importRecord) {
      return NextResponse.json(
        { error: 'Import niet gevonden' },
        { status: 404 }
      )
    }

    // Insert expenses
    const expensesToInsert = transactions.map(tx => ({
      user_id: user.id,
      description: tx.description,
      amount_excl: tx.amount / (1 + (tx.btw_rate || 21) / 100),
      btw_rate: tx.btw_rate || 21,
      category: tx.category || 'Overig',
      date: tx.date,
      source: 'bank_import',
      is_recurring: false,
    }))

    const { data: insertedExpenses, error: insertError } = await supabase
      .from('expenses')
      .insert(expensesToInsert)
      .select()

    if (insertError) {
      return NextResponse.json(
        { error: 'Fout bij het opslaan van uitgaven', details: insertError.message },
        { status: 500 }
      )
    }

    // Update import record
    await supabase
      .from('bank_imports')
      .update({
        transactions_imported: insertedExpenses.length,
        status: 'completed',
      })
      .eq('id', importId)

    return NextResponse.json({
      success: true,
      imported: insertedExpenses.length,
    })

  } catch (error) {
    console.error('Bank import confirm error:', error)
    return NextResponse.json(
      { error: 'Server fout', details: String(error) },
      { status: 500 }
    )
  }
}
