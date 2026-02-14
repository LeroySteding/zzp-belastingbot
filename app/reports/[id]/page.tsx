'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  ArrowLeft,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import { formatEuro, getQuarterPeriod } from '@/lib/btw-calculations'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface BtwRubriek {
  code: string
  description: string
  baseAmount: number
  btwAmount: number
}

interface Expense {
  id: string
  description: string
  amount_excl: number
  btw_rate: number
  btw_amount: number
  amount_incl: number
  category: string
  date: string
}

interface BtwReport {
  id: string
  year: number
  quarter: number
  total_excl: number
  total_btw: number
  total_incl: number
  status: 'concept' | 'ingediend' | 'betaald'
  created_at: string
  updated_at: string
}

interface Profile {
  company_name: string | null
  btw_number: string | null
  kvk_number: string | null
}

interface ReportData {
  report: BtwReport
  expenses: Expense[]
  profile: Profile | null
  rubrieken: BtwRubriek[]
  expensesByCategory: Record<
    string,
    {
      count: number
      totalExcl: number
      totalBtw: number
      totalIncl: number
    }
  >
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  async function fetchReportData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${resolvedParams.id}`)
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Fout bij ophalen rapport')
      }

      setData(responseData)
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: 'concept' | 'ingediend' | 'betaald') {
    try {
      setUpdating(true)
      const response = await fetch(`/api/reports/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Fout bij bijwerken status')
      }

      // Refresh data
      await fetchReportData()
    } catch (err) {
      console.error('Error updating status:', err)
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setUpdating(false)
    }
  }

  async function deleteReport() {
    if (!confirm('Weet je zeker dat je dit rapport wilt verwijderen?')) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/reports/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || 'Fout bij verwijderen rapport')
      }

      // Redirect to reports page
      router.push('/reports')
    } catch (err) {
      console.error('Error deleting report:', err)
      setError(err instanceof Error ? err.message : 'Onbekende fout')
      setDeleting(false)
    }
  }

  function downloadPDF() {
    window.open(`/api/reports/${resolvedParams.id}/pdf`, '_blank')
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'concept':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Concept
          </span>
        )
      case 'ingediend':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Ingediend
          </span>
        )
      case 'betaald':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Betaald
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Rapport laden...</p>
        </div>
      </ProtectedLayout>
    )
  }

  if (error || !data) {
    return (
      <ProtectedLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Fout</h3>
                <p className="text-sm text-red-700 mt-1">
                  {error || 'Rapport niet gevonden'}
                </p>
                <Link href="/reports" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug naar overzicht
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </ProtectedLayout>
    )
  }

  const { report, expenses, profile, rubrieken, expensesByCategory } = data

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug naar overzicht
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              BTW-Rapport Q{report.quarter} {report.year}
            </h1>
            <p className="text-gray-600 mt-2">
              {getQuarterPeriod(report.year, report.quarter)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="destructive"
              onClick={deleteReport}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status and Company Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
                <div className="flex items-center gap-3">
                  {getStatusBadge(report.status)}
                  <Select
                    value={report.status}
                    onValueChange={(value) => updateStatus(value as 'concept' | 'ingediend' | 'betaald')}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="ingediend">Ingediend</SelectItem>
                      <SelectItem value="betaald">Betaald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Laatst bijgewerkt:{' '}
                  {format(new Date(report.updated_at), 'dd MMMM yyyy HH:mm', {
                    locale: nl,
                  })}
                </p>
              </div>

              {profile && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Bedrijfsgegevens</h3>
                  <div className="space-y-1 text-sm">
                    {profile.company_name && (
                      <p>
                        <span className="text-gray-600">Bedrijf:</span>{' '}
                        <span className="font-medium">{profile.company_name}</span>
                      </p>
                    )}
                    {profile.btw_number && (
                      <p>
                        <span className="text-gray-600">BTW-nummer:</span>{' '}
                        <span className="font-medium">{profile.btw_number}</span>
                      </p>
                    )}
                    {profile.kvk_number && (
                      <p>
                        <span className="text-gray-600">KvK-nummer:</span>{' '}
                        <span className="font-medium">{profile.kvk_number}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BTW Rubrieken */}
        <Card>
          <CardHeader>
            <CardTitle>BTW-aangifte rubrieken</CardTitle>
            <CardDescription>
              Overzicht volgens Belastingdienst indeling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Code</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead className="text-right">Grondslag</TableHead>
                  <TableHead className="text-right">BTW-bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubrieken.map((rubriek) => (
                  <TableRow
                    key={rubriek.code}
                    className={
                      rubriek.code === '5g' ? 'bg-blue-50 font-semibold' : ''
                    }
                  >
                    <TableCell className="font-medium">{rubriek.code}</TableCell>
                    <TableCell>{rubriek.description}</TableCell>
                    <TableCell className="text-right">
                      {rubriek.baseAmount > 0
                        ? formatEuro(rubriek.baseAmount)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatEuro(rubriek.btwAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Uitgaven per categorie</CardTitle>
            <CardDescription>
              {Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.count, 0)}{' '}
              uitgaven in {Object.keys(expensesByCategory).length} categorieën
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Aantal</TableHead>
                  <TableHead className="text-right">Excl. BTW</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead className="text-right">Incl. BTW</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(expensesByCategory)
                  .sort(([, a], [, b]) => b.totalIncl - a.totalIncl)
                  .map(([category, totals]) => (
                    <TableRow key={category}>
                      <TableCell className="font-medium">{category}</TableCell>
                      <TableCell className="text-right">{totals.count}</TableCell>
                      <TableCell className="text-right">
                        {formatEuro(totals.totalExcl)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatEuro(totals.totalBtw)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatEuro(totals.totalIncl)}
                      </TableCell>
                    </TableRow>
                  ))}
                <TableRow className="bg-blue-50 font-semibold">
                  <TableCell>TOTAAL</TableCell>
                  <TableCell className="text-right">
                    {Object.values(expensesByCategory).reduce(
                      (sum, cat) => sum + cat.count,
                      0
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatEuro(Number(report.total_excl))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatEuro(Number(report.total_btw))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatEuro(Number(report.total_incl))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detailed Expense List */}
        <Card>
          <CardHeader>
            <CardTitle>Alle uitgaven ({expenses.length})</CardTitle>
            <CardDescription>Gedetailleerd overzicht van elke uitgave</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">BTW%</TableHead>
                    <TableHead className="text-right">Excl. BTW</TableHead>
                    <TableHead className="text-right">BTW</TableHead>
                    <TableHead className="text-right">Incl. BTW</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(expense.date), 'dd-MM-yyyy')}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right">
                          {expense.btw_rate}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatEuro(Number(expense.amount_excl))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatEuro(Number(expense.btw_amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatEuro(Number(expense.amount_incl))}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Let op:</p>
                <p>
                  Dit rapport toont alleen je zakelijke <strong>uitgaven</strong> met BTW. 
                  Voor je complete BTW-aangifte moet je ook je <strong>omzet</strong> en 
                  de daarover verschuldigde BTW toevoegen. Controleer altijd je gegevens 
                  voordat je de aangifte indient bij de Belastingdienst.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
