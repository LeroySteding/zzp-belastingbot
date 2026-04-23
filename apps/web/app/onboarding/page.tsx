'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Briefcase,
  Users,
  Sparkles,
  Loader2,
  SkipForward,
  LayoutDashboard,
  FileText,
  Clock,
  Receipt,
  Search,
} from 'lucide-react'
import { completeOnboarding } from '@/lib/onboarding/actions'
import { lookupKvkNumber } from '@/lib/integrations/kvk'
import { lookupAddress } from '@/lib/integrations/address'

const SERVICES = [
  'Web development',
  'App development',
  'Design',
  'UX/UI Design',
  'Consultancy',
  'Marketing',
  'SEO/SEA',
  'Copywriting',
  'Fotografie',
  'Videografie',
  'Vertalingen',
  'Boekhouding',
  'Coaching',
  'Overig',
]

const STEPS = [
  { id: 'welkom', title: 'Welkom', icon: Sparkles },
  { id: 'bedrijf', title: 'Bedrijf', icon: Building2 },
  { id: 'diensten', title: 'Diensten', icon: Briefcase },
  { id: 'klant', title: 'Klant', icon: Users },
  { id: 'klaar', title: 'Klaar!', icon: Check },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [kvkNumber, setKvkNumber] = useState('')
  const [btwNumber, setBtwNumber] = useState('')
  const [iban, setIban] = useState('')
  const [address, setAddress] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  // Address lookup state
  const [postalCode, setPostalCode] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [addressLooking, setAddressLooking] = useState(false)
  const [addressFound, setAddressFound] = useState<string | null>(null)
  const [addressLookupError, setAddressLookupError] = useState<string | null>(null)

  // KVK lookup state
  const [kvkLoading, setKvkLoading] = useState(false)
  const [kvkMessage, setKvkMessage] = useState<string | null>(null)
  const [kvkError, setKvkError] = useState<string | null>(null)

  const handleKvkLookup = async () => {
    if (!kvkNumber.trim()) return
    setKvkLoading(true)
    setKvkMessage(null)
    setKvkError(null)

    const result = await lookupKvkNumber(kvkNumber)

    if (result.success && result.data) {
      const info = result.data
      if (info.companyName) setCompanyName(info.companyName)
      if (info.address) {
        const parts = [
          [info.address.street, info.address.houseNumber].filter(Boolean).join(' '),
          [info.address.postalCode, info.address.city].filter(Boolean).join(' '),
        ].filter(Boolean)
        setAddress(parts.join(', '))
      }
      setKvkMessage(`Gegevens gevonden: ${info.companyName}`)
    } else {
      setKvkError(result.error || 'KVK-nummer niet gevonden')
    }

    setKvkLoading(false)
  }

  const handleAddressLookup = async () => {
    if (!postalCode.trim() || !houseNumber.trim()) return
    setAddressLooking(true)
    setAddressFound(null)
    setAddressLookupError(null)

    const result = await lookupAddress(postalCode, houseNumber)

    setAddressLooking(false)
    if (result.success && result.data) {
      const street = `${result.data.street} ${result.data.houseNumber}`
      const fullAddress = `${street}, ${result.data.postalCode} ${result.data.city}`
      setAddress(fullAddress)
      setAddressFound(`${street}, ${result.data.city}`)
      setTimeout(() => setAddressFound(null), 5000)
    } else {
      setAddressLookupError(result.error || 'Adres niet gevonden')
      setTimeout(() => setAddressLookupError(null), 5000)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return displayName.trim().length > 0
      case 1: return true
      case 2: return true
      case 3: return true
      case 4: return true
      default: return true
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    setError(null)

    const result = await completeOnboarding({
      displayName,
      companyName,
      kvkNumber,
      btwNumber,
      iban,
      address,
      services: selectedServices,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      firstClient: clientName ? {
        name: clientName,
        email: clientEmail,
        phone: clientPhone || undefined,
      } : undefined,
    })

    if (result.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError(result.error || 'Er is een fout opgetreden')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-sm">ZP</span>
              </div>
              <span className="font-semibold">ZZP Platform</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Stap {currentStep + 1} van {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    index <= currentStep
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 hidden sm:block" />
                  <span className="hidden sm:inline">{step.title}</span>
                  {index < currentStep && (
                    <Check className="h-3 w-3 text-green-500" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-start justify-center px-6 py-8 sm:py-16">
        <div className="w-full max-w-xl">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Step 0: Welkom */}
          {currentStep === 0 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground/5 mb-6">
                  <Sparkles className="h-8 w-8 text-foreground" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                  Welkom bij ZZP Platform!
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Laten we je account in een paar stappen klaarzetten. Het duurt minder dan 2 minuten.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-base">
                    Hoe mogen we je noemen?
                  </Label>
                  <Input
                    id="displayName"
                    placeholder="Je naam"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-base h-12"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Bedrijfsgegevens */}
          {currentStep === 1 && (
            <div className="animate-fade-in space-y-8">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/5 mb-4">
                  <Building2 className="h-6 w-6 text-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Bedrijfsgegevens
                </h2>
                <p className="text-muted-foreground">
                  Deze gegevens verschijnen op je facturen. Je kunt ze later altijd wijzigen.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kvkNumber">KvK-nummer</Label>
                  <div className="flex gap-2">
                    <Input
                      id="kvkNumber"
                      placeholder="12345678"
                      value={kvkNumber}
                      onChange={(e) => {
                        setKvkNumber(e.target.value)
                        setKvkMessage(null)
                        setKvkError(null)
                      }}
                      onBlur={() => {
                        if (kvkNumber.replace(/[\s.-]/g, '').length === 8) {
                          handleKvkLookup()
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleKvkLookup}
                      disabled={kvkLoading || !kvkNumber.trim()}
                    >
                      {kvkLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Opzoeken
                    </Button>
                  </div>
                  {kvkMessage && (
                    <p className="text-sm text-green-600 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      {kvkMessage}
                    </p>
                  )}
                  {kvkError && (
                    <p className="text-sm text-red-600">{kvkError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Bedrijfsnaam</Label>
                  <Input
                    id="companyName"
                    placeholder="Bijv. Studio Voorbeeld"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="btwNumber">BTW-nummer</Label>
                    <Input
                      id="btwNumber"
                      placeholder="NL123456789B01"
                      value={btwNumber}
                      onChange={(e) => setBtwNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      placeholder="NL91ABNA0417164300"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      placeholder="1234 AB"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">Huisnummer</Label>
                    <Input
                      id="houseNumber"
                      placeholder="12"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      onBlur={handleAddressLookup}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddressLookup}
                      disabled={addressLooking || !postalCode.trim() || !houseNumber.trim()}
                      className="w-full gap-2"
                    >
                      {addressLooking ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Search className="h-4 w-4" aria-hidden="true" />
                      )}
                      Opzoeken
                    </Button>
                  </div>
                </div>

                {addressFound && (
                  <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-md">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Gevonden: {addressFound}
                  </div>
                )}
                {addressLookupError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {addressLookupError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Volledig adres</Label>
                  <Input
                    id="address"
                    placeholder="Straat 1, 1234 AB Stad"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wordt automatisch ingevuld bij opzoeken, maar je kunt het ook handmatig aanpassen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Diensten */}
          {currentStep === 2 && (
            <div className="animate-fade-in space-y-8">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/5 mb-4">
                  <Briefcase className="h-6 w-6 text-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Wat bied je aan?
                </h2>
                <p className="text-muted-foreground">
                  Selecteer je diensten en stel je uurtarief in.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Diensten</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICES.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                          selectedServices.includes(service)
                            ? 'border-foreground bg-foreground/5 font-medium'
                            : 'border-border hover:border-foreground/30 hover:bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selectedServices.includes(service)
                              ? 'bg-foreground border-foreground'
                              : 'border-border'
                          }`}>
                            {selectedServices.includes(service) && (
                              <Check className="h-3 w-3 text-background" />
                            )}
                          </div>
                          {service}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Uurtarief (excl. BTW)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      &euro;
                    </span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="85"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dit wordt het standaard tarief bij nieuwe projecten.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Eerste klant */}
          {currentStep === 3 && (
            <div className="animate-fade-in space-y-8">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/5 mb-4">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Eerste klant toevoegen
                </h2>
                <p className="text-muted-foreground">
                  Heb je al een klant? Voeg deze alvast toe. Je kunt deze stap ook overslaan.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Bedrijfsnaam klant</Label>
                  <Input
                    id="clientName"
                    placeholder="Bijv. TechStart B.V."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">E-mailadres</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="info@techstart.nl"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefoonnummer (optioneel)</Label>
                  <Input
                    id="clientPhone"
                    placeholder="020-1234567"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Klaar! */}
          {currentStep === 4 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">
                  Je bent helemaal klaar!
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  {displayName ? `Welkom ${displayName}! ` : ''}Je account is ingericht. Ga aan de slag met je administratie.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/factuur/invoices/new"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-card hover:shadow-sm transition-all"
                >
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'oklch(0.65 0.25 250 / 0.1)', color: 'oklch(0.65 0.25 250)' }}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Eerste factuur maken</p>
                    <p className="text-xs text-muted-foreground">Maak je eerste factuur aan</p>
                  </div>
                </Link>
                <Link
                  href="/uren/track"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-card hover:shadow-sm transition-all"
                >
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'oklch(0.65 0.26 300 / 0.1)', color: 'oklch(0.65 0.26 300)' }}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Uren bijhouden</p>
                    <p className="text-xs text-muted-foreground">Start een timer voor je project</p>
                  </div>
                </Link>
                <Link
                  href="/belasting/expenses"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-card hover:shadow-sm transition-all"
                >
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'oklch(0.6 0.18 150 / 0.1)', color: 'oklch(0.6 0.18 150)' }}>
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Uitgave toevoegen</p>
                    <p className="text-xs text-muted-foreground">Registreer je zakelijke kosten</p>
                  </div>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-card hover:shadow-sm transition-all"
                >
                  <div className="p-2.5 rounded-lg bg-foreground/5">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Instellingen</p>
                    <p className="text-xs text-muted-foreground">Pas je gegevens aan</p>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <div>
              {currentStep > 0 && currentStep < 4 && (
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Vorige
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Skip button for optional steps */}
              {(currentStep === 1 || currentStep === 2 || currentStep === 3) && (
                <Button
                  variant="ghost"
                  onClick={nextStep}
                  className="gap-2 text-muted-foreground"
                >
                  Overslaan
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}

              {currentStep < 4 && (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  {currentStep === 0 ? 'Aan de slag' : 'Volgende'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="gap-2"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      Ga naar je dashboard
                      <LayoutDashboard className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
