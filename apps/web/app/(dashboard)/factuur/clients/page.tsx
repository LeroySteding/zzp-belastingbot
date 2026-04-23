'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, Search, Loader2, CheckCircle, XCircle, ArrowDownCircle } from 'lucide-react';
import { Client } from '@/lib/factuur/types/invoice';
import { formatDate } from '@/lib/factuur/invoice-utils';
import { getClients, createClientAction, updateClientAction, deleteClientAction } from '@/lib/factuur/actions';
import { validateVatNumber, type ViesResult } from '@/lib/integrations/vies';
import { lookupKvkNumber } from '@/lib/integrations/kvk';
import { lookupAddress } from '@/lib/integrations/address';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    kvk: '',
    btwNumber: '',
  });
  const [viesValidating, setViesValidating] = useState(false);
  const [viesResult, setViesResult] = useState<ViesResult | null>(null);
  const [kvkLoading, setKvkLoading] = useState(false);
  const [kvkMessage, setKvkMessage] = useState<string | null>(null);
  const [kvkError, setKvkError] = useState<string | null>(null);
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientHouseNumber, setClientHouseNumber] = useState('');
  const [addressLooking, setAddressLooking] = useState(false);
  const [addressFound, setAddressFound] = useState<string | null>(null);
  const [addressLookupError, setAddressLookupError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKvkLookup = async () => {
    if (!formData.kvk.trim()) return;
    setKvkLoading(true);
    setKvkMessage(null);
    setKvkError(null);

    const result = await lookupKvkNumber(formData.kvk);

    if (result.success && result.data) {
      const info = result.data;
      const updates: Partial<typeof formData> = {};
      if (info.companyName) updates.name = info.companyName;
      if (info.address) {
        const parts = [
          [info.address.street, info.address.houseNumber].filter(Boolean).join(' '),
          [info.address.postalCode, info.address.city].filter(Boolean).join(' '),
        ].filter(Boolean);
        updates.address = parts.join(', ');
      }
      updates.kvk = info.kvkNumber;
      setFormData((prev) => ({ ...prev, ...updates }));
      setKvkMessage(`Gegevens gevonden: ${info.companyName}`);
    } else {
      setKvkError(result.error || 'KVK-nummer niet gevonden');
    }

    setKvkLoading(false);
  };

  const handleClientAddressLookup = async () => {
    if (!clientPostalCode.trim() || !clientHouseNumber.trim()) return;
    setAddressLooking(true);
    setAddressFound(null);
    setAddressLookupError(null);

    const result = await lookupAddress(clientPostalCode, clientHouseNumber);

    setAddressLooking(false);
    if (result.success && result.data) {
      const street = `${result.data.street} ${result.data.houseNumber}`;
      const fullAddress = `${street}, ${result.data.postalCode} ${result.data.city}`;
      setFormData((prev) => ({ ...prev, address: fullAddress }));
      setAddressFound(`${street}, ${result.data.city}`);
      setTimeout(() => setAddressFound(null), 5000);
    } else {
      setAddressLookupError(result.error || 'Adres niet gevonden');
      setTimeout(() => setAddressLookupError(null), 5000);
    }
  };

  const handleOpenDialog = (client?: Client) => {
    setViesResult(null);
    setKvkMessage(null);
    setKvkError(null);
    setAddressFound(null);
    setAddressLookupError(null);
    setClientPostalCode('');
    setClientHouseNumber('');
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        address: client.address,
        email: client.email,
        kvk: client.kvk || '',
        btwNumber: client.btwNumber || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        address: '',
        email: '',
        kvk: '',
        btwNumber: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingClient) {
      const updated = await updateClientAction(editingClient.id, formData);
      if (updated) {
        setClients(clients.map(c => c.id === editingClient.id ? updated : c));
      }
    } else {
      const created = await createClientAction(formData);
      if (created) {
        setClients([created, ...clients]);
      }
    }
    setSaving(false);
    setShowDialog(false);
  };

  const handleViesValidation = async () => {
    if (!formData.btwNumber.trim()) return;
    setViesValidating(true);
    setViesResult(null);
    const result = await validateVatNumber(formData.btwNumber.trim());
    setViesResult(result);
    setViesValidating(false);
  };

  const handleViesAutoFill = () => {
    if (!viesResult || !viesResult.valid) return;
    setFormData((prev) => ({
      ...prev,
      name: viesResult.name || prev.name,
      address: viesResult.address || prev.address,
    }));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze klant wilt verwijderen?')) {
      const result = await deleteClientAction(id);
      if (result.success) {
        setClients(clients.filter(c => c.id !== id));
      } else if (result.error) {
        alert(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-2xl font-bold">Klanten</h1>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Klant
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Klanten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-4">
              <CardTitle>Alle Klanten</CardTitle>
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek op naam of email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Klanten laden...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>KvK</TableHead>
                    <TableHead>BTW-nummer</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchQuery ? 'Geen klanten gevonden' : 'Nog geen klanten. Voeg je eerste klant toe!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell className="text-gray-600">{client.kvk || '-'}</TableCell>
                        <TableCell className="text-gray-600">{client.btwNumber || '-'}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(client.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(client)}
                              aria-label="Bewerken"
                            >
                              <Edit className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id)}
                              aria-label="Verwijderen"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Klant Bewerken' : 'Nieuwe Klant'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bedrijfsnaam of contactpersoon"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@bedrijf.nl"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Adres opzoeken</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    placeholder="Postcode"
                    value={clientPostalCode}
                    onChange={(e) => setClientPostalCode(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Huisnr."
                    value={clientHouseNumber}
                    onChange={(e) => setClientHouseNumber(e.target.value)}
                    onBlur={handleClientAddressLookup}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClientAddressLookup}
                    disabled={addressLooking || !clientPostalCode.trim() || !clientHouseNumber.trim()}
                    className="w-full gap-1"
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
                <div className="flex items-center gap-2 p-2 text-sm text-green-600 bg-green-50 rounded-md">
                  <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Gevonden: {addressFound}
                </div>
              )}
              {addressLookupError && (
                <div className="p-2 text-sm text-red-600 bg-red-50 rounded-md">
                  {addressLookupError}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="address">Adres *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Straat 123, 1234 AB Amsterdam"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wordt automatisch ingevuld bij opzoeken, maar je kunt het ook handmatig aanpassen.
              </p>
            </div>
            <div>
              <Label htmlFor="kvk">KvK-nummer</Label>
              <div className="flex gap-2">
                <Input
                  id="kvk"
                  value={formData.kvk}
                  onChange={(e) => {
                    setFormData({ ...formData, kvk: e.target.value });
                    setKvkMessage(null);
                    setKvkError(null);
                  }}
                  placeholder="12345678"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleKvkLookup}
                  disabled={kvkLoading || !formData.kvk.trim()}
                  className="shrink-0"
                >
                  {kvkLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Search className="h-4 w-4 mr-1" />
                  )}
                  KVK opzoeken
                </Button>
              </div>
              {kvkMessage && (
                <div className="mt-2 text-sm flex items-center gap-2 rounded-md p-2 bg-green-50 text-green-800 border border-green-200">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                  <span>{kvkMessage}</span>
                </div>
              )}
              {kvkError && (
                <div className="mt-2 text-sm flex items-center gap-2 rounded-md p-2 bg-red-50 text-red-800 border border-red-200">
                  <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{kvkError}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="btwNumber">BTW-nummer</Label>
              <div className="flex gap-2">
                  <Input
                    id="btwNumber"
                    value={formData.btwNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, btwNumber: e.target.value });
                      setViesResult(null);
                    }}
                    placeholder="NL123456789B01"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViesValidation}
                    disabled={viesValidating || !formData.btwNumber.trim()}
                    className="shrink-0"
                  >
                    {viesValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Valideer
                  </Button>
                </div>
                {viesResult && (
                  <div className={`mt-2 text-sm flex items-start gap-2 rounded-md p-2 ${
                    viesResult.valid
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {viesResult.valid ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
                    )}
                    <div className="flex-1">
                      {viesResult.valid ? (
                        <>
                          <span className="font-medium">Geldig</span>
                          {(viesResult.name || viesResult.address) && (
                            <span> - {[viesResult.name, viesResult.address].filter(Boolean).join(', ')}</span>
                          )}
                          {(viesResult.name || viesResult.address) && (
                            <button
                              type="button"
                              onClick={handleViesAutoFill}
                              className="ml-2 inline-flex items-center gap-1 text-green-700 hover:text-green-900 underline text-xs font-medium"
                            >
                              <ArrowDownCircle className="h-3 w-3" />
                              Gegevens overnemen
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="font-medium">Ongeldig BTW-nummer</span>
                      )}
                    </div>
                  </div>
                )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuleren
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.email || !formData.address || saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClient ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
