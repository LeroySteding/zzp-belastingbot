'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice } from '@/lib/factuur/types/invoice';
import { calculateInvoice, formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
  },
  invoiceDetails: {
    fontSize: 10,
    textAlign: 'right',
  },
  detailRow: {
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  clientBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 25,
  },
  clientName: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colBtw: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerSection: {
    marginBottom: 15,
  },
  footerTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footerGrid: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  footerColumn: {
    flex: 1,
  },
  notes: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textGray: {
    color: '#666',
  },
  textSmall: {
    fontSize: 8,
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const calculation = calculateInvoice(invoice.items);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{invoice.company.name}</Text>
            <Text style={styles.textGray}>{invoice.company.address.split('\n').join(', ')}</Text>
            {invoice.company.email && <Text style={styles.textGray}>{invoice.company.email}</Text>}
            {invoice.company.phone && <Text style={styles.textGray}>{invoice.company.phone}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTUUR</Text>
            <View style={styles.invoiceDetails}>
              <View style={styles.detailRow}>
                <Text><Text style={styles.textGray}>Nummer: </Text>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text><Text style={styles.textGray}>Datum: </Text>{formatDate(invoice.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text><Text style={styles.textGray}>Vervaldatum: </Text>{formatDate(invoice.dueDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View>
          <Text style={styles.sectionTitle}>FACTUURADRES</Text>
          <View style={styles.clientBox}>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            <Text style={styles.textGray}>{invoice.client.address.split('\n').join(', ')}</Text>
            {invoice.client.email && <Text style={styles.textGray}>{invoice.client.email}</Text>}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>OMSCHRIJVING</Text>
            <Text style={styles.colQuantity}>AANTAL</Text>
            <Text style={styles.colPrice}>PRIJS</Text>
            <Text style={styles.colBtw}>BTW</Text>
            <Text style={styles.colTotal}>TOTAAL</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colBtw}>{item.btwRate}%</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.textGray}>Subtotaal</Text>
              <Text>{formatCurrency(calculation.subtotal)}</Text>
            </View>
            {calculation.btw21 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.textGray}>BTW 21%</Text>
                <Text>{formatCurrency(calculation.btw21)}</Text>
              </View>
            )}
            {calculation.btw9 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.textGray}>BTW 9%</Text>
                <Text>{formatCurrency(calculation.btw9)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text>TOTAAL</Text>
              <Text>{formatCurrency(calculation.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerSection}>
            <Text style={styles.footerTitle}>BETAALGEGEVENS</Text>
            <Text style={styles.textGray}>IBAN: {invoice.company.iban}</Text>
            <Text style={styles.textGray}>t.n.v. {invoice.company.name}</Text>
            <Text style={styles.textGray}>o.v.v. {invoice.invoiceNumber}</Text>
          </View>

          <View style={styles.footerGrid}>
            <View style={styles.footerColumn}>
              <Text style={[styles.textGray, styles.textSmall]}>KvK-nummer: {invoice.company.kvk}</Text>
              <Text style={[styles.textGray, styles.textSmall]}>BTW-nummer: {invoice.company.btwNumber}</Text>
            </View>
          </View>

          {invoice.notes && (
            <View style={styles.notes}>
              <Text style={styles.footerTitle}>OPMERKINGEN</Text>
              <Text style={styles.textGray}>{invoice.notes}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
