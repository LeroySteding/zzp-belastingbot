import { Expense, Profile } from './types'

export const mockProfile: Profile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  company_name: 'Mijn ZZP Bedrijf',
  btw_number: 'NL123456789B01',
  kvk_number: '12345678',
  iban: 'NL91ABNA0417164300',
  kor_enabled: false,
  kor_threshold: 20000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const currentYear = new Date().getFullYear()
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

export const mockExpenses: Expense[] = [
  {
    id: '1',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Kantoorbenodigdheden - Bureau en stoel',
    amount_excl: 450.00,
    btw_rate: 21,
    btw_amount: 94.50,
    amount_incl: 544.50,
    category: 'Kantoor',
    date: `${currentYear}-${String(currentQuarter * 3 - 2).padStart(2, '0')}-15`,
    receipt_path: null,
    quarter: currentQuarter,
    year: currentYear,
    is_recurring: false,
    recurring_frequency: null,
    recurring_end_date: null,
    parent_recurring_id: null,
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Adobe Creative Cloud abonnement',
    amount_excl: 59.99,
    btw_rate: 21,
    btw_amount: 12.60,
    amount_incl: 72.59,
    category: 'Software',
    date: `${currentYear}-${String(currentQuarter * 3 - 1).padStart(2, '0')}-01`,
    receipt_path: null,
    quarter: currentQuarter,
    year: currentYear,
    is_recurring: true,
    recurring_frequency: 'monthly',
    recurring_end_date: null,
    parent_recurring_id: null,
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Treinticket Amsterdam - Rotterdam',
    amount_excl: 18.50,
    btw_rate: 9,
    btw_amount: 1.67,
    amount_incl: 20.17,
    category: 'Reizen',
    date: `${currentYear}-${String(currentQuarter * 3 - 1).padStart(2, '0')}-10`,
    receipt_path: null,
    quarter: currentQuarter,
    year: currentYear,
    is_recurring: false,
    recurring_frequency: null,
    recurring_end_date: null,
    parent_recurring_id: null,
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Ziggo internet abonnement',
    amount_excl: 45.00,
    btw_rate: 21,
    btw_amount: 9.45,
    amount_incl: 54.45,
    category: 'Telefoon/Internet',
    date: `${currentYear}-${String(currentQuarter * 3).padStart(2, '0')}-01`,
    receipt_path: null,
    quarter: currentQuarter,
    year: currentYear,
    is_recurring: true,
    recurring_frequency: 'monthly',
    recurring_end_date: null,
    parent_recurring_id: null,
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Aansprakelijkheidsverzekering',
    amount_excl: 35.00,
    btw_rate: 21,
    btw_amount: 7.35,
    amount_incl: 42.35,
    category: 'Verzekeringen',
    date: `${currentYear}-${String(currentQuarter * 3 - 2).padStart(2, '0')}-01`,
    receipt_path: null,
    quarter: currentQuarter,
    year: currentYear,
    is_recurring: true,
    recurring_frequency: 'monthly',
    recurring_end_date: null,
    parent_recurring_id: null,
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function getExpensesByQuarter(year: number, quarter: number): Expense[] {
  return mockExpenses.filter(
    (expense) => expense.year === year && expense.quarter === quarter
  )
}

export function calculateQuarterSummary(year: number, quarter: number) {
  const expenses = getExpensesByQuarter(year, quarter)
  
  const totalExcl = expenses.reduce((sum, expense) => sum + expense.amount_excl, 0)
  const totalBTW = expenses.reduce((sum, expense) => sum + expense.btw_amount, 0)
  const totalIncl = expenses.reduce((sum, expense) => sum + expense.amount_incl, 0)
  const count = expenses.length

  return {
    totalExcl: totalExcl.toFixed(2),
    totalBTW: totalBTW.toFixed(2),
    totalIncl: totalIncl.toFixed(2),
    count,
  }
}
