'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, Search, Loader2 } from 'lucide-react';
import { Client } from '@/lib/factuur/types/invoice';
import { formatDate } from '@/lib/factuur/invoice-utils';
import { getClients, createClientAction, updateClientAction, deleteClientAction } from '@/lib/factuur/actions';

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

  const handleOpenDialog = (client?: Client) => {
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
                              title="Bewerken"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id)}
                              title="Verwijderen"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
            <div>
              <Label htmlFor="address">Adres *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Straat 123, 1234 AB Amsterdam"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kvk">KvK-nummer</Label>
                <Input
                  id="kvk"
                  value={formData.kvk}
                  onChange={(e) => setFormData({ ...formData, kvk: e.target.value })}
                  placeholder="12345678"
                />
              </div>
              <div>
                <Label htmlFor="btwNumber">BTW-nummer</Label>
                <Input
                  id="btwNumber"
                  value={formData.btwNumber}
                  onChange={(e) => setFormData({ ...formData, btwNumber: e.target.value })}
                  placeholder="NL123456789B01"
                />
              </div>
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
