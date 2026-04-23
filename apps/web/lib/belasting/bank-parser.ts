/**
 * Bank Statement Parser for Dutch Banks
 * Supports ING, Rabobank, ABN AMRO, Knab, and Revolut CSV formats
 */

import { BankTransaction } from './types'

export type BankName = 'ING' | 'Rabobank' | 'ABN AMRO' | 'Knab' | 'Revolut' | 'Overig'

interface ParseResult {
  transactions: BankTransaction[]
  bankName: BankName
  errors: string[]
}

/**
 * Auto-detect bank format and parse CSV
 */
export function parseBankStatement(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length < 2) {
    return { transactions: [], bankName: 'Overig', errors: ['CSV bestand is leeg'] }
  }

  const header = lines[0].toLowerCase()
  
  // Detect bank by header format
  if (header.includes('datum') && header.includes('naam / omschrijving') && header.includes('bedrag')) {
    return parseINGFormat(lines)
  } else if (header.includes('rekeningnummer') && header.includes('creditdebet') && header.includes('tegenrekeninghouder')) {
    return parseKnabFormat(lines)
  } else if (header.includes('datum') && header.includes('omschrijving') && header.includes('bedrag')) {
    return parseRabobankFormat(lines)
  } else if (header.includes('boekingsdatum') || (header.includes('transactiedatum') && !header.includes('creditdebet'))) {
    return parseABNFormat(lines)
  } else if (header.includes('type') && header.includes('product') && header.includes('started date') && header.includes('state')) {
    return parseRevolutFormat(lines)
  }

  return parseGenericFormat(lines)
}

/**
 * ING CSV Format
 * Headers: Datum,Naam / Omschrijving,Rekening,Tegenrekening,Code,Af Bij,Bedrag (EUR),MutatieSoort,Mededelingen
 */
function parseINGFormat(lines: string[]): ParseResult {
  const transactions: BankTransaction[] = []
  const errors: string[] = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue
      
      const parts = parseCSVLine(line)
      if (parts.length < 7) continue
      
      const date = parseINGDate(parts[0])
      const description = parts[1] + (parts[8] ? ` - ${parts[8]}` : '')
      const afBij = parts[5]
      const amountStr = parts[6].replace(',', '.')
      let amount = parseFloat(amountStr)
      
      // ING uses "Af" for debit, "Bij" for credit
      // We want expenses (outgoing = negative)
      if (afBij === 'Bij') {
        amount = -amount // Credit is negative for expenses
      }
      
      // Only include expenses (outgoing money)
      if (amount > 0) {
        const { category, btw_rate } = categorizTransaction(description)
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: description.trim(),
          amount: Math.abs(amount),
          category,
          btw_rate,
        })
      }
    } catch (error) {
      errors.push(`Regel ${i + 1}: ${error}`)
    }
  }
  
  return { transactions, bankName: 'ING', errors }
}

/**
 * Rabobank CSV Format
 * Headers: IBAN/BBAN,Munt,BIC,Volgnr,Datum,Rentedatum,Bedrag,Saldo na trn,Tegenrekening,Naam tegenpartij,Omschrijving
 */
function parseRabobankFormat(lines: string[]): ParseResult {
  const transactions: BankTransaction[] = []
  const errors: string[] = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue
      
      const parts = parseCSVLine(line)
      if (parts.length < 11) continue
      
      const date = parseRabobankDate(parts[4])
      const amountStr = parts[6].replace(',', '.')
      const amount = parseFloat(amountStr)
      const description = parts[10] || parts[9] || 'Geen omschrijving'
      
      // Rabobank: negative = debit (outgoing), positive = credit
      if (amount < 0) {
        const { category, btw_rate } = categorizTransaction(description)
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: description.trim(),
          amount: Math.abs(amount),
          category,
          btw_rate,
        })
      }
    } catch (error) {
      errors.push(`Regel ${i + 1}: ${error}`)
    }
  }
  
  return { transactions, bankName: 'Rabobank', errors }
}

