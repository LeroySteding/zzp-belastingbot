export interface Profile {
  id: string
  company_name: string | null
  btw_number: string | null
  kvk_number: string | null
  iban: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  description: string
  amount_excl: number
  btw_rate: 0 | 9 | 21
  btw_amount: number
  amount_incl: number
  category: 'Kantoor' | 'Reizen' | 'Software' | 'Telefoon/Internet' | 'Verzekeringen' | 'Overig'
  date: string
  receipt_path: string | null
  quarter: number
  year: number
  created_at: string
  updated_at: string
}

export interface BTWReport {
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
}

export const EXPENSE_CATEGORIES = [
  'Kantoor',
  'Reizen',
  'Software',
  'Telefoon/Internet',
  'Verzekeringen',
  'Overig',
] as const

export const BTW_RATES = [0, 9, 21] as const
