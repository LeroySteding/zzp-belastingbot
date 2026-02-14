import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { BtwReportData } from '../types/reports'
import { formatEuro, getQuarterPeriod } from '../btw-calculations'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5,
  },
  companyInfo: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  companyRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    color: '#1e293b',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
    borderBottom: '2pt solid #3b82f6',
    paddingBottom: 5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #e2e8f0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderBottom: '1pt solid #e2e8f0',
  },
  tableCell: {
    flex: 1,
  },
  tableCellCode: {
    width: 40,
  },
  tableCellDesc: {
    flex: 2,
  },
  tableCellAmount: {
    width: 100,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#dbeafe',
    fontWeight: 'bold',
    marginTop: 5,
  },
  expenseTable: {
    marginTop: 10,
    fontSize: 9,
  },
  expenseRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1pt solid #e2e8f0',
  },
  expenseDate: {
    width: 80,
  },
  expenseDesc: {
    flex: 2,
  },
  expenseCategory: {
    width: 100,
  },
  expenseAmount: {
    width: 80,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#64748b',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderLeft: '3pt solid #f59e0b',
    fontSize: 9,
  },
  categorySection: {
    marginTop: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1pt solid #e2e8f0',
  },
  highlight: {
    backgroundColor: '#dbeafe',
    fontWeight: 'bold',
  },
})

interface BtwReportPDFProps {
  data: BtwReportData
}

export const BtwReportPDF: React.FC<BtwReportPDFProps> = ({ data }) => {
  const { profile, report, rubrieken, expenses, expensesByCategory } = data
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BTW-Rapport</Text>
          <Text style={styles.subtitle}>
            {getQuarterPeriod(report.year, report.quarter)}
          </Text>
          
          {/* Company Info */}
          <View style={styles.companyInfo}>
            {profile.company_name && (
              <View style={styles.companyRow}>
                <Text style={styles.label}>Bedrijfsnaam:</Text>
                <Text style={styles.value}>{profile.company_name}</Text>
              </View>
            )}
            {profile.btw_number && (
              <View style={styles.companyRow}>
                <Text style={styles.label}>BTW-nummer:</Text>
                <Text style={styles.value}>{profile.btw_number}</Text>
              </View>
            )}
            {profile.kvk_number && (
              <View style={styles.companyRow}>
                <Text style={styles.label}>KvK-nummer:</Text>
                <Text style={styles.value}>{profile.kvk_number}</Text>
              </View>
            )}
            <View style={styles.companyRow}>
              <Text style={styles.label}>Rapportdatum:</Text>
              <Text style={styles.value}>
                {format(new Date(report.created_at), 'dd MMMM yyyy', { locale: nl })}
              </Text>
            </View>
          </View>
        </View>

        {/* BTW Rubrieken */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BTW-aangifte rubrieken</Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellCode}>Code</Text>
              <Text style={styles.tableCellDesc}>Omschrijving</Text>
              <Text style={styles.tableCellAmount}>Grondslag</Text>
              <Text style={styles.tableCellAmount}>BTW-bedrag</Text>
            </View>
            
            {rubrieken.map((rubriek, index) => (
              <View
                key={rubriek.code}
                style={
                  rubriek.code === '5g'
                    ? { ...styles.tableRow, ...styles.highlight }
                    : index % 2 === 0
                    ? styles.tableRow
                    : styles.tableRowAlt
                }
              >
                <Text style={styles.tableCellCode}>{rubriek.code}</Text>
                <Text style={styles.tableCellDesc}>{rubriek.description}</Text>
                <Text style={styles.tableCellAmount}>
                  {rubriek.baseAmount > 0 ? formatEuro(rubriek.baseAmount) : '-'}
                </Text>
                <Text style={styles.tableCellAmount}>
                  {formatEuro(rubriek.btwAmount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uitgaven per categorie</Text>
          
          <View style={styles.categorySection}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellDesc}>Categorie</Text>
              <Text style={styles.tableCellAmount}>Aantal</Text>
              <Text style={styles.tableCellAmount}>Excl. BTW</Text>
              <Text style={styles.tableCellAmount}>BTW</Text>
              <Text style={styles.tableCellAmount}>Incl. BTW</Text>
            </View>
            
            {Object.entries(expensesByCategory).map(([category, totals], index) => (
              <View
                key={category}
                style={index % 2 === 0 ? styles.categoryRow : { ...styles.categoryRow, backgroundColor: '#f8fafc' }}
              >
                <Text style={styles.tableCellDesc}>{category}</Text>
                <Text style={styles.tableCellAmount}>{totals.count}</Text>
                <Text style={styles.tableCellAmount}>{formatEuro(totals.totalExcl)}</Text>
                <Text style={styles.tableCellAmount}>{formatEuro(totals.totalBtw)}</Text>
                <Text style={styles.tableCellAmount}>{formatEuro(totals.totalIncl)}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={styles.tableCellDesc}>TOTAAL</Text>
              <Text style={styles.tableCellAmount}>
                {Object.values(expensesByCategory).reduce((sum, t) => sum + t.count, 0)}
              </Text>
              <Text style={styles.tableCellAmount}>{formatEuro(Number(report.total_excl))}</Text>
              <Text style={styles.tableCellAmount}>{formatEuro(Number(report.total_btw))}</Text>
              <Text style={styles.tableCellAmount}>{formatEuro(Number(report.total_incl))}</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Let op:</Text>
          <Text>
            Dit rapport is automatisch gegenereerd en dient ter ondersteuning van uw BTW-aangifte.
            Controleer altijd de gegevens voordat u deze indient bij de Belastingdienst.
            Dit systeem registreert alleen uitgaven. Voeg uw omzet en verschuldigde BTW apart toe
            in uw officiële aangifte.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Gegenereerd op {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: nl })} • 
            ZZP Tax App • Pagina 1 van 2
          </Text>
        </View>
      </Page>

      {/* Page 2: Detailed Expense List */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Gedetailleerde uitgavenlijst</Text>
          <Text style={styles.subtitle}>
            {getQuarterPeriod(report.year, report.quarter)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alle uitgaven ({expenses.length})</Text>
          
          <View style={styles.expenseTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.expenseDate}>Datum</Text>
              <Text style={styles.expenseDesc}>Omschrijving</Text>
              <Text style={styles.expenseCategory}>Categorie</Text>
              <Text style={styles.expenseAmount}>BTW%</Text>
              <Text style={styles.expenseAmount}>Excl. BTW</Text>
              <Text style={styles.expenseAmount}>BTW</Text>
              <Text style={styles.expenseAmount}>Incl. BTW</Text>
            </View>
            
            {expenses
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((expense, index) => (
                <View
                  key={expense.id}
                  style={index % 2 === 0 ? styles.expenseRow : { ...styles.expenseRow, backgroundColor: '#f8fafc' }}
                >
                  <Text style={styles.expenseDate}>
                    {format(new Date(expense.date), 'dd-MM-yyyy')}
                  </Text>
                  <Text style={styles.expenseDesc}>{expense.description}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseAmount}>{expense.btw_rate}%</Text>
                  <Text style={styles.expenseAmount}>{formatEuro(Number(expense.amount_excl))}</Text>
                  <Text style={styles.expenseAmount}>{formatEuro(Number(expense.btw_amount))}</Text>
                  <Text style={styles.expenseAmount}>{formatEuro(Number(expense.amount_incl))}</Text>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Gegenereerd op {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: nl })} • 
            ZZP Tax App • Pagina 2 van 2
          </Text>
        </View>
      </Page>
    </Document>
  )
}
