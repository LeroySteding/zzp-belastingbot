'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatEuro, getQuarterPeriod } from '@/lib/belasting/btw-calculations'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

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

interface CategoryTotals {
  count: number
  totalExcl: number
  totalBtw: number
  totalIncl: number
}

interface Rubriek {
  code: string
  description: string
  baseAmount: number
  btwAmount: number
}

interface ReportPreview extends BtwReport {
  rubrieken?: Rubriek[]
  expensesByCategory?: Record<string, CategoryTotals>
  expenseCount?: number
}

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter.toString())
  const [reports, setReports] = useState<BtwReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [previewReport, setPreviewReport] = useState<ReportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      setLoading(true)
      const response = await fetch('/api/belasting/reports')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij ophalen rapporten')
      }

      setReports(data.reports || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/belasting/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: parseInt(selectedYear),
          quarter: parseInt(selectedQuarter),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij genereren rapport')
      }

      // Show preview
      setPreviewReport(data.report)
      
      // Refresh reports list
      await fetchReports()
    } catch (err) {
      console.error('Error generating report:', err)
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setGenerating(false)
    }
  }

  function downloadPDF(reportId: string) {
    window.open(`/api/belasting/reports/${reportId}/pdf`, '_blank')
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'concept':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Concept
          </span>
        )
      case 'ingediend':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Ingediend
          </span>
        )
      case 'betaald':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Betaald
          </span>
        )
      default:
        return null
    }
  }

  // Group reports by year
  const reportsByYear = reports.reduce((acc, report) => {
    if (!acc[report.year]) {
      acc[report.year] = []
    }
    acc[report.year].push(report)
    return acc
  }, {} as Record<number, BtwReport[]>)

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const quarters = [1, 2, 3, 4]

  return (<>
    
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BTW-rapporten</h1>
          <p className="text-gray-600 mt-2">
            Genereer en beheer je BTW-aangifte rapporten per kwartaal
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Fout</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate New Report */}
        <Card>
          <CardHeader>
            <CardTitle>Nieuw rapport genereren</CardTitle>
            <CardDescription>
              Selecteer een jaar en kwartaal om een BTW-rapport te maken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jaar
                  </label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
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
                      {quarters.map((q) => (
                        <SelectItem key={q} value={q.toString()}>
                          Q{q} - {getQuarterPeriod(parseInt(selectedYear), q)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateReport}
                disabled={generating}
                className="w-full md:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                {generating ? 'Bezig met genereren...' : 'Genereer rapport'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Gegenereerde rapporten</CardTitle>
            <CardDescription>
              Overzicht van alle BTW-rapporten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3">Rapporten laden...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nog geen rapporten gegenereerd</p>
                <p className="text-sm mt-2">
                  Gebruik bovenstaand formulier om een BTW-rapport te maken
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(reportsByYear)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([year, yearReports]) => (
                    <div key={year}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {year}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {yearReports
                          .sort((a, b) => b.quarter - a.quarter)
                          .map((report) => (
                            <Card key={report.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      Q{report.quarter} {report.year}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {getQuarterPeriod(report.year, report.quarter)}
                                    </p>
                                  </div>
                                  {getStatusBadge(report.status)}
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Excl. BTW:</span>
                                    <span className="font-medium">
                                      {formatEuro(Number(report.total_excl))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">BTW:</span>
                                    <span className="font-medium">
                                      {formatEuro(Number(report.total_btw))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                    <span>Totaal:</span>
                                    <span>{formatEuro(Number(report.total_incl))}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Link
                                    href={`/belasting/reports/${report.id}`}
                                    className="flex-1"
                                  >
                                    <Button variant="outline" className="w-full" size="sm">
                                      <Eye className="mr-2 h-4 w-4" />
                                      Bekijken
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => downloadPDF(report.id)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                  Laatst bijgewerkt:{' '}
                                  {format(new Date(report.updated_at), 'dd MMM yyyy', {
                                    locale: nl,
                                  })}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">
                  BTW-aangifte informatie
                </h3>
                <p className="text-sm text-blue-700">
                  Als ZZP&apos;er moet je meestal elk kwartaal BTW-aangifte doen bij de
                  Belastingdienst. Dit systeem helpt je de benodigde gegevens te verzamelen.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• Registreer al je zakelijke uitgaven met BTW</li>
                  <li>• Genereer kwartaalrapporten met BTW-rubrieken</li>
                  <li>• Download PDF-overzichten voor je administratie</li>
                  <li>• Let op: voeg je omzet en omzet-BTW apart toe in je aangifte</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rapport gegenereerd: Q{previewReport?.quarter} {previewReport?.year}
            </DialogTitle>
            <DialogDescription>
              Het BTW-rapport is succesvol aangemaakt. Je kunt het nu bekijken of downloaden.
            </DialogDescription>
          </DialogHeader>

          {previewReport && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Rapport succesvol gegenereerd</span>
                </div>
                <p className="text-sm text-green-700">
                  Gevonden: {previewReport.expenseCount || 0} uitgaven
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Samenvatting</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Periode:</span>
                    <span className="font-medium">
                      {getQuarterPeriod(previewReport.year, previewReport.quarter)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Totaal excl. BTW:</span>
                    <span className="font-medium">
                      {formatEuro(Number(previewReport.total_excl))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">BTW:</span>
                    <span className="font-medium">
                      {formatEuro(Number(previewReport.total_btw))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Totaal incl. BTW:</span>
                    <span>{formatEuro(Number(previewReport.total_incl))}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/belasting/reports/${previewReport.id}`}
                  className="flex-1"
                  onClick={() => setPreviewReport(null)}
                >
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Volledig rapport bekijken
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    downloadPDF(previewReport.id)
                    setPreviewReport(null)
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    
  </>
  )
}