/**
 * ABN AMRO CSV Format (Tab-separated)
 * Headers: Boekingsdatum,Opdrachtgeversrekening,Tegenrekeningnummer,Naam tegenrekening,Transactiebedrag,Valutacode,Omschrijving
 */
function parseABNFormat(lines: string[]): ParseResult {
  const transactions: BankTransaction[] = []
  const errors: string[] = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue
      
      // ABN AMRO often uses tabs
      const parts = line.includes('\t') ? line.split('\t') : parseCSVLine(line)
      if (parts.length < 5) continue
      
      const date = parseABNDate(parts[0])
      const amountStr = parts[4].replace(',', '.')
      const amount = parseFloat(amountStr)
      const description = parts[6] || parts[3] || 'Geen omschrijving'
      
      // ABN: negative = debit (outgoing)
      if (amount < 0) {
        const { category, btw_rate } = categorizTransaction(description)
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: description.trim(),
          amount: Math.abs(amount),
          category,
          btw_rate,
        })
      }
    } catch (error) {
      errors.push(`Regel ${i + 1}: ${error}`)
    }
  }
  
  return { transactions, bankName: 'ABN AMRO', errors }
}

/**
 * Knab CSV Format
 * Headers: "Rekeningnummer","Transactiedatum","Valutacode","CreditDebet","Bedrag","Tegenrekening","Tegenrekeninghouder","Valutadatum","Betaalwijze","Omschrijving","Type betaling","Machtigingsnummer","Incassant ID","Adres"
 */
function parseKnabFormat(lines: string[]): ParseResult {
  const transactions: BankTransaction[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue

      const parts = parseCSVLine(line)
      if (parts.length < 10) continue

      const date = parseKnabDate(parts[1])
      const creditDebet = parts[3].trim().toUpperCase()
      const amountStr = parts[4].replace(',', '.')
      const amount = parseFloat(amountStr)

      // Knab: "D" for debit (outgoing), "C" for credit (incoming)
      // Amount is always positive, sign determined by CreditDebet
      const isExpense = creditDebet === 'D'

      if (isExpense && amount > 0) {
        const description = parts[9] || parts[6] || 'Geen omschrijving'
        const { category, btw_rate } = categorizTransaction(description)
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: description.trim(),
          amount: Math.abs(amount),
          category,
          btw_rate,
        })
      }
    } catch (error) {
      errors.push(`Regel ${i + 1}: ${error}`)
    }
  }

  return { transactions, bankName: 'Knab', errors }
}

/**
 * Revolut CSV Format
 * Headers: Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
 */
function parseRevolutFormat(lines: string[]): ParseResult {
  const transactions: BankTransaction[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue

      const parts = parseCSVLine(line)
      if (parts.length < 9) continue

      const state = parts[8].trim().toUpperCase()
      const currency = parts[7].trim().toUpperCase()

      // Only process completed EUR transactions
      if (state !== 'COMPLETED' || currency !== 'EUR') continue

      const dateStr = parts[2].trim() // Started Date
      const date = parseRevolutDate(dateStr)
      const amountStr = parts[5].replace(',', '.')
      const amount = parseFloat(amountStr)
      const feeStr = parts[6].replace(',', '.')
      const fee = parseFloat(feeStr) || 0
      const description = parts[4] || 'Geen omschrijving'

      // Revolut: negative amount = outgoing (expense)
      if (amount < 0) {
        const { category, btw_rate } = categorizTransaction(description)
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: description.trim(),
          amount: Math.abs(amount),
          category,
          btw_rate,
        })
      }

      // Also add fee as separate expense if applicable
      if (fee < 0) {
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: `Revolut fee: ${description.trim()}`,
          amount: Math.abs(fee),
          category: 'Overig',
          btw_rate: 0,
        })
      }
    } catch (error) {
      errors.push(`Regel ${i + 1}: ${error}`)
    }
  }

  return { transactions, bankName: 'Revolut', errors }
}

/**
 * Generic CSV parser (fallback)
 */
