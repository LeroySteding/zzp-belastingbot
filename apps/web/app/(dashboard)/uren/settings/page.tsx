'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, Building2, Euro, Clock } from 'lucide-react';

export default function SettingsPage() {
  const [defaultRate, setDefaultRate] = useState('85');
  const [workingHours, setWorkingHours] = useState('8');
  const [companyName, setCompanyName] = useState('Mijn ZZP Bedrijf');
  const [companyKvk, setCompanyKvk] = useState('12345678');
  const [companyBtw, setCompanyBtw] = useState('NL123456789B01');
  const [companyEmail, setCompanyEmail] = useState('info@mijnzzp.nl');
  const [companyPhone, setCompanyPhone] = useState('06 12345678');
  const [companyAddress, setCompanyAddress] = useState('Straatnaam 123');
  const [companyCity, setCompanyCity] = useState('Amsterdam');
  const [companyPostal, setCompanyPostal] = useState('1234 AB');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Algemene instellingen opgeslagen!');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Bedrijfsgegevens opgeslagen!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
          <p className="text-gray-600 mt-2">Beheer je voorkeuren en bedrijfsgegevens</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="general">Algemeen</TabsTrigger>
            <TabsTrigger value="company">Bedrijfsgegevens</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Algemene Instellingen
                </CardTitle>
                <CardDescription>
                  Standaard waarden voor nieuwe projecten en registraties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRate">Standaard uurtarief (€)</Label>
                    <Input
                      id="defaultRate"
                      type="number"
                      value={defaultRate}
                      onChange={(e) => setDefaultRate(e.target.value)}
                      placeholder="85"
                    />
                    <p className="text-sm text-gray-600">
                      Dit tarief wordt gebruikt als standaard bij het aanmaken van nieuwe projecten
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Werkuren per dag</Label>
                    <Input
                      id="workingHours"
                      type="number"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="8"
                      min="1"
                      max="24"
                    />
                    <p className="text-sm text-gray-600">
                      Standaard aantal werkuren voor rapportages en statistieken
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Voorkeuren</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Timer meldingen</Label>
                        <p className="text-sm text-gray-600">
                          Krijg een herinnering als je vergeet de timer te stoppen
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Automatisch pauze detectie</Label>
                        <p className="text-sm text-gray-600">
                          Detecteer automatisch pauzes langer dan 15 minuten
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Wekelijkse samenvattingen</Label>
                        <p className="text-sm text-gray-600">
                          Ontvang elke maandag een overzicht van de vorige week
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Opslaan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Information */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Bedrijfsgegevens
                </CardTitle>
                <CardDescription>
                  Deze gegevens worden gebruikt op urenstaten en facturen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCompany} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Bedrijfsnaam *</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyKvk">KVK nummer *</Label>
                      <Input
                        id="companyKvk"
                        value={companyKvk}
                        onChange={(e) => setCompanyKvk(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyBtw">BTW nummer</Label>
                      <Input
                        id="companyBtw"
                        value={companyBtw}
                        onChange={(e) => setCompanyBtw(e.target.value)}
                        placeholder="NL123456789B01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email *</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Telefoonnummer</Label>
                    <Input
                      id="companyPhone"
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Adresgegevens</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Straat + huisnummer *</Label>
                      <Input
                        id="companyAddress"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyPostal">Postcode *</Label>
                        <Input
                          id="companyPostal"
                          value={companyPostal}
                          onChange={(e) => setCompanyPostal(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyCity">Plaats *</Label>
                        <Input
                          id="companyCity"
                          value={companyCity}
                          onChange={(e) => setCompanyCity(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Opslaan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Informatie</CardTitle>
                  <CardDescription>Beheer je account gegevens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email adres</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="gebruiker@example.nl"
                      disabled
                    />
                    <p className="text-sm text-gray-600">
                      Neem contact op met support om je email te wijzigen
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Huidige plan</Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Gratis Plan</p>
                        <p className="text-sm text-gray-600">Tot 2 projecten</p>
                      </div>
                      <Button variant="outline">Upgrade naar Pro</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wachtwoord wijzigen</CardTitle>
                  <CardDescription>Zorg voor een sterk en uniek wachtwoord</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
                      <Input id="currentPassword" type="password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                      <Input id="newPassword" type="password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>

                    <Button type="submit">Wachtwoord wijzigen</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Gevaarlijke Zone</CardTitle>
                  <CardDescription>Permanente acties die niet ongedaan gemaakt kunnen worden</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium">Alle data exporteren</p>
                      <p className="text-sm text-gray-600">Download al je gegevens als backup</p>
                    </div>
                    <Button variant="outline">Exporteer</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-red-600">Account verwijderen</p>
                      <p className="text-sm text-gray-600">Verwijder je account en alle gegevens permanent</p>
                    </div>
                    <Button variant="destructive">Verwijderen</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
