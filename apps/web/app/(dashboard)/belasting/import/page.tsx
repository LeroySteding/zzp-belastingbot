'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Link2,
  Clock,
} from 'lucide-react'
import { BankTransaction } from '@/lib/belasting/types'
import { EXPENSE_CATEGORIES, BTW_RATES } from '@/lib/types/index'
import { parseBankStatement, type BankName } from '@/lib/belasting/bank-parser'
import { importBankTransactions, getBankImports } from '@/lib/belasting/actions'
import type { BankImport } from '@/lib/types/index'

interface SelectableBankTransaction extends BankTransaction {
  selected: boolean
}

export default function BankImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [transactions, setTransactions] = useState<SelectableBankTransaction[]>([])
  const [bankName, setBankName] = useState<BankName | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [importResult, setImportResult] = useState<{ success: boolean; imported?: number } | null>(null)
  const [importHistory, setImportHistory] = useState<BankImport[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const history = await getBankImports()
      setImportHistory(history)
    } catch {
      // Silently handle - history is non-critical
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setImportResult(null)
    }
  }

  const handleParse = async () => {
    if (!file) return

    setParsing(true)
    setError(null)
    setWarnings([])

    try {
      const text = await file.text()
      const result = parseBankStatement(text)

      if (result.transactions.length === 0) {
        setError('Geen uitgaven gevonden in het bestand. Alleen uitgaande transacties worden geimporteerd.')
        return
      }

      setBankName(result.bankName)
      setTransactions(
        result.transactions.map((tx) => ({ ...tx, selected: true }))
      )
      setWarnings(result.errors)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het lezen van het bestand')
    } finally {
      setParsing(false)
    }
  }

  const handleTransactionChange = (index: number, field: keyof BankTransaction, value: string | number) => {
    setTransactions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleToggleSelect = (index: number) => {
    setTransactions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selected: !updated[index].selected }
      return updated
    })
  }

  const handleSelectAll = () => {
    setTransactions((prev) => prev.map((tx) => ({ ...tx, selected: true })))
  }

  const handleDeselectAll = () => {
    setTransactions((prev) => prev.map((tx) => ({ ...tx, selected: false })))
  }

  const selectedCount = transactions.filter((tx) => tx.selected).length
  const selectedTotal = transactions
    .filter((tx) => tx.selected)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const handleImport = async () => {
    const selected = transactions.filter((tx) => tx.selected)
    if (!selected.length || !bankName || !file) return

    setImporting(true)
    setError(null)

    try {
      const result = await importBankTransactions(
        selected.map(({ selected: _, ...tx }) => tx),
        bankName,
        file.name
      )

      if (result.success) {
        setImportResult({ success: true, imported: result.imported })
        setTransactions([])
        loadHistory()
      } else {
        setError(result.error || 'Import mislukt')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setTransactions([])
    setBankName('')
    setFile(null)
    setError(null)
    setWarnings([])
    setImportResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bankafschrift Importeren</h1>
        <p className="text-gray-600 mt-2">
          Upload een CSV-bestand om transacties automatisch te importeren als uitgaven
        </p>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="mr-1.5 h-4 w-4" />
            Importeren
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-1.5 h-4 w-4" />
            Geschiedenis
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link2 className="mr-1.5 h-4 w-4" />
            Koppelingen
          </TabsTrigger>
        </TabsList>

        {/* ==================== IMPORT TAB ==================== */}
        <TabsContent value="import" className="space-y-6">

          {/* Success message after import */}
          {importResult?.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {importResult.imported} transactie(s) succesvol geimporteerd als uitgaven.
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Section */}
          {!transactions.length && (
            <Card>
              <CardHeader>
                <CardTitle>Bestand uploaden</CardTitle>
                <CardDescription>
                  Selecteer een CSV-bestand van je bank om transacties te importeren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Bankafschrift (CSV)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={parsing}
                  />
                  <p className="text-sm text-gray-500">
                    Ondersteund: ING, Rabobank, ABN AMRO, Knab, Revolut
                  </p>
                </div>

                {file && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Bestand geselecteerd: {file.name} ({Math.round(file.size / 1024)} KB)
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleParse}
                  disabled={!file || parsing}
                  className="w-full"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload en analyseer
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transacties controleren</CardTitle>
                <CardDescription>
                  Bank: <Badge variant="secondary">{bankName}</Badge>
                  {' '}{transactions.length} transacties gevonden
                  {' '}&middot;{' '}
                  {selectedCount} geselecteerd
                  {' '}&middot;{' '}
                  Totaal: &euro; {selectedTotal.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {warnings.length > 0 && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Waarschuwingen:</div>
                      <ul className="text-sm list-disc list-inside">
                        {warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Select/Deselect all */}
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Alles selecteren
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Niets selecteren
                  </Button>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 space-y-3 transition-opacity ${
                        tx.selected ? 'opacity-100' : 'opacity-50 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => handleToggleSelect(idx)}
                          className="mt-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{tx.description}</p>
                              <p className="text-sm text-gray-600">{tx.date}</p>
                            </div>
                            <p className="text-lg font-bold whitespace-nowrap ml-4">&euro; {tx.amount.toFixed(2)}</p>
                          </div>

                          {tx.selected && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                <Label htmlFor={`category-${idx}`} className="text-xs">Categorie</Label>
                                <Select
                                  value={tx.category}
                                  onValueChange={(value) => handleTransactionChange(idx, 'category', value)}
                                >
                                  <SelectTrigger id={`category-${idx}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor={`btw-${idx}`} className="text-xs">BTW %</Label>
                                <Select
                                  value={String(tx.btw_rate)}
                                  onValueChange={(value) => handleTransactionChange(idx, 'btw_rate', parseInt(value))}
                                >
                                  <SelectTrigger id={`btw-${idx}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BTW_RATES.map((rate) => (
                                      <SelectItem key={rate} value={String(rate)}>
                                        {rate}%
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || selectedCount === 0}
                    className="flex-1"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importeren...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Importeer {selectedCount} transactie(s) (&euro; {selectedTotal.toFixed(2)})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== HISTORY TAB ==================== */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Geschiedenis</CardTitle>
              <CardDescription>
                Overzicht van alle eerdere bankimports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : importHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nog geen imports uitgevoerd
                </p>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((imp) => (
                    <div key={imp.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{imp.filename}</span>
                          <Badge variant="secondary">{imp.bank_name}</Badge>
                          <Badge
                            variant={
                              imp.status === 'completed'
                                ? 'default'
                                : imp.status === 'failed'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {imp.status === 'completed' ? 'Voltooid' : imp.status === 'failed' ? 'Mislukt' : 'Bezig'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {imp.import_date} &middot; {imp.transactions_imported} van {imp.total_transactions} transacties geimporteerd
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== INTEGRATIONS TAB ==================== */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bankkoppelingen &amp; Integraties</CardTitle>
              <CardDescription>
                Overzicht van beschikbare importmogelijkheden en toekomstige koppelingen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* CSV Import beschikbaar */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
                  CSV Import beschikbaar
                </h3>
                <div className="space-y-3">
                  <IntegrationRow
                    name="ING"
                    description="CSV export vanuit Mijn ING"
                    csvStatus="available"
                    apiStatus="none"
                  />
                  <IntegrationRow
                    name="Rabobank"
                    description="CSV export vanuit Rabo Internetbankieren"
                    csvStatus="available"
                    apiStatus="planned"
                    apiLabel="PSD2 API koppeling binnenkort"
                  />
                  <IntegrationRow
                    name="ABN AMRO"
                    description="CSV/TSV export vanuit Internetbankieren"
                    csvStatus="available"
                    apiStatus="none"
                  />
                  <IntegrationRow
                    name="Knab"
                    description="CSV export vanuit Knab Online"
                    csvStatus="available"
                    apiStatus="none"
                  />
                  <IntegrationRow
                    name="Revolut"
                    description="CSV export vanuit Revolut Business"
                    csvStatus="available"
                    apiStatus="planned"
                    apiLabel="API koppeling binnenkort"
                  />
                </div>
              </div>

              <hr />

              {/* Toekomstige koppelingen */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
                  Direct koppelingen (toekomstig)
                </h3>
                <div className="space-y-3">
                  <IntegrationRow
                    name="Rabobank PSD2"
                    description="Automatisch transacties ophalen via PSD2 Open Banking API"
                    csvStatus="none"
                    apiStatus="planned"
                    apiLabel="API koppeling binnenkort"
                  />
                  <IntegrationRow
                    name="Revolut Business API"
                    description="Automatisch transacties synchroniseren vanuit Revolut"
                    csvStatus="none"
                    apiStatus="planned"
                    apiLabel="API koppeling binnenkort"
                  />
                  <IntegrationRow
                    name="Mollie"
                    description="Inkomende betalingen matchen met facturen voor automatische aflettering"
                    csvStatus="none"
                    apiStatus="planned"
                    apiLabel="Payment provider koppeling binnenkort"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --------------------------------------------------
// Integration row sub-component
// --------------------------------------------------

function IntegrationRow({
  name,
  description,
  csvStatus,
  apiStatus,
  apiLabel,
}: {
  name: string
  description: string
  csvStatus: 'available' | 'none'
  apiStatus: 'available' | 'planned' | 'none'
  apiLabel?: string
}) {
  return (
    <div className="flex items-center justify-between border rounded-lg p-3">
      <div className="min-w-0">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <div className="flex gap-2 ml-4 flex-shrink-0">
        {csvStatus === 'available' && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            CSV Import
          </Badge>
        )}
        {apiStatus === 'planned' && (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
            {apiLabel || 'API binnenkort'}
          </Badge>
        )}
        {apiStatus === 'available' && (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            API verbonden
          </Badge>
        )}
      </div>
    </div>
  )
}