function parseGenericFormat(lines: string[]): ParseResult {
  const transactions: BankTransaction[] = []
  const errors: string[] = ['Onbekend bankformaat - generieke parser gebruikt']
  
  // Try to find date, description, amount columns
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue
      
      const parts = parseCSVLine(line)
      if (parts.length < 3) continue
      
      // Assume: first column = date, second = description, last numeric = amount
      const dateStr = parts[0]
      const description = parts[1] || 'Geen omschrijving'
      
      // Find amount (last numeric column)
      let amount = 0
      for (let j = parts.length - 1; j >= 0; j--) {
        const val = parts[j].replace(',', '.').replace(/[^\d.-]/g, '')
        if (val && !isNaN(parseFloat(val))) {
          amount = Math.abs(parseFloat(val))
          break
        }
      }
      
      if (amount > 0) {
        const date = parseDateFlexible(dateStr)
        const { category, btw_rate } = categorizTransaction(description)
        
        transactions.push({
          date: date.toISOString().split('T')[0],
          description: description.trim(),
          amount,
          category,
          btw_rate,
        })
      }
    } catch {
      // Skip invalid lines silently in generic mode
    }
  }
  
  return { transactions, bankName: 'Overig', errors }
}

/**
 * Parse CSV line respecting quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * Date parsers for different bank formats
 */
function parseINGDate(dateStr: string): Date {
  // ING format: YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

function parseRabobankDate(dateStr: string): Date {
  // Rabobank format: YYYY-MM-DD
  return new Date(dateStr)
}

function parseABNDate(dateStr: string): Date {
  // ABN format: DD-MM-YYYY or YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-')
    if (parts[0].length === 4) {
      return new Date(dateStr) // YYYY-MM-DD
    } else {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) // DD-MM-YYYY
    }
  }
  return new Date(dateStr)
}

function parseKnabDate(dateStr: string): Date {
  // Knab format: DD-MM-YYYY
  const parts = dateStr.trim().split('-')
  if (parts.length === 3 && parts[0].length <= 2) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }
  return new Date(dateStr)
}

function parseRevolutDate(dateStr: string): Date {
  // Revolut format: YYYY-MM-DD HH:MM:SS or similar ISO format
  // Take only the date portion
  const datePart = dateStr.trim().split(' ')[0]
  return new Date(datePart)
}

function parseDateFlexible(dateStr: string): Date {
  // Try multiple formats
  const cleaned = dateStr.replace(/[^\d-/]/g, '')
  
  if (cleaned.length === 8) {
    return parseINGDate(cleaned)
  }
  
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-')
    if (parts[0].length === 4) {
      return new Date(cleaned)
    } else {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    }
  }
  
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/')
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }
  
  return new Date()
}

/**
 * Auto-categorize transaction based on description keywords
 */
function categorizTransaction(description: string): { category: string; btw_rate: 0 | 9 | 21 } {
  const desc = description.toLowerCase()
  
  // Software & subscriptions (21% BTW)
  if (desc.match(/adobe|microsoft|google|dropbox|aws|github|slack|zoom|software|saas|hosting|domain/)) {
    return { category: 'Software', btw_rate: 21 }
  }
  
  // Phone & Internet (21% BTW)
  if (desc.match(/kpn|vodafone|t-mobile|ziggo|odido|telfort|provider|internet|mobiel|telefoon/)) {
    return { category: 'Telefoon/Internet', btw_rate: 21 }
  }
  
  // Insurance (usually 21% BTW)
  if (desc.match(/verzekering|insurance|zorgverzekering|aov|wia/)) {
    return { category: 'Verzekeringen', btw_rate: 21 }
  }
  
  // Travel (often 9% BTW for transport)
  if (desc.match(/ns\b|ov|tankstation|shell|bp|esso|benzine|diesel|parkeren|taxi|uber|train|trein|vliegtuig/)) {
    return { category: 'Reizen', btw_rate: 9 }
  }
  
  // Office supplies (21% BTW)
  if (desc.match(/staples|hema|action|kantoor|office|bureau|printer|papier|pen\b/)) {
    return { category: 'Kantoor', btw_rate: 21 }
  }
  
  // Default: Other with 21% BTW
  return { category: 'Overig', btw_rate: 21 }
}
