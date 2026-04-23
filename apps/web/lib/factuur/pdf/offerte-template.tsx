import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CompanyInfo, ClientInfo, LineItem, InvoiceCalculation } from '@/lib/factuur/types/invoice';

// ============================================
// TYPES
// ============================================

export interface OfferteForPDF {
  id: string;
  offerteNumber: string;
  date: string;
  validUntil: string;
  status: string;
  company: CompanyInfo;
  client: ClientInfo;
  items: LineItem[];
  notes?: string;
}

// ============================================
// CALCULATION HELPERS
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

const ACCENT = '#047857'; // emerald-700
const ACCENT_LIGHT = '#d1fae5'; // emerald-100
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
  offerteTitle: {
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

  // Client
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

  // Validity notice
  validityNotice: {
    backgroundColor: ACCENT_LIGHT,
    padding: 12,
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 15,
  },
  validityText: {
    fontSize: 9,
    color: ACCENT,
    fontFamily: 'Helvetica-Bold',
  },

  // Notes
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

  // Signature / acceptance area
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  signatureTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  signatureGrid: {
    flexDirection: 'row',
    gap: 30,
  },
  signatureBox: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
    height: 30,
    marginBottom: 8,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 15,
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
});

// ============================================
// STATUS LABELS
// ============================================

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  geaccepteerd: 'Geaccepteerd',
  afgewezen: 'Afgewezen',
  verlopen: 'Verlopen',
};

// ============================================
// COMPONENT
// ============================================

interface OffertePDFTemplateProps {
  offerte: OfferteForPDF;
}

export function OffertePDFTemplate({ offerte }: OffertePDFTemplateProps) {
  const calc = calculateInvoice(offerte.items);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{offerte.company.name || 'Bedrijfsnaam'}</Text>
            {offerte.company.address && (
              <Text style={styles.companyDetail}>{offerte.company.address}</Text>
            )}
            {offerte.company.email && (
              <Text style={styles.companyDetail}>{offerte.company.email}</Text>
            )}
            {offerte.company.phone && (
              <Text style={styles.companyDetail}>{offerte.company.phone}</Text>
            )}
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.offerteTitle}>OFFERTE</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Offertenummer:</Text>
              <Text style={styles.metaValue}>{offerte.offerteNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Datum:</Text>
              <Text style={styles.metaValue}>{fmtDate(offerte.date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Geldig tot:</Text>
              <Text style={styles.metaValue}>{fmtDate(offerte.validUntil)}</Text>
            </View>
          </View>
        </View>

        {/* Status badge */}
        {offerte.status && offerte.status !== 'concept' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {statusLabels[offerte.status] || offerte.status}
            </Text>
          </View>
        )}

        {/* Client */}
        <View style={styles.clientSection}>
          <View style={styles.clientBox}>
            <Text style={styles.clientLabel}>Aan</Text>
            <Text style={styles.clientName}>{offerte.client.name}</Text>
            {offerte.client.address && (
              <Text style={styles.clientDetail}>{offerte.client.address}</Text>
            )}
            {offerte.client.email && (
              <Text style={styles.clientDetail}>{offerte.client.email}</Text>
            )}
            {offerte.client.kvk && (
              <Text style={styles.clientDetail}>KvK: {offerte.client.kvk}</Text>
            )}
            {offerte.client.btwNumber && (
              <Text style={styles.clientDetail}>BTW: {offerte.client.btwNumber}</Text>
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
          {offerte.items.map((item, index) => (
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

        {/* Validity notice */}
        <View style={styles.validityNotice}>
          <Text style={styles.validityText}>
            Deze offerte is geldig tot {fmtDate(offerte.validUntil)}.
            Na deze datum kunnen wij niet garanderen dat de genoemde prijzen nog van toepassing zijn.
          </Text>
        </View>

        {/* Notes */}
        {offerte.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Opmerkingen</Text>
            <Text style={styles.notesText}>{offerte.notes}</Text>
          </View>
        )}

        {/* Signature / Acceptance area */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>Akkoordverklaring</Text>
          <Text style={{ fontSize: 8, color: GRAY, marginBottom: 15 }}>
            Ondergetekende verklaart akkoord te gaan met de bovenstaande offerte.
          </Text>
          <View style={styles.signatureGrid}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Naam:</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Datum:</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Handtekening:</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerGrid}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>KvK-nummer</Text>
              <Text style={styles.footerValue}>{offerte.company.kvk || '-'}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>BTW-nummer</Text>
              <Text style={styles.footerValue}>{offerte.company.btwNumber || '-'}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>IBAN</Text>
              <Text style={styles.footerValue}>{offerte.company.iban || '-'}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
