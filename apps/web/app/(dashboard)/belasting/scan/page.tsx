'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createWorker } from 'tesseract.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Camera,
  Upload,
  X,
  ScanLine,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
} from 'lucide-react'
import { createExpense } from '@/lib/belasting/actions'
import { EXPENSE_CATEGORIES } from '@/lib/types/index'

// -------------------------------------------------------------------
// Dutch receipt text extraction helpers
// -------------------------------------------------------------------

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:te\s+betalen|totaal|total|totale?)\s*:?\s*(?:€|EUR)?\s*(\d+[.,]\d{2})/i,
    /(?:€|EUR|euro)\s*(\d+[.,]\d{2})/i,
    /bedrag\s*:?\s*(?:€|EUR)?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*(?:€|EUR)/i,
  ]

  // Collect all candidates matching "total"-style lines first
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(amount) && amount > 0) {
        return amount
      }
    }
  }

  return null
}

function extractDate(text: string): string | null {
  // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const ddmmyyyy = text.match(/(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})/)
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1])
    const month = parseInt(ddmmyyyy[2])
    const year = parseInt(ddmmyyyy[3])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  // YYYY-MM-DD
  const yyyymmdd = text.match(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/)
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1])
    const month = parseInt(yyyymmdd[2])
    const day = parseInt(yyyymmdd[3])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  return null
}

function extractBTWRate(text: string): '0' | '9' | '21' {
  const lower = text.toLowerCase()
  if (/btw\s*21\s*%|21\s*%\s*btw|vat\s*21/i.test(lower)) return '21'
  if (/btw\s*9\s*%|9\s*%\s*btw|vat\s*9/i.test(lower)) return '9'
  if (/btw\s*0\s*%|0\s*%\s*btw|vrijgesteld|geen\s*btw/i.test(lower)) return '0'
  return '21' // Default NL rate
}

function suggestCategory(text: string): string {
  const lower = text.toLowerCase()
  const map: Record<string, string[]> = {
    'Kantoor': ['staples', 'officecentre', 'bureau', 'kantoor', 'office', 'printer', 'papier'],
    'Reizen': ['ns', 'trein', 'train', 'uber', 'taxi', 'hotel', 'booking', 'vliegtuig', 'flight', 'ov-chipkaart', 'benzine', 'parkeren'],
    'Software': ['adobe', 'microsoft', 'google', 'aws', 'software', 'saas', 'subscription', 'licentie', 'github', 'figma'],
    'Telefoon/Internet': ['vodafone', 'kpn', 't-mobile', 'ziggo', 'telecom', 'internet', 'mobiel', 'simyo', 'tele2'],
    'Verzekeringen': ['verzekering', 'insurance', 'aon', 'allianz', 'polis'],
  }

  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'Overig'
}

function extractVendor(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2)

  for (const line of lines.slice(0, 5)) {
    if (
      !/\d{4}|\d{1,2}[-.\/]\d{1,2}|€|\d+[.,]\d{2}|straat|laan|weg|postbus/i.test(line) &&
      line.length < 50
    ) {
      return line
    }
  }

  return ''
}

// -------------------------------------------------------------------
// Page component
// -------------------------------------------------------------------

