import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Invoice, LineItem, InvoiceCalculation } from '@/lib/factuur/types/invoice';

// ============================================
// CALCULATION HELPERS (duplicated to avoid import issues in PDF context)
// ============================================

function calculateInvoice(items: LineItem[]): InvoiceCalculation {
  let subtotal = 0;
  let btw21 = 0;
  let btw9 = 0;
  let btw0 = 0;

  items.forEach((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;
    const btwAmount = itemTotal * (item.btwRate / 100);
    if (item.btwRate === 21) btw21 += btwAmount;
    else if (item.btwRate === 9) btw9 += btwAmount;
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

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ============================================
// COLORS
// ============================================

const ACCENT = '#1e40af'; // blue-800
const ACCENT_LIGHT = '#dbeafe'; // blue-100
const GRAY = '#6b7280';
const GRAY_LIGHT = '#f3f4f6';
const BORDER = '#e5e7eb';
const BLACK = '#111827';

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: BLACK,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companySection: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 2,
  },
  titleSection: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    color: GRAY,
    width: 80,
    textAlign: 'right',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    width: 100,
    textAlign: 'right',
  },

  // Client section
  clientSection: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  clientBox: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  clientLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  clientDetail: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 2,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },

  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
  },
  colDescription: {
    flex: 4,
  },
  colQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  colPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colBtw: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
  },

  // Totals
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  totalsBox: {
    width: 220,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 9,
    color: GRAY,
  },
  totalValue: {
    fontSize: 9,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 4,
    backgroundColor: ACCENT,
    borderRadius: 3,
  },
  totalLabelFinal: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalValueFinal: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  paymentSection: {
    backgroundColor: GRAY_LIGHT,
    padding: 14,
    borderRadius: 4,
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: ACCENT,
  },
  paymentText: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 2,
  },
  paymentHighlight: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    marginTop: 4,
  },
  footerGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerColumn: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 7,
    color: GRAY,
    marginBottom: 1,
  },
  footerValue: {
    fontSize: 8,
    marginBottom: 4,
  },
  notes: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    borderRadius: 3,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: '#78350f',
  },
});

// ============================================
// STATUS LABELS
// ============================================

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
  verlopen: 'Verlopen',
};

// ============================================
// COMPONENT
// ============================================

interface InvoicePDFTemplateProps {
  invoice: Invoice;
  paymentUrl?: string;
}

export function InvoicePDFTemplate({ invoice, paymentUrl }: InvoicePDFTemplateProps) {
  const calc = calculateInvoice(invoice.items);

  // Calculate payment term in days
  const invoiceDate = new Date(invoice.date);
  const dueDate = new Date(invoice.dueDate);
  const paymentTermDays = Math.round(
    (dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{invoice.company.name || 'Bedrijfsnaam'}</Text>
            {invoice.company.address && (
              <Text style={styles.companyDetail}>{invoice.company.address}</Text>
            )}
            {invoice.company.email && (
              <Text style={styles.companyDetail}>{invoice.company.email}</Text>
            )}
            {invoice.company.phone && (
              <Text style={styles.companyDetail}>{invoice.company.phone}</Text>
            )}
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.invoiceTitle}>FACTUUR</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Factuurnummer:</Text>
              <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Factuurdatum:</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Vervaldatum:</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Status badge */}
        {invoice.status && invoice.status !== 'concept' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {statusLabels[invoice.status] || invoice.status}
            </Text>
          </View>
        )}

        {/* Client */}
        <View style={styles.clientSection}>
          <View style={styles.clientBox}>
            <Text style={styles.clientLabel}>Aan</Text>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            {invoice.client.address && (
              <Text style={styles.clientDetail}>{invoice.client.address}</Text>
            )}
            {invoice.client.email && (
              <Text style={styles.clientDetail}>{invoice.client.email}</Text>
            )}
            {invoice.client.kvk && (
              <Text style={styles.clientDetail}>KvK: {invoice.client.kvk}</Text>
            )}
            {invoice.client.btwNumber && (
              <Text style={styles.clientDetail}>BTW: {invoice.client.btwNumber}</Text>
            )}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Omschrijving</Text>
            <Text style={[styles.tableHeaderText, styles.colQuantity]}>Aantal</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Prijs</Text>
            <Text style={[styles.tableHeaderText, styles.colBtw]}>BTW</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Totaal</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{fmtCurrency(item.unitPrice)}</Text>
              <Text style={styles.colBtw}>{item.btwRate}%</Text>
              <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
                {fmtCurrency(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotaal</Text>
              <Text style={styles.totalValue}>{fmtCurrency(calc.subtotal)}</Text>
            </View>
            {calc.btw21 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>BTW 21%</Text>
                <Text style={styles.totalValue}>{fmtCurrency(calc.btw21)}</Text>
              </View>
            )}
            {calc.btw9 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>BTW 9%</Text>
                <Text style={styles.totalValue}>{fmtCurrency(calc.btw9)}</Text>
              </View>
            )}
            {calc.btw0 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>BTW 0%</Text>
                <Text style={styles.totalValue}>{fmtCurrency(calc.btw0)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>Totaal</Text>
              <Text style={styles.totalValueFinal}>{fmtCurrency(calc.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Payment info */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Betaalgegevens</Text>
            <Text style={styles.paymentText}>
              Gelieve het totaalbedrag van {fmtCurrency(calc.total)} binnen{' '}
              {paymentTermDays > 0 ? paymentTermDays : 30} dagen over te maken op:
            </Text>
            <Text style={styles.paymentHighlight}>
              IBAN: {invoice.company.iban || '-'}
            </Text>
            <Text style={styles.paymentText}>
              t.n.v. {invoice.company.name}
            </Text>
            <Text style={styles.paymentText}>
              o.v.v. {invoice.invoiceNumber}
            </Text>
            {paymentUrl && (
              <Text style={[styles.paymentHighlight, { marginTop: 6 }]}>
                Online betalen: {paymentUrl}
              </Text>
            )}
          </View>

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Opmerkingen</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Company registration info */}
          <View style={styles.footerGrid}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>KvK-nummer</Text>
              <Text style={styles.footerValue}>{invoice.company.kvk || '-'}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>BTW-nummer</Text>
              <Text style={styles.footerValue}>{invoice.company.btwNumber || '-'}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>IBAN</Text>
              <Text style={styles.footerValue}>{invoice.company.iban || '-'}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
