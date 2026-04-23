'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Eye, Loader2, Download } from 'lucide-react';
import { getDueDate, calculateInvoice, formatCurrency } from '@/lib/factuur/invoice-utils';
import { CompanyInfo, ClientInfo, Client, LineItem, InvoiceTemplate } from '@/lib/factuur/types/invoice';
import InvoicePreview from '@/components/factuur/InvoicePreview';
import { getClients, getCompanyInfo } from '@/lib/factuur/actions';
import { getNextOfferteNumber, createOfferte } from '@/lib/offerte/actions';

export default function NewOffertePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [company, setCompany] = useState<CompanyInfo>({
    name: '',
    address: '',
    kvk: '',
    btwNumber: '',
    iban: '',
    email: '',
    phone: '',
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [client, setClient] = useState<ClientInfo>({
    name: '',
    address: '',
    email: '',
  });
  const [offerteNumber, setOfferteNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(getDueDate(new Date().toISOString().split('T')[0]));
  const [items, setItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      btwRate: 21,
    },
  ]);
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [template, setTemplate] = useState<InvoiceTemplate>('modern');

  useEffect(() => {
    async function loadData() {
      const [clientsData, companyData, nextNumber] = await Promise.all([
        getClients(),
        getCompanyInfo(),
        getNextOfferteNumber(),
      ]);
      setClients(clientsData);
      if (companyData) {
        setCompany(companyData);
      }
      setOfferteNumber(nextNumber);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'manual') {
      setClient({ name: '', address: '', email: '' });
    } else {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setClient({
          name: selectedClient.name,
          address: selectedClient.address,
          email: selectedClient.email,
          kvk: selectedClient.kvk,
          btwNumber: selectedClient.btwNumber,
        });
      }
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        btwRate: 21,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculation = calculateInvoice(items);

  // Build a preview object compatible with InvoicePreview (reuse invoice preview)
  const previewInvoice = {
    id: 'new',
    invoiceNumber: offerteNumber,
    date,
    dueDate: validUntil,
    company,
    client,
    items,
    status: 'concept' as const,
    notes,
    template,
  };

  const handleSave = async () => {
    setSaving(true);
    const id = await createOfferte({
      offerteNumber,
      date,
      validUntil,
      clientId: selectedClientId && selectedClientId !== 'manual' ? selectedClientId : undefined,
      notes: notes || undefined,
      template,
      items,
    });
    setSaving(false);

    if (id) {
      router.push('/factuur/offertes');
    } else {
      alert('Er is een fout opgetreden bij het opslaan van de offerte.');
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch('/api/factuur/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewInvoice),
      });

      if (!response.ok) {
        throw new Error('PDF generatie mislukt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${offerteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Er is een fout opgetreden bij het genereren van de PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const templateDescriptions: Record<string, string> = {
    modern: 'Modern - Strak en professioneel design met blauwe accenten',
    classic: 'Classic - Formeel en traditioneel ontwerp met zwarte accenten',
    minimal: 'Minimaal - Clean en minimalistisch design met groene accenten',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Offerte voorbereiden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/factuur/offertes">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Nieuwe Offerte</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Verberg' : 'Toon'} Preview
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opslaan als Concept
            </Button>
            <Button variant="default" onClick={handleGeneratePdf} disabled={generatingPdf}>
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Genereer PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Jouw Bedrijfsgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company-name">Bedrijfsnaam</Label>
                  <Input
                    id="company-name"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company-address">Adres</Label>
                  <Textarea
                    id="company-address"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kvk">KvK-nummer</Label>
                    <Input
                      id="kvk"
                      value={company.kvk}
                      onChange={(e) => setCompany({ ...company, kvk: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="btw">BTW-nummer</Label>
                    <Input
                      id="btw"
                      value={company.btwNumber}
                      onChange={(e) => setCompany({ ...company, btwNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={company.iban}
                    onChange={(e) => setCompany({ ...company, iban: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={company.email || ''}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Telefoon</Label>
                    <Input
                      id="company-phone"
                      value={company.phone || ''}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Klantgegevens</CardTitle>
                  <Link href="/factuur/clients" target="_blank">
                    <Button variant="outline" size="sm">Beheer Klanten</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client-select">Selecteer Klant</Label>
                  <Select value={selectedClientId} onValueChange={handleClientSelect}>
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder="Kies een klant of voer handmatig in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Handmatig invoeren</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="client-name">Naam/Bedrijf</Label>
                  <Input
                    id="client-name"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    disabled={selectedClientId !== 'manual' && selectedClientId !== ''}
                  />
                </div>
                <div>
                  <Label htmlFor="client-address">Adres</Label>
                  <Textarea
                    id="client-address"
                    value={client.address}
                    onChange={(e) => setClient({ ...client, address: e.target.value })}
                    rows={3}
                    disabled={selectedClientId !== 'manual' && selectedClientId !== ''}
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={client.email || ''}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    disabled={selectedClientId !== 'manual' && selectedClientId !== ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Offerte Details */}
            <Card>
              <CardHeader>
                <CardTitle>Offertegegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="offerte-number">Offertenummer</Label>
                    <Input id="offerte-number" value={offerteNumber} disabled />
                  </div>
                  <div>
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setValidUntil(getDueDate(e.target.value));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid-until">Geldig tot</Label>
                    <Input
                      id="valid-until"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="template">Offerte Template</Label>
                  <Select value={template} onValueChange={(value) => setTemplate(value as InvoiceTemplate)}>
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimaal</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">{templateDescriptions[template]}</p>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Regels</CardTitle>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Regel Toevoegen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">Regel {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Omschrijving</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Bijv: Website ontwikkeling"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <Label>Aantal</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Prijs p/st</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>BTW</Label>
                        <Select
                          value={item.btwRate.toString()}
                          onValueChange={(value) => updateItem(item.id, 'btwRate', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="21">21%</SelectItem>
                            <SelectItem value="9">9%</SelectItem>
                            <SelectItem value="0">0%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-gray-600">Totaal: </span>
                      <span className="font-semibold">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotaal</span>
                    <span className="font-medium">{formatCurrency(calculation.subtotal)}</span>
                  </div>
                  {calculation.btw21 > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">BTW 21%</span>
                      <span className="font-medium">{formatCurrency(calculation.btw21)}</span>
                    </div>
                  )}
                  {calculation.btw9 > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">BTW 9%</span>
                      <span className="font-medium">{formatCurrency(calculation.btw9)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Totaal</span>
                    <span>{formatCurrency(calculation.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notities (optioneel)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bijv: Deze offerte is 30 dagen geldig."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:sticky lg:top-4 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Preview - {template === 'modern' ? 'Modern' : template === 'classic' ? 'Classic' : 'Minimaal'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <InvoicePreview invoice={previewInvoice} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
