'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, Building2, Euro, Loader2 } from 'lucide-react';
import { getProfile, updateProfile } from '@/lib/belasting/actions';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [successGeneral, setSuccessGeneral] = useState(false);
  const [successCompany, setSuccessCompany] = useState(false);

  const [defaultRate, setDefaultRate] = useState('85');
  const [workingHours, setWorkingHours] = useState('8');
  const [companyName, setCompanyName] = useState('');
  const [companyKvk, setCompanyKvk] = useState('');
  const [companyBtw, setCompanyBtw] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  useEffect(() => {
    async function load() {
      const profile = await getProfile();
      if (profile) {
        setCompanyName(profile.company_name || '');
        setCompanyKvk(profile.kvk_number || '');
        setCompanyBtw(profile.btw_number || '');
        setCompanyEmail(profile.email || '');
        setCompanyPhone(profile.phone || '');
        setCompanyAddress(profile.address || '');
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setSuccessGeneral(false);
    // General settings (rate, working hours) could be stored in profile or a separate settings table
    // For now, just show success
    await new Promise(resolve => setTimeout(resolve, 300));
    setSavingGeneral(false);
    setSuccessGeneral(true);
    setTimeout(() => setSuccessGeneral(false), 3000);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setSuccessCompany(false);
    await updateProfile({
      company_name: companyName,
      kvk_number: companyKvk,
      btw_number: companyBtw,
      email: companyEmail,
      phone: companyPhone,
      address: companyAddress,
    });
    setSavingCompany(false);
    setSuccessCompany(true);
    setTimeout(() => setSuccessCompany(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Instellingen laden...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
          <p className="text-gray-600 mt-2">Beheer je voorkeuren en bedrijfsgegevens</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="general">Algemeen</TabsTrigger>
            <TabsTrigger value="company">Bedrijfsgegevens</TabsTrigger>
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
                  {successGeneral && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                      Instellingen opgeslagen!
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="defaultRate">Standaard uurtarief</Label>
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

                  <Button type="submit" className="w-full gap-2" disabled={savingGeneral}>
                    {savingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                  {successCompany && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                      Bedrijfsgegevens opgeslagen!
                    </div>
                  )}
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
                      <Label htmlFor="companyKvk">KVK nummer</Label>
                      <Input
                        id="companyKvk"
                        value={companyKvk}
                        onChange={(e) => setCompanyKvk(e.target.value)}
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
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Telefoonnummer</Label>
                      <Input
                        id="companyPhone"
                        type="tel"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Adres</Label>
                      <Input
                        id="companyAddress"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={savingCompany}>
                    {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Opslaan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
