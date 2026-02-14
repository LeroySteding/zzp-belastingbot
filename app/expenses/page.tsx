'use client'

import { useState } from 'react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Receipt, FileText, Download } from 'lucide-react'
import { mockExpenses } from '@/lib/mock-data'
import { EXPENSE_CATEGORIES } from '@/lib/types'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'

export default function ExpensesPage() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter.toString())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  let filteredExpenses = mockExpenses.filter(
    (expense) =>
      expense.year === parseInt(selectedYear) &&
      expense.quarter === parseInt(selectedQuarter)
  )

  // Apply category filter
  if (selectedCategory !== 'all') {
    filteredExpenses = filteredExpenses.filter(
      (expense) => expense.category === selectedCategory
    )
  }

  const totalBTW = filteredExpenses.reduce((sum, e) => sum + e.btw_amount, 0)
  const totalExcl = filteredExpenses.reduce((sum, e) => sum + e.amount_excl, 0)
  const totalIncl = filteredExpenses.reduce((sum, e) => sum + e.amount_incl, 0)

  const handleDelete = (id: string) => {
    // In a real app, this would delete from Supabase
    if (confirm('Weet je zeker dat je deze uitgave wilt verwijderen?')) {
      alert(`Verwijderen van uitgave ${id}`)
    }
  }

  const handleExportCSV = () => {
    const url = `/api/expenses/export?year=${selectedYear}&quarter=${selectedQuarter}`
    window.location.href = url
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Uitgaven</h1>
            <p className="text-gray-600 mt-2">
              Beheer je zakelijke uitgaven en onkosten
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={filteredExpenses.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exporteer CSV
            </Button>
            <Link href="/expenses/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe uitgave
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jaar
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(currentYear - 1).toString()}>
                  {currentYear - 1}
                </SelectItem>
                <SelectItem value={currentYear.toString()}>
                  {currentYear}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kwartaal
            </label>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Q1 (jan-mrt)</SelectItem>
                <SelectItem value="2">Q2 (apr-jun)</SelectItem>
                <SelectItem value="3">Q3 (jul-sep)</SelectItem>
                <SelectItem value="4">Q4 (okt-dec)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorie
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* BTW Summary */}
        {filteredExpenses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900">BTW te betalen</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                € {totalBTW.toFixed(2)}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Dit kwartaal
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700">Totaal excl. BTW</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                € {totalExcl.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700">Totaal incl. BTW</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                € {totalIncl.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Bon</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Excl. BTW</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead className="text-right">Totaal</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Geen uitgaven gevonden voor deze selectie
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.receipt_path ? (
                          <button
                            onClick={() => setViewingReceipt(expense.receipt_path)}
                            className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                            title="Bekijk bon"
                          >
                            {expense.receipt_path.endsWith('.pdf') ? (
                              <FileText className="h-5 w-5 text-gray-600" />
                            ) : (
                              <Receipt className="h-5 w-5 text-gray-600" />
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded border border-gray-200">
                            <span className="text-xs text-gray-400">-</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(expense.date), 'd MMM yyyy', { locale: nl })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        € {expense.amount_excl.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="text-sm">
                          {expense.btw_rate}%
                        </div>
                        <div className="text-xs text-gray-500">
                          € {expense.btw_amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        € {expense.amount_incl.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/expenses/${expense.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Bewerken">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            title="Verwijderen"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {filteredExpenses.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {filteredExpenses.length} uitgave{filteredExpenses.length !== 1 ? 'n' : ''}
              </span>
              <span className="text-lg font-bold text-gray-900">
                Totaal: € {totalIncl.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bon weergeven</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingReceipt?.endsWith('.pdf') ? (
              <div className="bg-gray-100 p-8 rounded text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">PDF weergave</p>
                <a
                  href={viewingReceipt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Download PDF
                </a>
              </div>
            ) : viewingReceipt ? (
              <img
                src={viewingReceipt}
                alt="Receipt"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  )
}
