'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { BankTransaction } from '@/lib/types/index'
import { EXPENSE_CATEGORIES, BTW_RATES } from '@/lib/types/index'
import { useRouter } from 'next/navigation'

export default function BankImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [importId, setImportId] = useState<string | null>(null)
  const [bankName, setBankName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/bank', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload mislukt')
      }

      setImportId(data.importId)
      setBankName(data.bankName)
      setTransactions(data.transactions)
      setWarnings(data.warnings || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionChange = (index: number, field: keyof BankTransaction, value: string | number) => {
    const updated = [...transactions]
    updated[index] = { ...updated[index], [field]: value }
    setTransactions(updated)
  }

  const handleConfirm = async () => {
    if (!importId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/import/bank/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          transactions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Importeren mislukt')
      }

      router.push('/expenses?imported=true')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (<>
    
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bankafschrift Importeren</h1>
          <p className="text-gray-600 mt-2">
            Upload een CSV-bestand van ING, Rabobank of ABN AMRO
          </p>
        </div>

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
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">
                  Ondersteund: ING, Rabobank, ABN AMRO formaten
                </p>
              </div>

              {file && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
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
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploaden...
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
          <>
            <Card>
              <CardHeader>
                <CardTitle>Transacties controleren</CardTitle>
                <CardDescription>
                  Bank: {bankName} • {transactions.length} transacties gevonden
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

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-600">{tx.date}</p>
                        </div>
                        <p className="text-lg font-bold">€ {tx.amount.toFixed(2)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`category-${idx}`}>Categorie</Label>
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
                          <Label htmlFor={`btw-${idx}`}>BTW %</Label>
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
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTransactions([])
                      setImportId(null)
                      setFile(null)
                    }}
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importeren...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Bevestig en importeer {transactions.length} transacties
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    
  </>
  )
}