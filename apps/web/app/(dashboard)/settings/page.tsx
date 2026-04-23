'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  User,
  CreditCard,
  Bell,
  Loader2,
  UsersRound,
  FileText,
  LogOut,
  Save,
  CheckCircle,
  Cable,
} from 'lucide-react'
import { getProfile, updateProfile } from '@/lib/belasting/actions'
import { getUserSubscription } from '@/lib/subscriptions/actions'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getAuthEmail,
  signOut,
  type NotificationPreferences,
} from '@/lib/settings/actions'
import type { Profile } from '@/lib/belasting/types'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [kvk, setKvk] = useState('')
  const [btw, setBtw] = useState('')
  const [iban, setIban] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Invoice settings state
  const [defaultPaymentTerm, setDefaultPaymentTerm] = useState('30')
  const [defaultBtwRate, setDefaultBtwRate] = useState('21')
  const [korEnabled, setKorEnabled] = useState(false)
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [invoiceSuccess, setInvoiceSuccess] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_invoice_paid: true,
    email_invoice_overdue: true,
    email_weekly_summary: true,
    push_invoice_paid: true,
    push_invoice_overdue: true,
    push_deadlines: true,
  })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSuccess, setNotifSuccess] = useState(false)

  // Account state
  const [authEmail, setAuthEmail] = useState('')
  const [subscription, setSubscription] = useState<{
    plan: string
    status: string
  }>({ plan: 'free', status: 'active' })
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function load() {
      const [profile, notifs, email, sub] = await Promise.all([
        getProfile(),
        getNotificationPreferences(),
        getAuthEmail(),
        getUserSubscription(),
      ])

      if (profile) {
        setDisplayName(profile.display_name || '')
        setCompanyName(profile.company_name || '')
        setKvk(profile.kvk_number || '')
        setBtw(profile.btw_number || '')
        setIban(profile.iban || '')
        setAddress(profile.address || '')
        setPostalCode(profile.postal_code || '')
        setCity(profile.city || '')
        setPhone(profile.phone || '')
        setDefaultPaymentTerm(String(profile.default_payment_term || 30))
        setDefaultBtwRate(String(profile.default_btw_rate || 21))
        setKorEnabled(profile.kor_enabled || false)
      }

      setNotifPrefs(notifs)
      setAuthEmail(email || '')
      setSubscription({ plan: sub.plan, status: sub.status })
      setLoading(false)
    }
    load()
  }, [])

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileSuccess(false)
    setProfileError(null)

    const result = await updateProfile({
      display_name: displayName,
      company_name: companyName,
      kvk_number: kvk,
      btw_number: btw,
      iban,
      address,
      postal_code: postalCode,
      city,
      phone,
    })

    setProfileSaving(false)
    if (result) {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } else {
      setProfileError('Opslaan mislukt. Probeer het opnieuw.')
      setTimeout(() => setProfileError(null), 5000)
    }
  }

  const handleInvoiceSettingsSave = async () => {
    setInvoiceSaving(true)
    setInvoiceSuccess(false)
    setInvoiceError(null)

    const result = await updateProfile({
      default_payment_term: parseInt(defaultPaymentTerm, 10),
      default_btw_rate: parseInt(defaultBtwRate, 10),
      kor_enabled: korEnabled,
    })

    setInvoiceSaving(false)
    if (result) {
      setInvoiceSuccess(true)
      setTimeout(() => setInvoiceSuccess(false), 3000)
    } else {
      setInvoiceError('Opslaan mislukt. Probeer het opnieuw.')
      setTimeout(() => setInvoiceError(null), 5000)
    }
  }

  const handleNotifToggle = async (
    key: keyof NotificationPreferences,
    checked: boolean
  ) => {
    const updated = { ...notifPrefs, [key]: checked }
    setNotifPrefs(updated)
    setNotifSaving(true)
    setNotifSuccess(false)

    const result = await updateNotificationPreferences({ [key]: checked })

    setNotifSaving(false)
    if (result.success) {
      setNotifSuccess(true)
      setTimeout(() => setNotifSuccess(false), 2000)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    router.push('/login')
  }

  const planLabels: Record<string, string> = {
    free: 'Gratis',
    pro: 'Pro',
    business: 'Business',
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Instellingen laden...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je bedrijfsgegevens en voorkeuren</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="profile" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profiel</span>
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Facturatie</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaties</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* SECTION 1: PROFIEL                          */}
        {/* ============================================ */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profiel & Bedrijfsgegevens</CardTitle>
              <CardDescription>
                Deze gegevens worden gebruikt op facturen, in het klantportaal en voor BTW-aangiften.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileSuccess && (
                <div role="status" className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  Gegevens succesvol opgeslagen!
                </div>
              )}
              {profileError && (
                <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {profileError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Naam</Label>
                <Input
                  id="displayName"
                  placeholder="Je volledige naam"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
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

              <Separator />

              <fieldset className="space-y-4">
                <legend className="text-sm font-medium">Bedrijfsregistratie</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kvk">KvK-nummer</Label>
                    <Input
                      id="kvk"
                      placeholder="12345678"
                      value={kvk}
                      onChange={(e) => setKvk(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="btw">BTW-nummer</Label>
                    <Input
                      id="btw"
                      placeholder="NL123456789B01"
                      value={btw}
                      onChange={(e) => setBtw(e.target.value)}
                      aria-describedby="btw-format-hint"
                    />
                    <p id="btw-format-hint" className="text-xs text-muted-foreground">
                      Format: NL + 9 cijfers + B + 2 cijfers
                    </p>
                  </div>
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
              </fieldset>

              <Separator />

              <fieldset className="space-y-4">
                <legend className="text-sm font-medium">Adresgegevens</legend>
                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    placeholder="Straatnaam 1"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label htmlFor="city">Stad</Label>
                    <Input
                      id="city"
                      placeholder="Amsterdam"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    placeholder="06-12345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </fieldset>

              <Button onClick={handleProfileSave} disabled={profileSaving} className="gap-2">
                {profileSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                Opslaan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* SECTION 2: FACTURATIE INSTELLINGEN           */}
        {/* ============================================ */}
        <TabsContent value="invoicing">
          <Card>
            <CardHeader>
              <CardTitle>Facturatie instellingen</CardTitle>
              <CardDescription>
                Standaardinstellingen voor nieuwe facturen. Je kunt deze per factuur aanpassen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {invoiceSuccess && (
                <div role="status" className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  Facturatie-instellingen opgeslagen!
                </div>
              )}
              {invoiceError && (
                <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {invoiceError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentTerm">Standaard betalingstermijn</Label>
                <Select value={defaultPaymentTerm} onValueChange={setDefaultPaymentTerm}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecteer termijn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 dagen</SelectItem>
                    <SelectItem value="30">30 dagen</SelectItem>
                    <SelectItem value="60">60 dagen</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Dit bepaalt de standaard vervaldatum op nieuwe facturen.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="btwRate">Standaard BTW-tarief</Label>
                <Select value={defaultBtwRate} onValueChange={setDefaultBtwRate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecteer tarief" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="21">21% (standaard)</SelectItem>
                    <SelectItem value="9">9% (verlaagd)</SelectItem>
                    <SelectItem value="0">0% (vrijgesteld)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Het standaard BTW-tarief voor nieuwe factuurregels.
                </p>
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="korToggle" className="text-base font-medium cursor-pointer">
                    Kleine Ondernemersregeling (KOR)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ik val onder de Kleine Ondernemersregeling (omzet &lt; &euro;20.000/jaar).
                    BTW wordt niet berekend op facturen.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Let op: bij de KOR breng je geen BTW in rekening aan klanten en
                    mag je ook geen BTW aftrekken op je inkopen.
                  </p>
                </div>
                <Switch
                  id="korToggle"
                  checked={korEnabled}
                  onCheckedChange={setKorEnabled}
                />
              </div>

              <Button onClick={handleInvoiceSettingsSave} disabled={invoiceSaving} className="gap-2">
                {invoiceSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                Opslaan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* SECTION 3: NOTIFICATIE VOORKEUREN            */}
        {/* ============================================ */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificatie voorkeuren</CardTitle>
              <CardDescription>
                Stel in wanneer en hoe je meldingen wilt ontvangen.
                {notifSaving && (
                  <span className="ml-2 text-muted-foreground">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                    Opslaan...
                  </span>
                )}
                {notifSuccess && (
                  <span className="ml-2 text-green-600">Opgeslagen</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email notifications */}
              <div>
                <h3 className="text-sm font-semibold mb-4">E-mailnotificaties</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailPaid" className="font-normal cursor-pointer">
                        Email bij betaling ontvangen
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ontvang een email wanneer een factuur betaald is.
                      </p>
                    </div>
                    <Switch
                      id="emailPaid"
                      checked={notifPrefs.email_invoice_paid}
                      onCheckedChange={(checked) =>
                        handleNotifToggle('email_invoice_paid', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailOverdue" className="font-normal cursor-pointer">
                        Email bij verlopen factuur
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ontvang een email wanneer een factuur de betalingstermijn overschrijdt.
                      </p>
                    </div>
                    <Switch
                      id="emailOverdue"
                      checked={notifPrefs.email_invoice_overdue}
                      onCheckedChange={(checked) =>
                        handleNotifToggle('email_invoice_overdue', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailWeekly" className="font-normal cursor-pointer">
                        Wekelijkse samenvatting email
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ontvang elke maandag een overzicht van je openstaande facturen en uren.
                      </p>
                    </div>
                    <Switch
                      id="emailWeekly"
                      checked={notifPrefs.email_weekly_summary}
                      onCheckedChange={(checked) =>
                        handleNotifToggle('email_weekly_summary', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* In-app notifications */}
              <div>
                <h3 className="text-sm font-semibold mb-4">In-app meldingen</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushPaid" className="font-normal cursor-pointer">
                        Melding bij betaling ontvangen
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Toon een melding in de app wanneer een factuur betaald is.
                      </p>
                    </div>
                    <Switch
                      id="pushPaid"
                      checked={notifPrefs.push_invoice_paid}
                      onCheckedChange={(checked) =>
                        handleNotifToggle('push_invoice_paid', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushOverdue" className="font-normal cursor-pointer">
                        Melding bij verlopen factuur
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Toon een melding wanneer een factuur verlopen is.
                      </p>
                    </div>
                    <Switch
                      id="pushOverdue"
                      checked={notifPrefs.push_invoice_overdue}
                      onCheckedChange={(checked) =>
                        handleNotifToggle('push_invoice_overdue', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushDeadlines" className="font-normal cursor-pointer">
                        Melding bij aankomende deadlines
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ontvang een herinnering bij naderende BTW-deadlines en projectdeadlines.
                      </p>
                    </div>
                    <Switch
                      id="pushDeadlines"
                      checked={notifPrefs.push_deadlines}
                      onCheckedChange={(checked) =>
                        handleNotifToggle('push_deadlines', checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* SECTION 4: ACCOUNT                          */}
        {/* ============================================ */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Je accountgegevens en abonnementsstatus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>E-mailadres</Label>
                  <Input
                    value={authEmail}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Je e-mailadres kan niet worden gewijzigd.
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Abonnement</Label>
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="font-semibold text-lg">
                          {planLabels[subscription.plan] || 'Gratis'} Plan
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.plan === 'free'
                            ? 'Alle basisfeatures beschikbaar'
                            : `Status: ${subscription.status === 'active' ? 'Actief' : subscription.status}`}
                        </p>
                      </div>
                      {subscription.plan === 'free' ? (
                        <Button variant="outline">Upgrade</Button>
                      ) : (
                        <Button variant="outline">Beheren</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team management link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5" />
                  Team beheer
                </CardTitle>
                <CardDescription>
                  Nodig boekhouders of medewerkers uit om toegang te krijgen tot je administratie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settings/team">
                  <Button variant="outline" className="gap-2">
                    <UsersRound className="h-4 w-4" />
                    Ga naar team beheer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Integrations link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cable className="h-5 w-5" />
                  Integraties
                </CardTitle>
                <CardDescription>
                  Koppel externe diensten zoals Mollie, bankrekeningen en boekhoudpakketten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settings/integrations">
                  <Button variant="outline" className="gap-2">
                    <Cable className="h-4 w-4" />
                    Ga naar integraties
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sign out */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {signingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  Uitloggen
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
