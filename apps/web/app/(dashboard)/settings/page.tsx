'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, User, CreditCard, Bell, Loader2, UsersRound } from 'lucide-react'
import { getProfile, updateProfile } from '@/lib/belasting/actions'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [kvk, setKvk] = useState('')
  const [btw, setBtw] = useState('')
  const [iban, setIban] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    async function load() {
      const profile = await getProfile()
      if (profile) {
        setCompanyName(profile.company_name || '')
        setKvk(profile.kvk_number || '')
        setBtw(profile.btw_number || '')
        setIban(profile.iban || '')
        setEmail(profile.email || '')
        setPhone(profile.phone || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    await updateProfile({
      company_name: companyName,
      kvk_number: kvk,
      btw_number: btw,
      iban,
      email,
      phone,
    })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
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

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bedrijf
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnement
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Bedrijfsgegevens</CardTitle>
              <CardDescription>
                Deze gegevens worden gebruikt op facturen, in het klantportaal en voor BTW-aangiften.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  Gegevens succesvol opgeslagen!
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Bedrijfsnaam</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mailadres</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kvk">KvK-nummer</Label>
                  <Input id="kvk" value={kvk} onChange={(e) => setKvk(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="btw">BTW-nummer</Label>
                  <Input id="btw" value={btw} onChange={(e) => setBtw(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <Button className="mt-4" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Opslaan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Beheer je login en wachtwoord</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Accountbeheer wordt beschikbaar in een volgende update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>Je huidige plan en facturatie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">Gratis Plan</p>
                    <p className="text-sm text-muted-foreground">Alle features beschikbaar</p>
                  </div>
                  <Button variant="outline" disabled>Upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificaties</CardTitle>
              <CardDescription>Stel in wanneer je meldingen wilt ontvangen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notificatie-instellingen worden beschikbaar in een volgende update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
