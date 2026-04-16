import { Invoice, LineItem, InvoiceCalculation } from '@/lib/factuur/types/invoice';

export function calculateInvoice(items: LineItem[]): InvoiceCalculation {
  let subtotal = 0;
  let btw21 = 0;
  let btw9 = 0;
  let btw0 = 0;

  items.forEach(item => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;

    const btwAmount = itemTotal * (item.btwRate / 100);
    if (item.btwRate === 21) {
      btw21 += btwAmount;
    } else if (item.btwRate === 9) {
      btw9 += btwAmount;
    }
  });

  const totalBtw = btw21 + btw9 + btw0;
  const total = subtotal + totalBtw;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    btw21: Math.round(btw21 * 100) / 100,
    btw9: Math.round(btw9 * 100) / 100,
    btw0: Math.round(btw0 * 100) / 100,
    totalBtw: Math.round(totalBtw * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FACT-${year}-${month}${random}`;
}

export function getInvoiceTotal(invoice: Invoice): number {
  const calc = calculateInvoice(invoice.items);
  return calc.total;
}

export function getDueDate(invoiceDate: string, daysUntilDue: number = 30): string {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + daysUntilDue);
  return date.toISOString().split('T')[0];
}
