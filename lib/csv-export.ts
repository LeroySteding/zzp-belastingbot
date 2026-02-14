/**
 * CSV Export utilities for expenses and BTW reports
 */

import { Expense, BTWReport } from './types'

/**
 * Export expenses to CSV format
 */
export function exportExpensesToCSV(expenses: Expense[]): string {
  const headers = [
    'Datum',
    'Omschrijving',
    'Categorie',
    'Bedrag excl. BTW',
    'BTW %',
    'BTW Bedrag',
    'Bedrag incl. BTW',
    'Kwartaal',
    'Jaar',
    'Herhaald',
    'Bron',
  ]
  
  const rows = expenses.map(expense => [
    expense.date,
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.category,
    expense.amount_excl.toFixed(2),
    expense.btw_rate,
    expense.btw_amount.toFixed(2),
    expense.amount_incl.toFixed(2),
    expense.quarter,
    expense.year,
    expense.is_recurring ? 'Ja' : 'Nee',
    expense.source === 'manual' ? 'Handmatig' : expense.source === 'bank_import' ? 'Bank import' : 'Herhaald',
  ])
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  return csv
}

/**
 * Export BTW report to CSV format
 */
export function exportBTWReportToCSV(report: BTWReport, expenses: Expense[]): string {
  const headers = [
    'BTW Aangifte',
    `Q${report.quarter} ${report.year}`,
  ]
  
  const summaryRows = [
    [''],
    ['Samenvatting'],
    ['Totaal excl. BTW', `€ ${report.total_excl.toFixed(2)}`],
    ['Totaal BTW', `€ ${report.total_btw.toFixed(2)}`],
    ['Totaal incl. BTW', `€ ${report.total_incl.toFixed(2)}`],
    ['Status', report.status],
    [''],
    ['Uitgaven Details'],
    ['Datum', 'Omschrijving', 'Categorie', 'Bedrag excl. BTW', 'BTW %', 'BTW Bedrag', 'Bedrag incl. BTW'],
  ]
  
  const expenseRows = expenses
    .filter(e => e.quarter === report.quarter && e.year === report.year)
    .map(expense => [
      expense.date,
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.category,
      expense.amount_excl.toFixed(2),
      expense.btw_rate,
      expense.btw_amount.toFixed(2),
      expense.amount_incl.toFixed(2),
    ])
  
  // Calculate totals by BTW rate
  const btwBreakdown = expenses
    .filter(e => e.quarter === report.quarter && e.year === report.year)
    .reduce((acc, expense) => {
      const rate = expense.btw_rate
      if (!acc[rate]) {
        acc[rate] = { excl: 0, btw: 0, incl: 0, count: 0 }
      }
      acc[rate].excl += expense.amount_excl
      acc[rate].btw += expense.btw_amount
      acc[rate].incl += expense.amount_incl
      acc[rate].count += 1
      return acc
    }, {} as Record<number, { excl: number; btw: number; incl: number; count: number }>)
  
  const breakdownRows = [
    [''],
    ['BTW Overzicht per tarief'],
    ['BTW Tarief', 'Aantal', 'Bedrag excl. BTW', 'BTW Bedrag', 'Bedrag incl. BTW'],
    ...Object.entries(btwBreakdown).map(([rate, data]) => [
      `${rate}%`,
      data.count.toString(),
      data.excl.toFixed(2),
      data.btw.toFixed(2),
      data.incl.toFixed(2),
    ]),
  ]
  
  const allRows = [
    headers,
    ...summaryRows,
    ...expenseRows,
    ...breakdownRows,
  ]
  
  const csv = allRows.map(row => row.join(',')).join('\n')
  return csv
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
