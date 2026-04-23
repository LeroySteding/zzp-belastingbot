// ============================================
// ZZP Platform - Shared Types
// ============================================

// --- User / Profile ---
export interface Profile {
  id: string
  company_name: string | null
  btw_number: string | null
  kvk_number: string | null
  iban: string | null
  phone: string | null
  email: string | null
  address: string | null
  logo_url: string | null
  kor_enabled: boolean
  kor_threshold: number
  created_at: string
  updated_at: string
}

// --- Clients (shared across factuur, uren, portal) ---
export interface Client {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  address: string | null
  kvk: string | null
  btw_number: string | null
  phone: string | null
  notes: string | null
  portal_access: boolean
  created_at: string
  updated_at: string
}

// --- Projects (shared across uren, portal) ---
export type ProjectStatus = 'offerte' | 'active' | 'review' | 'completed' | 'archived'

export interface Project {
  id: string
  user_id: string
  client_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  hourly_rate: number | null
  budget_hours: number | null
  deadline: string | null
  color: string
  portal_visible: boolean
  created_at: string
  updated_at: string
  // Joined
  client?: Client
}

// --- Invoices (factuur module) ---
export type InvoiceStatus = 'concept' | 'verzonden' | 'betaald' | 'verlopen'
export type RecurringFrequency = 'maandelijks' | 'kwartaal'

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  invoice_number: string
  date: string
  due_date: string
  status: InvoiceStatus
  notes: string | null
  template: string
  recurring_frequency: RecurringFrequency | null
  next_recurring_date: string | null
  subtotal: number
  total_btw: number
  total: number
  pdf_url: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  btw_rate: number
  btw_amount: number
  total: number
  sort_order: number
  created_at: string
}

// --- Time Entries (uren module) ---
export interface TimeEntry {
  id: string
  user_id: string
  project_id: string
  date: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number
  description: string | null
  billable: boolean
  invoice_id: string | null
  created_at: string
  updated_at: string
  // Joined
  project?: Project
}

// --- Timesheets (uren module) ---
export type TimesheetStatus = 'concept' | 'goedgekeurd' | 'gefactureerd'

export interface Timesheet {
  id: string
  user_id: string
  start_date: string
  end_date: string
  status: TimesheetStatus
  created_at: string
}

// --- Expenses (belasting module) ---
export type ExpenseCategory = 'Kantoor' | 'Reizen' | 'Software' | 'Telefoon/Internet' | 'Verzekeringen' | 'Overig'
export type BtwRate = 0 | 9 | 21
export type ExpenseSource = 'manual' | 'bank_import' | 'recurring'

export interface Expense {
  id: string
  user_id: string
  description: string
  amount_excl: number
  btw_rate: BtwRate
  btw_amount: number
  amount_incl: number
  category: ExpenseCategory
  date: string
  receipt_path: string | null
  quarter: number
  year: number
  is_recurring: boolean
  recurring_frequency: string | null
  source: ExpenseSource
  created_at: string
  updated_at: string
}

// --- BTW Reports (belasting module) ---
export type ReportStatus = 'concept' | 'ingediend' | 'betaald'

export interface BtwReport {
  id: string
  user_id: string
  year: number
  quarter: number
  total_excl: number
  total_btw: number
  total_incl: number
  pdf_path: string | null
  status: ReportStatus
  created_at: string
  updated_at: string
}

// --- Portal (klantportaal module) ---
export interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  completed: boolean
  due_date: string | null
  sort_order: number
  created_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  uploaded_by: string
  name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  portal_visible: boolean
  created_at: string
}

export interface ProjectComment {
  id: string
  project_id: string
  author_id: string | null
  author_name: string
  content: string
  is_client: boolean
  created_at: string
}

export interface PortalSettings {
  id: string
  user_id: string
  company_name: string | null
  logo_url: string | null
  primary_color: string
  portal_slug: string | null
  custom_domain: string | null
  welcome_email_subject: string | null
  welcome_email_body: string | null
  created_at: string
  updated_at: string
}

// --- Constants (belasting module) ---
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

export interface BankTransaction {
  date: string
  description: string
  amount: number
  category?: string
  btw_rate?: 0 | 9 | 21
}

// --- Bank Imports (belasting module) ---
export type BankName = 'ING' | 'Rabobank' | 'ABN AMRO' | 'Knab' | 'Revolut' | 'Overig'

export interface BankImport {
  id: string
  user_id: string
  filename: string
  bank_name: BankName
  import_date: string
  total_transactions: number
  transactions_imported: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}