export default function ScanPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // OCR state
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanComplete, setScanComplete] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string | null>(null)

  // Form state (pre-filled from OCR)
  const [description, setDescription] = useState('')
  const [amountExcl, setAmountExcl] = useState('')
  const [btwRate, setBtwRate] = useState<'0' | '9' | '21'>('21')
  const [category, setCategory] = useState('Overig')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Save state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Computed BTW amounts
  const numericAmount = parseFloat(amountExcl) || 0
  const btwAmount = numericAmount * (parseInt(btwRate) / 100)
  const totalIncl = numericAmount + btwAmount

  // -------------------------------------------------------------------
  // File handling
  // -------------------------------------------------------------------

  const handleFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setScanError('Alleen JPG, PNG of WebP afbeeldingen zijn toegestaan.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setScanError('Afbeelding mag maximaal 10MB zijn.')
      return
    }

    setScanError(null)
    setScanComplete(false)
    setRawText(null)
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClear = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    setScanComplete(false)
    setScanError(null)
    setRawText(null)
    setScanProgress(0)
    setDescription('')
    setAmountExcl('')
    setBtwRate('21')
    setCategory('Overig')
    setDate(new Date().toISOString().split('T')[0])
    setSaved(false)
  }, [])

  // -------------------------------------------------------------------
  // OCR scanning
  // -------------------------------------------------------------------

  const handleScan = useCallback(async () => {
    if (!imageFile) return

    setScanning(true)
    setScanError(null)
    setScanComplete(false)
    setScanProgress(0)

    try {
      const worker = await createWorker('nld+eng', undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round((m.progress ?? 0) * 100))
          }
        },
      })

      const { data } = await worker.recognize(imageFile)
      await worker.terminate()

      const text = data.text

      if (!text || text.trim().length < 5) {
        setScanError('Geen tekst gevonden op de afbeelding. Probeer een duidelijkere foto.')
        setScanning(false)
        return
      }

      setRawText(text)

      // Extract data and pre-fill form
      const amount = extractAmount(text)
      const extractedDate = extractDate(text)
      const detectedBtw = extractBTWRate(text)
      const suggestedCategory = suggestCategory(text)
      const vendor = extractVendor(text)

      if (amount !== null) {
        // Amount from receipt is typically incl. BTW
        // Calculate excl. based on detected BTW rate
        const rate = parseInt(detectedBtw)
        const exclAmount = amount / (1 + rate / 100)
        setAmountExcl(exclAmount.toFixed(2))
      }

      if (extractedDate) {
        setDate(extractedDate)
      }

      setBtwRate(detectedBtw)
      setCategory(suggestedCategory)
      setDescription(vendor || '')

      setScanComplete(true)
    } catch (err) {
      console.error('OCR Error:', err)
      setScanError(
        err instanceof Error
          ? `Scanfout: ${err.message}`
          : 'Er is een fout opgetreden bij het scannen. Probeer het opnieuw.'
      )
    } finally {
      setScanning(false)
    }
  }, [imageFile])

  // -------------------------------------------------------------------
  // Save expense
  // -------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!description.trim()) {
      setScanError('Vul een omschrijving in.')
      return
    }
    if (!amountExcl || numericAmount <= 0) {
      setScanError('Vul een geldig bedrag in.')
      return
    }
    if (!date) {
      setScanError('Selecteer een datum.')
      return
    }

    setSaving(true)
    setScanError(null)

    try {
      const result = await createExpense({
        description: description.trim(),
        amount_excl: numericAmount,
        btw_rate: parseInt(btwRate),
        category,
        date,
      })

      if (result) {
        setSaved(true)
      } else {
        setScanError('Kon de uitgave niet opslaan. Ben je ingelogd?')
      }
    } catch (err) {
      console.error('Save error:', err)
      setScanError('Er is een fout opgetreden bij het opslaan.')
    } finally {
      setSaving(false)
    }
  }, [description, amountExcl, numericAmount, btwRate, category, date])

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  if (saved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bon Scanner</h1>
          <p className="text-gray-600 mt-2">
            Scan een bon en sla de uitgave automatisch op
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Uitgave opgeslagen!</h2>
            <p className="text-gray-600 mb-8">
              De uitgave is succesvol toegevoegd aan je administratie.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClear}>
                <ScanLine className="mr-2 h-4 w-4" />
                Nieuwe bon scannen
              </Button>
              <Button onClick={() => router.push('/belasting/expenses')}>
                Bekijk uitgaven
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bon Scanner</h1>
        <p className="text-gray-600 mt-2">
          Scan een bon en sla de uitgave automatisch op
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Upload & Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Bon uploaden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imagePreview ? (
                <>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFile(file)
                      }}
                    />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700">
                      {isDragging
                        ? 'Laat de bon hier los...'
                        : 'Sleep een bon hierheen of klik om te uploaden'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG of WebP (max 10MB)</p>
                  </div>

                  <div className="text-center text-sm text-gray-500">of</div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Maak een foto
                  </Button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(file)
                    }}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
                      onClick={handleClear}
                      disabled={scanning}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <img
                      src={imagePreview}
                      alt="Bon preview"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleScan}
                    disabled={scanning || scanComplete}
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scannen... {scanProgress}%
                      </>
                    ) : scanComplete ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Scan voltooid
                      </>
                    ) : (
                      <>
                        <ScanLine className="mr-2 h-5 w-5" />
                        Scannen
                      </>
                    )}
                  </Button>

                  {scanning && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw OCR text (collapsible) */}
          {rawText && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Herkende tekst
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono">
                  {rawText}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uitgave gegevens</CardTitle>
              {scanComplete && (
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Automatisch ingevuld vanuit scan - controleer en pas aan indien nodig
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Omschrijving</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="bijv. Albert Heijn boodschappen"
                />
              </div>

              {/* Amount excl. BTW */}
              <div className="space-y-2">
                <Label htmlFor="amount">Bedrag excl. BTW</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    &euro;
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountExcl}
                    onChange={(e) => setAmountExcl(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>

              {/* BTW Rate */}
              <div className="space-y-2">
                <Label htmlFor="btw-rate">BTW-tarief</Label>
                <Select value={btwRate} onValueChange={(v) => setBtwRate(v as '0' | '9' | '21')}>
                  <SelectTrigger id="btw-rate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="21">21% (standaard)</SelectItem>
                    <SelectItem value="9">9% (verlaagd)</SelectItem>
                    <SelectItem value="0">0% (vrijgesteld)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Categorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
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

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Calculated BTW summary */}
              {numericAmount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 border">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bedrag excl. BTW:</span>
                    <span className="font-medium">&euro; {numericAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">BTW ({btwRate}%):</span>
                    <span className="font-medium">&euro; {btwAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Totaal incl. BTW:</span>
                    <span>&euro; {totalIncl.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {scanError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{scanError}</p>
                </div>
              )}

              {/* Save button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSave}
                disabled={saving || !description.trim() || numericAmount <= 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Opslaan als uitgave
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
