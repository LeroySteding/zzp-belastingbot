'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockBranding } from '@/lib/portal/mock-data';
import { Upload, Save, Eye } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState(mockBranding.companyName);
  const [primaryColor, setPrimaryColor] = useState(mockBranding.primaryColor);
  const [portalUrl, setPortalUrl] = useState(mockBranding.portalUrl);

  return (
    
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Instellingen</h1>
          <p className="text-gray-600">Pas je portaal aan naar jouw bedrijfsstijl</p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="email">E-mail Templates</TabsTrigger>
            <TabsTrigger value="portal">Portal URL</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Bedrijfsbranding</CardTitle>
                <CardDescription>
                  Personaliseer het uiterlijk van je klantportaal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="company-name">Bedrijfsnaam</Label>
                  <Input 
                    id="company-name" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mijn Creatieve Bureau"
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Deze naam wordt getoond in het klantportaal
                  </p>
                </div>

                <div>
                  <Label>Logo</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium mb-1">Klik om logo te uploaden</p>
                    <p className="text-xs text-gray-500">PNG, JPG of SVG • Max 2MB</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Aanbevolen: vierkant formaat, minimaal 200x200px
                  </p>
                </div>

                <div>
                  <Label htmlFor="primary-color">Primaire Kleur</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input 
                      id="primary-color" 
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1 font-mono"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Deze kleur wordt gebruikt voor knoppen en accenten
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Preview</h3>
                  <div className="border rounded-lg p-6 bg-gradient-to-b from-blue-50 to-white">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {companyName.charAt(0)}
                        </div>
                        <span className="font-bold">{companyName}</span>
                      </div>
                      <Button style={{ backgroundColor: primaryColor }} className="w-full">
                        Voorbeeld Knop
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Portal
                  </Button>
                  <Button style={{ backgroundColor: primaryColor }}>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Welkomstmail</CardTitle>
                  <CardDescription>
                    Deze mail wordt verstuurd wanneer je een klant uitnodigt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="welcome-subject">Onderwerp</Label>
                    <Input 
                      id="welcome-subject"
                      defaultValue="Welkom bij {BEDRIJFSNAAM} - Toegang tot je project portal"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="welcome-body">Bericht</Label>
                    <Textarea 
                      id="welcome-body"
                      rows={8}
                      className="mt-2 font-mono text-sm"
                      defaultValue={`Beste {KLANT_NAAM},

Welkom! Ik heb een persoonlijk portaal voor je aangemaakt waar je:
• De voortgang van je project kunt volgen
• Bestanden kunt downloaden
• Direct met mij kunt communiceren

Klik op de onderstaande link om in te loggen:
{PORTAL_LINK}

Groet,
{BEDRIJFSNAAM}`}
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-1">Beschikbare variabelen:</p>
                    <p className="text-xs text-blue-700 font-mono">
                      {'{KLANT_NAAM}'} {'{BEDRIJFSNAAM}'} {'{PORTAL_LINK}'} {'{PROJECT_NAAM}'}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Template Opslaan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Update Notificatie</CardTitle>
                  <CardDescription>
                    Verstuur automatisch wanneer je een project update plaatst
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="update-subject">Onderwerp</Label>
                    <Input 
                      id="update-subject"
                      defaultValue="Nieuwe update voor {PROJECT_NAAM}"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="update-body">Bericht</Label>
                    <Textarea 
                      id="update-body"
                      rows={6}
                      className="mt-2 font-mono text-sm"
                      defaultValue={`Beste {KLANT_NAAM},

Er is een nieuwe update voor je project "{PROJECT_NAAM}":

{UPDATE_TEKST}

Bekijk alle details in je portal:
{PORTAL_LINK}

Groet,
{BEDRIJFSNAAM}`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Template Opslaan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Goedkeuring Vereist</CardTitle>
                  <CardDescription>
                    Verstuur wanneer een project klaar is voor goedkeuring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="approval-subject">Onderwerp</Label>
                    <Input 
                      id="approval-subject"
                      defaultValue="{PROJECT_NAAM} is klaar voor jouw goedkeuring"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="approval-body">Bericht</Label>
                    <Textarea 
                      id="approval-body"
                      rows={6}
                      className="mt-2 font-mono text-sm"
                      defaultValue={`Beste {KLANT_NAAM},

Goed nieuws! Je project "{PROJECT_NAAM}" is klaar voor jouw review en goedkeuring.

Bekijk het resultaat en keur goed via je portal:
{PORTAL_LINK}

Heb je vragen of feedback? Laat het me weten!

Groet,
{BEDRIJFSNAAM}`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Template Opslaan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Portal URL Tab */}
          <TabsContent value="portal">
            <Card>
              <CardHeader>
                <CardTitle>Portal URL Aanpassen</CardTitle>
                <CardDescription>
                  Gebruik je eigen domein voor het klantportaal (Pro feature)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="portal-url">Standaard Portal URL</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      id="portal-url"
                      value={portalUrl}
                      onChange={(e) => setPortalUrl(e.target.value)}
                      className="font-mono"
                    />
                    <Button variant="outline" size="sm">
                      Test
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Dit is je standaard portal URL voor klanten
                  </p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold">Pro</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Custom Domein</h3>
                      <p className="text-sm text-gray-600">
                        Gebruik je eigen domein zoals portal.jouwbedrijf.nl voor een volledig gebrand portaal
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <Label htmlFor="custom-domain" className="text-gray-400">Custom Domein</Label>
                    <Input 
                      id="custom-domain"
                      placeholder="portal.jouwbedrijf.nl"
                      className="mt-2 font-mono"
                      disabled
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 mb-3">
                      <strong>Custom domein setup instructies:</strong>
                    </p>
                    <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                      <li>Voeg een CNAME record toe in je DNS instellingen</li>
                      <li>Wijs het naar: portal.klantportaal.app</li>
                      <li>Wacht tot de DNS propagatie voltooid is (max 48 uur)</li>
                      <li>Voer je custom domein hierboven in en klik op Opslaan</li>
                    </ol>
                  </div>

                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" disabled>
                    Upgrade naar Pro voor Custom Domein
                  </Button>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
