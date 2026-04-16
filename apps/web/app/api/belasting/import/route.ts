import { createClient } from '@/lib/supabase/server'
import { parseBankStatement } from '@/lib/belasting/bank-parser'
import { NextResponse } from 'next/server'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand geüpload' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()
    
    // Parse the bank statement
    const parseResult = parseBankStatement(content)
    
    if (parseResult.errors.length > 0 && parseResult.transactions.length === 0) {
      return NextResponse.json(
        { 
          error: 'Fout bij het parseren van het bankbestand',
          details: parseResult.errors 
        },
        { status: 400 }
      )
    }

    // Create bank import record
    const { data: importRecord, error: importError } = await supabase
      .from('bank_imports')
      .insert({
        user_id: user.id,
        filename: file.name,
        bank_name: parseResult.bankName,
        total_transactions: parseResult.transactions.length,
        transactions_imported: 0,
        status: 'pending',
      })
      .select()
      .single()

    if (importError) {
      return NextResponse.json(
        { error: 'Fout bij het opslaan van import', details: importError.message },
        { status: 500 }
      )
    }

    // Return transactions for review (don't import yet)
    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      bankName: parseResult.bankName,
      transactions: parseResult.transactions,
      warnings: parseResult.errors,
    })

  } catch (error) {
    console.error('Bank import error:', error)
    return NextResponse.json(
      { error: 'Server fout bij het importeren', details: String(error) },
      { status: 500 }
    )
  }
}
