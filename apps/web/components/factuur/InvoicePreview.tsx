import { Invoice } from '@/lib/factuur/types/invoice';
import { calculateInvoice, formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';
import { FileText } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const calculation = calculateInvoice(invoice.items);

  return (
    <div className="bg-white border rounded-lg p-8 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">Logo</span>
          </div>
          <div className="text-sm whitespace-pre-line">{invoice.company.name}</div>
          <div className="text-sm text-gray-600 whitespace-pre-line">{invoice.company.address}</div>
          {invoice.company.email && (
            <div className="text-sm text-gray-600">{invoice.company.email}</div>
          )}
          {invoice.company.phone && (
            <div className="text-sm text-gray-600">{invoice.company.phone}</div>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold mb-2">FACTUUR</h1>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-600">Nummer:</span> {invoice.invoiceNumber}</div>
            <div><span className="text-gray-600">Datum:</span> {formatDate(invoice.date)}</div>
            <div><span className="text-gray-600">Vervaldatum:</span> {formatDate(invoice.dueDate)}</div>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-700 mb-2">FACTUURADRES</div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="font-medium">{invoice.client.name}</div>
          <div className="text-sm text-gray-600 whitespace-pre-line">{invoice.client.address}</div>
          {invoice.client.email && (
            <div className="text-sm text-gray-600">{invoice.client.email}</div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 text-sm font-semibold">OMSCHRIJVING</th>
            <th className="text-right py-2 text-sm font-semibold">AANTAL</th>
            <th className="text-right py-2 text-sm font-semibold">PRIJS</th>
            <th className="text-right py-2 text-sm font-semibold">BTW</th>
            <th className="text-right py-2 text-sm font-semibold">TOTAAL</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3 text-sm">{item.description}</td>
              <td className="py-3 text-sm text-right">{item.quantity}</td>
              <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 text-sm text-right">{item.btwRate}%</td>
              <td className="py-3 text-sm text-right font-medium">
                {formatCurrency(item.quantity * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotaal</span>
            <span>{formatCurrency(calculation.subtotal)}</span>
          </div>
          {calculation.btw21 > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">BTW 21%</span>
              <span>{formatCurrency(calculation.btw21)}</span>
            </div>
          )}
          {calculation.btw9 > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">BTW 9%</span>
              <span>{formatCurrency(calculation.btw9)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-300">
            <span>Totaal</span>
            <span>{formatCurrency(calculation.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-6 space-y-4 text-sm">
        <div>
          <div className="font-semibold mb-1">BETAALGEGEVENS</div>
          <div className="text-gray-600">
            <div>IBAN: {invoice.company.iban}</div>
            <div>t.n.v. {invoice.company.name}</div>
            <div>o.v.v. {invoice.invoiceNumber}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <div>KvK-nummer: {invoice.company.kvk}</div>
            <div>BTW-nummer: {invoice.company.btwNumber}</div>
          </div>
        </div>

        {invoice.notes && (
          <div className="pt-4 border-t">
            <div className="font-semibold mb-1">OPMERKINGEN</div>
            <div className="text-gray-600">{invoice.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
