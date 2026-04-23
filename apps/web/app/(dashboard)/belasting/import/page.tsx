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
  RefreshCw,
  Unplug,
  Info,
  Zap,
} from 'lucide-react'
import { BankTransaction } from '@/lib/belasting/types'
import { EXPENSE_CATEGORIES, BTW_RATES } from '@/lib/types/index'
import { parseBankStatement, type BankName } from '@/lib/belasting/bank-parser'
import { importBankTransactions, getBankImports } from '@/lib/belasting/actions'
import { getBankConnections, revokeBankConnection } from '@/lib/integrations/psd2/actions'
import { PSD2_BANKS } from '@/lib/integrations/psd2'
import type { BankConnection, PSD2Bank } from '@/lib/integrations/psd2/types'
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

  // PSD2 bank connections state
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [connectingBank, setConnectingBank] = useState<PSD2Bank | null>(null)
  const [syncingBank, setSyncingBank] = useState<PSD2Bank | null>(null)
  const [revokingBank, setRevokingBank] = useState<PSD2Bank | null>(null)
  const [psd2Message, setPsd2Message] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const loadBankConnections = useCallback(async () => {
    setLoadingConnections(true)
    try {
      const connections = await getBankConnections()
      setBankConnections(connections)
    } catch {
      // Silently handle - connections are non-critical for page load
    } finally {
      setLoadingConnections(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
    loadBankConnections()
  }, [loadHistory, loadBankConnections])

  // Check URL params for PSD2 callback results
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const psd2Success = params.get('psd2_success')
    const psd2Error = params.get('psd2_error')

    if (psd2Success) {
      setPsd2Message({ type: 'success', text: `${psd2Success} is succesvol gekoppeld!` })
      loadBankConnections()
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('psd2_success')
      url.searchParams.delete('tab')
      window.history.replaceState({}, '', url.pathname)
    } else if (psd2Error) {
      setPsd2Message({ type: 'error', text: psd2Error })
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('psd2_error')
      url.searchParams.delete('tab')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [loadBankConnections])

  // PSD2: Start OAuth flow for a bank
  const handleConnectBank = async (bank: PSD2Bank) => {
    setConnectingBank(bank)
    setPsd2Message(null)
    try {
      // Build OAuth2 state parameter (base64url-encoded JSON)
      // In production, you would also include a CSRF token
      const statePayload = JSON.stringify({ user_id: 'current', bank })
      const state = btoa(statePayload)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      // Call PSD2 client to get auth URL
      // For now, redirect to the API endpoint that builds the auth URL
      const redirectUri = `${window.location.origin}/api/integrations/psd2/callback`
      const params = new URLSearchParams({
        bank,
        redirect_uri: redirectUri,
        state,
      })

      // Note: In production, the auth URL is built server-side.
      // Here we redirect to the bank's OAuth2 page via a server endpoint.
      window.location.href = `/api/integrations/psd2/connect?${params.toString()}`
    } catch {
      setPsd2Message({ type: 'error', text: `Verbinden met ${bank} mislukt` })
    } finally {
      setConnectingBank(null)
    }
  }

  // PSD2: Sync transactions from a connected bank
  const handleSyncBank = async (bank: PSD2Bank) => {
    setSyncingBank(bank)
    setPsd2Message(null)
    try {
      const response = await fetch('/api/integrations/psd2/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank }),
      })

      const result = await response.json()

      if (!response.ok) {
        setPsd2Message({ type: 'error', text: result.error || 'Synchronisatie mislukt' })
        return
      }

      setPsd2Message({
        type: 'success',
        text: `${result.transactions_imported} transactie(s) geimporteerd van ${bank}`,
      })
      loadBankConnections()
      loadHistory()
    } catch {
      setPsd2Message({ type: 'error', text: 'Synchronisatie mislukt door een netwerkfout' })
    } finally {
      setSyncingBank(null)
    }
  }

  // PSD2: Revoke a bank connection
  const handleRevokeBank = async (bank: PSD2Bank) => {
    if (!confirm(`Weet je zeker dat je de ${bank} koppeling wilt ontkoppelen?`)) return

    setRevokingBank(bank)
    setPsd2Message(null)
    try {
      const result = await revokeBankConnection(bank)
      if (result.success) {
        setPsd2Message({ type: 'success', text: `${bank} koppeling is ontkoppeld` })
        loadBankConnections()
      } else {
        setPsd2Message({ type: 'error', text: result.error || 'Ontkoppelen mislukt' })
      }
    } catch {
      setPsd2Message({ type: 'error', text: 'Ontkoppelen mislukt' })
    } finally {
      setRevokingBank(null)
    }
  }

  // Helper: get connection for a bank
  const getConnection = (bank: PSD2Bank): BankConnection | undefined => {
    return bankConnections.find((c) => c.bank === bank)
  }

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
        <h1 className="text-3xl font-bold text-foreground">Bankafschrift Importeren</h1>
        <p className="text-muted-foreground mt-2">
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
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
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
                  <p className="text-sm text-muted-foreground">
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
                        tx.selected ? 'opacity-100' : 'opacity-50 bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => handleToggleSelect(idx)}
                          className="mt-1.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">{tx.date}</p>
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
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : importHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nog geen imports uitgevoerd
                </p>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((imp) => (
                    <div key={imp.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
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
                        <p className="text-sm text-muted-foreground mt-1">
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

          {/* PSD2 info banner */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              <strong>PSD2 Open Banking</strong> - Directe bankkoppelingen vereisen een AISP-registratie
              (Account Information Service Provider) bij De Nederlandsche Bank (DNB) en eIDAS-certificaten.
              De koppelingen hieronder zijn voorbereid voor productiegebruik zodra de registratie rond is.
            </AlertDescription>
          </Alert>

          {/* PSD2 success/error messages */}
          {psd2Message && (
            <Alert
              className={
                psd2Message.type === 'success'
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }
            >
              {psd2Message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <AlertDescription
                className={
                  psd2Message.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }
              >
                {psd2Message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* ---- Bank Koppelingen (PSD2) ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Bank Koppelingen (PSD2)
              </CardTitle>
              <CardDescription>
                Koppel je bank voor automatische transactie-synchronisatie via PSD2 Open Banking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConnections ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {PSD2_BANKS.map((bankInfo) => {
                    const connection = getConnection(bankInfo.bank)
                    const isConnected = connection?.status === 'connected'
                    const isExpired = connection?.status === 'expired'
                    const isRevoked = connection?.status === 'revoked'
                    const isPending = connection?.status === 'pending'

                    return (
                      <div
                        key={bankInfo.bank}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{bankInfo.displayName}</p>
                            {/* Status badge */}
                            {isConnected && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                Verbonden
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                Verlopen
                              </Badge>
                            )}
                            {isRevoked && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Ontkoppeld
                              </Badge>
                            )}
                            {isPending && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                Bezig...
                              </Badge>
                            )}
                            {!connection && !bankInfo.available && (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-900/30">
                                Binnenkort
                              </Badge>
                            )}
                            {!connection && bankInfo.available && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Niet verbonden
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {bankInfo.description}
                          </p>
                          {/* Last sync timestamp */}
                          {connection?.last_sync_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Laatst gesynchroniseerd:{' '}
                              {new Date(connection.last_sync_at).toLocaleString('nl-NL', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          )}
                          {/* Connected accounts */}
                          {isConnected && connection?.accounts && connection.accounts.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {connection.accounts.length} rekening(en) gekoppeld
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          {/* Connect / Reconnect button */}
                          {bankInfo.available && (!connection || isExpired || isRevoked) && (
                            <Button
                              size="sm"
                              onClick={() => handleConnectBank(bankInfo.bank)}
                              disabled={connectingBank === bankInfo.bank}
                            >
                              {connectingBank === bankInfo.bank ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {isExpired ? 'Opnieuw verbinden' : 'Verbinden'}
                            </Button>
                          )}

                          {/* Sync button (only when connected) */}
                          {isConnected && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncBank(bankInfo.bank)}
                              disabled={syncingBank === bankInfo.bank}
                            >
                              {syncingBank === bankInfo.bank ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Synchroniseer
                            </Button>
                          )}

                          {/* Disconnect button (when connected or expired) */}
                          {(isConnected || isExpired || isPending) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                              onClick={() => handleRevokeBank(bankInfo.bank)}
                              disabled={revokingBank === bankInfo.bank}
                            >
                              {revokingBank === bankInfo.bank ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unplug className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Ontkoppelen
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- CSV Import Overview ---- */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Import &amp; Overige Integraties</CardTitle>
              <CardDescription>
                Overzicht van beschikbare importmogelijkheden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* CSV Import beschikbaar */}
              <div>
                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide mb-3">
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
                    apiStatus="available"
                    apiLabel="PSD2 API koppeling"
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
                    apiStatus="planned"
                    apiLabel="PSD2 API binnenkort"
                  />
                  <IntegrationRow
                    name="Revolut"
                    description="CSV export vanuit Revolut Business"
                    csvStatus="available"
                    apiStatus="available"
                    apiLabel="Business API koppeling"
                  />
                </div>
              </div>

              <hr />

              {/* Toekomstige koppelingen */}
              <div>
                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide mb-3">
                  Overige integraties (toekomstig)
                </h3>
                <div className="space-y-3">
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
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <div className="flex gap-2 ml-4 flex-shrink-0">
        {csvStatus === 'available' && (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            CSV Import
          </Badge>
        )}
        {apiStatus === 'planned' && (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-900/30">
            {apiLabel || 'API binnenkort'}
          </Badge>
        )}
        {apiStatus === 'available' && (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            API verbonden
          </Badge>
        )}
      </div>
    </div>
  )
}
