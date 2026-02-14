import { BtwRubriek, Expense } from './types/reports'

/**
 * Calculate BTW rubrieken from expenses
 * Based on Dutch tax office (Belastingdienst) format
 */
export function calculateBtwRubrieken(expenses: Expense[]): BtwRubriek[] {
  // Group expenses by BTW rate
  const expensesByRate = expenses.reduce((acc, expense) => {
    const rate = expense.btw_rate
    if (!acc[rate]) {
      acc[rate] = []
    }
    acc[rate].push(expense)
    return acc
  }, {} as Record<number, Expense[]>)

  const rubrieken: BtwRubriek[] = []

  // Rubriek 1a: Leveringen/diensten belast met hoog tarief (21%)
  const rate21Expenses = expensesByRate[21] || []
  const rate21Base = rate21Expenses.reduce((sum, e) => sum + Number(e.amount_excl), 0)
  const rate21Btw = rate21Expenses.reduce((sum, e) => sum + Number(e.btw_amount), 0)
  
  rubrieken.push({
    code: '1a',
    description: 'Leveringen/diensten belast met hoog tarief (21%)',
    baseAmount: rate21Base,
    btwAmount: rate21Btw,
  })

  // Rubriek 1b: Leveringen/diensten belast met laag tarief (9%)
  const rate9Expenses = expensesByRate[9] || []
  const rate9Base = rate9Expenses.reduce((sum, e) => sum + Number(e.amount_excl), 0)
  const rate9Btw = rate9Expenses.reduce((sum, e) => sum + Number(e.btw_amount), 0)
  
  rubrieken.push({
    code: '1b',
    description: 'Leveringen/diensten belast met laag tarief (9%)',
    baseAmount: rate9Base,
    btwAmount: rate9Btw,
  })

  // Rubriek 1e: Leveringen/diensten belast met 0% of niet bij u belast
  const rate0Expenses = expensesByRate[0] || []
  const rate0Base = rate0Expenses.reduce((sum, e) => sum + Number(e.amount_excl), 0)
  
  rubrieken.push({
    code: '1e',
    description: 'Leveringen/diensten belast met 0% of niet bij u belast',
    baseAmount: rate0Base,
    btwAmount: 0,
  })

  // Rubriek 5b: Voorbelasting (input BTW you can deduct)
  // For ZZP'ers, this is the BTW they paid on expenses
  const totalVoorbelasting = rate21Btw + rate9Btw
  
  rubrieken.push({
    code: '5b',
    description: 'Voorbelasting',
    baseAmount: 0, // Not applicable for this rubriek
    btwAmount: totalVoorbelasting,
  })

  // Rubriek 5g: Totaal te betalen / te ontvangen
  // Since we only track expenses (not income), this will typically be negative
  // In real scenario: (output BTW from sales) - (input BTW from expenses)
  // For now: negative voorbelasting means refund expected
  const totalTeBetalen = -totalVoorbelasting
  
  rubrieken.push({
    code: '5g',
    description: 'Totaal te betalen / te ontvangen',
    baseAmount: 0,
    btwAmount: totalTeBetalen,
  })

  return rubrieken
}

/**
 * Get quarter start and end dates
 */
export function getQuarterDates(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3
  const endMonth = startMonth + 2
  
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0) // Last day of end month
  
  return { start, end }
}

/**
 * Get quarter label
 */
export function getQuarterLabel(quarter: number): string {
  return `Q${quarter}`
}

/**
 * Get quarter period description
 */
export function getQuarterPeriod(year: number, quarter: number): string {
  const months = [
    ['januari', 'februari', 'maart'],
    ['april', 'mei', 'juni'],
    ['juli', 'augustus', 'september'],
    ['oktober', 'november', 'december']
  ]
  
  const quarterMonths = months[quarter - 1]
  return `${quarterMonths[0]} - ${quarterMonths[2]} ${year}`
}

/**
 * Format currency in euros
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Group expenses by category with totals
 */
export function groupExpensesByCategory(expenses: Expense[]) {
  return expenses.reduce((acc, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        totalExcl: 0,
        totalBtw: 0,
        totalIncl: 0,
      }
    }
    
    acc[category].count++
    acc[category].totalExcl += Number(expense.amount_excl)
    acc[category].totalBtw += Number(expense.btw_amount)
    acc[category].totalIncl += Number(expense.amount_incl)
    
    return acc
  }, {} as Record<string, { count: number; totalExcl: number; totalBtw: number; totalIncl: number }>)
}
