export interface BtwRubriek {
  code: string
  description: string
  baseAmount: number
  btwAmount: number
}

export interface BtwReport {
  id: string
  user_id: string
  year: number
  quarter: number
  total_excl: number
  total_btw: number
  total_incl: number
  pdf_path: string | null
  status: 'concept' | 'ingediend' | 'betaald'
  created_at: string
  updated_at: string
  rubrieken?: BtwRubriek[]
  expenses?: Expense[]
}

export interface Expense {
  id: string
  user_id: string
  description: string
  amount_excl: number
  btw_rate: number
  btw_amount: number
  amount_incl: number
  category: string
  date: string
  receipt_path: string | null
  quarter: number
  year: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_name: string | null
  btw_number: string | null
  kvk_number: string | null
  iban: string | null
  created_at: string
  updated_at: string
}

export interface BtwReportData {
  profile: Profile
  report: BtwReport
  rubrieken: BtwRubriek[]
  expenses: Expense[]
  expensesByCategory: Record<string, {
    count: number
    totalExcl: number
    totalBtw: number
    totalIncl: number
  }>
}
