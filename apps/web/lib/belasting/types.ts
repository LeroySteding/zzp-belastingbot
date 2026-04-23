export interface Profile {
  id: string
  display_name: string | null
  company_name: string | null
  btw_number: string | null
  kvk_number: string | null
  iban: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  kor_enabled: boolean
  kor_threshold: number
  default_payment_term: number
  default_btw_rate: number
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
  is_recurring: boolean
  recurring_frequency: 'monthly' | 'quarterly' | 'yearly' | null
  recurring_end_date: string | null
  parent_recurring_id: string | null
  source: 'manual' | 'bank_import' | 'recurring'
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

export interface BankImport {
  id: string
  user_id: string
  filename: string
  bank_name: 'ING' | 'Rabobank' | 'ABN AMRO' | 'Knab' | 'Revolut' | 'Overig'
  import_date: string
  total_transactions: number
  transactions_imported: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface BankTransaction {
  date: string
  description: string
  amount: number
  category?: string
  btw_rate?: 0 | 9 | 21
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

export const RECURRING_FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const
