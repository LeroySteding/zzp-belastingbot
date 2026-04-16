'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { mockClients, mockProjects } from '@/lib/portal/mock-data';
import { Plus, Mail, Building, User, Link as LinkIcon, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ClientsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyInviteLink = () => {
    const link = `https://portal.mijnbureau.nl/invite/${selectedClient}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    
      <div className="max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Klanten</h1>
            <p className="text-gray-600">Beheer je klanten en verstuur uitnodigingen</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Uitnodiging
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Klant Uitnodigen</DialogTitle>
                  <DialogDescription>
                    Deel deze link met je klant om toegang te geven tot het portaal
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Selecteer Klant</Label>
                    <select 
                      className="w-full mt-2 p-2 border rounded-md"
                      value={selectedClient || ''}
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <option value="">Kies een klant...</option>
                      {mockClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedClient && (
                    <div>
                      <Label>Uitnodigingslink</Label>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          readOnly 
                          value={`https://portal.mijnbureau.nl/invite/${selectedClient}`}
                          className="font-mono text-sm"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleCopyInviteLink}
                          className="flex-shrink-0"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Deze link verloopt na 7 dagen
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Klant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe Klant Toevoegen</DialogTitle>
                  <DialogDescription>
                    Vul de klantgegevens in om te beginnen
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="client-name">Naam</Label>
                    <Input id="client-name" placeholder="Jan de Vries" />
                  </div>
                  <div>
                    <Label htmlFor="company">Bedrijf</Label>
                    <Input id="company" placeholder="De Vries Holding B.V." />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input id="email" type="email" placeholder="jan@devries.nl" />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit" onClick={(e) => {
                      e.preventDefault();
                      setIsAddDialogOpen(false);
                    }}>
                      Klant Toevoegen
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Client Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockClients.map((client) => {
            const clientProjects = mockProjects.filter(p => p.clientId === client.id);
            const activeProjects = clientProjects.filter(p => p.status !== 'afgerond');

            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          {client.company}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Projecten</span>
                        <Badge variant="secondary">
                          {activeProjects.length} actief
                        </Badge>
                      </div>
                      
                      {clientProjects.length > 0 ? (
                        <div className="space-y-2">
                          {clientProjects.slice(0, 2).map(project => (
                            <Link 
                              key={project.id} 
                              href={`/projects/${project.id}`}
                              className="block text-sm text-gray-600 hover:text-blue-600 truncate"
                            >
                              • {project.name}
                            </Link>
                          ))}
                          {clientProjects.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{clientProjects.length - 2} meer...
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Geen projecten</p>
                      )}
                    </div>

                    <div className="pt-3 border-t flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedClient(client.id);
                          setIsInviteDialogOpen(true);
                        }}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Uitnodigen
                      </Button>
                      <Link href={`/projects?client=${client.id}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full">
                          Bekijk
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mockClients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nog geen klanten</h3>
              <p className="text-gray-600 mb-4">Begin met het toevoegen van je eerste klant</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Eerste Klant Toevoegen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    
  );
}
