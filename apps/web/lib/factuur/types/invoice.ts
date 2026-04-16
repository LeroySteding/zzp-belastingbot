export interface CompanyInfo {
  name: string;
  address: string;
  kvk: string;
  btwNumber: string;
  iban: string;
  email?: string;
  phone?: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  email?: string;
  kvk?: string;
  btwNumber?: string;
}

// Separate Client entity for client management
export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
  kvk?: string;
  btwNumber?: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  btwRate: 21 | 9 | 0;
}

export type InvoiceStatus = 'concept' | 'verzonden' | 'betaald';
export type RecurringFrequency = 'maandelijks' | 'kwartaal' | null;
export type InvoiceTemplate = 'modern' | 'classic' | 'minimal';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  company: CompanyInfo;
  client: ClientInfo;
  clientId?: string;
  items: LineItem[];
  status: InvoiceStatus;
  notes?: string;
  recurring?: RecurringFrequency;
  nextRecurringDate?: string;
  template?: InvoiceTemplate;
}

export interface InvoiceCalculation {
  subtotal: number;
  btw21: number;
  btw9: number;
  btw0: number;
  totalBtw: number;
  total: number;
}
