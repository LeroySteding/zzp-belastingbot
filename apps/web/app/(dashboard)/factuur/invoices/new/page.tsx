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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Eye, Mail, FileText, Loader2, Download, CheckCircle2, AlertCircle, CheckCircle, XCircle, ArrowDownCircle } from 'lucide-react';
import { getDueDate, calculateInvoice, formatCurrency } from '@/lib/factuur/invoice-utils';
import { CompanyInfo, ClientInfo, Client, LineItem, RecurringFrequency, InvoiceTemplate } from '@/lib/factuur/types/invoice';
import InvoicePreview from '@/components/factuur/InvoicePreview';
import { getClients, getCompanyInfo, getNextInvoiceNumber, createInvoiceAction } from '@/lib/factuur/actions';
import { sendInvoiceEmail } from '@/lib/factuur/email-actions';
import { validateVatNumber, type ViesResult } from '@/lib/integrations/vies';

export default function NewInvoicePage() {
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
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(getDueDate(new Date().toISOString().split('T')[0]));
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
  const [recurring, setRecurring] = useState<RecurringFrequency>(null);
  const [template, setTemplate] = useState<InvoiceTemplate>('modern');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viesValidating, setViesValidating] = useState(false);
  const [viesResult, setViesResult] = useState<ViesResult | null>(null);

  useEffect(() => {
    async function loadData() {
      const [clientsData, companyData, nextNumber] = await Promise.all([
        getClients(),
        getCompanyInfo(),
        getNextInvoiceNumber(),
      ]);
      setClients(clientsData);
      if (companyData) {
        setCompany(companyData);
      }
      setInvoiceNumber(nextNumber);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'manual') {
      setClient({
        name: '',
        address: '',
        email: '',
      });
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

  const handleViesValidation = async () => {
    const btwValue = client.btwNumber?.trim();
    if (!btwValue) return;
    setViesValidating(true);
    setViesResult(null);
    const result = await validateVatNumber(btwValue);
    setViesResult(result);
    setViesValidating(false);
  };

  const handleViesAutoFill = () => {
    if (!viesResult || !viesResult.valid) return;
    setClient((prev) => ({
      ...prev,
      name: viesResult.name || prev.name,
      address: viesResult.address || prev.address,
    }));
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

  const invoice = {
    id: 'new',
    invoiceNumber,
    date,
    dueDate,
    company,
    client,
    items,
    status: 'concept' as const,
    notes,
    recurring,
    template,
  };

  const handleSave = async () => {
    setSaving(true);
    const id = await createInvoiceAction({
      invoiceNumber,
      date,
      dueDate,
      clientId: selectedClientId && selectedClientId !== 'manual' ? selectedClientId : undefined,
      notes: notes || undefined,
      template,
      recurring,
      items,
    });
    setSaving(false);

    if (id) {
      router.push('/factuur/invoices');
    } else {
      alert('Er is een fout opgetreden bij het opslaan van de factuur.');
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch('/api/factuur/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        throw new Error('PDF generatie mislukt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
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

  const handleSendEmail = async () => {
    if (!client.email) {
      setEmailResult({ type: 'error', message: 'Vul eerst een email adres in bij de klantgegevens.' });
      return;
    }

    setSendingEmail(true);
    setEmailResult(null);

    try {
      const result = await sendInvoiceEmail(invoice, client.email, emailSubject, emailBody);

      if (result.success) {
        setEmailResult({ type: 'success', message: 'Email is succesvol verstuurd!' });
      } else {
        setEmailResult({ type: 'error', message: result.error || 'Email versturen mislukt.' });
      }
    } catch (err: any) {
      setEmailResult({ type: 'error', message: `Onverwachte fout: ${err.message}` });
    } finally {
      setSendingEmail(false);
    }
  };

  const emailSubject = `Factuur ${invoiceNumber} van ${company.name}`;
  const emailBody = `Beste ${client.name},

Hierbij ontvangt u factuur ${invoiceNumber} van ${company.name}.

Factuurgegevens:
- Factuurnummer: ${invoiceNumber}
- Factuurdatum: ${new Date(date).toLocaleDateString('nl-NL')}
- Vervaldatum: ${new Date(dueDate).toLocaleDateString('nl-NL')}
- Totaalbedrag: ${formatCurrency(calculation.total)}

De factuur is als PDF bijgevoegd bij deze email.

Wij verzoeken u vriendelijk het factuurbedrag voor de vervaldatum over te maken naar:
IBAN: ${company.iban}
t.n.v. ${company.name}

Bij vragen kunt u contact met ons opnemen via ${company.email || company.phone || 'onze contactgegevens'}.

Met vriendelijke groet,
${company.name}`;

  const templateDescriptions = {
    modern: 'Modern - Strak en professioneel design met blauwe accenten',
    classic: 'Classic - Formeel en traditioneel ontwerp met zwarte accenten',
    minimal: 'Minimaal - Clean en minimalistisch design met groene accenten',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Factuur voorbereiden...</span>
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
            <Button variant="ghost" size="icon" asChild aria-label="Terug naar facturen">
              <Link href="/factuur/invoices">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Nieuwe Factuur</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Verberg' : 'Toon'} Preview
            </Button>
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Email Preview
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
                <div>
                  <Label htmlFor="client-btw">BTW-nummer</Label>
                  <div className="flex gap-2">
                    <Input
                      id="client-btw"
                      value={client.btwNumber || ''}
                      onChange={(e) => {
                        setClient({ ...client, btwNumber: e.target.value });
                        setViesResult(null);
                      }}
                      placeholder="NL123456789B01"
                      disabled={selectedClientId !== 'manual' && selectedClientId !== ''}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleViesValidation}
                      disabled={viesValidating || !client.btwNumber?.trim()}
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
                            {(viesResult.name || viesResult.address) && (selectedClientId === 'manual' || selectedClientId === '') && (
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
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Factuurgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoice-number">Factuurnummer</Label>
                    <Input id="invoice-number" value={invoiceNumber} disabled />
                  </div>
                  <div>
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setDueDate(getDueDate(e.target.value));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date">Vervaldatum</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template">Factuur Template</Label>
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
                  <div>
                    <Label htmlFor="recurring">Terugkerende Factuur</Label>
                    <Select
                      value={recurring || 'none'}
                      onValueChange={(value) => setRecurring(value === 'none' ? null : value as RecurringFrequency)}
                    >
                      <SelectTrigger id="recurring">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Eenmalig</SelectItem>
                        <SelectItem value="maandelijks">Maandelijks</SelectItem>
                        <SelectItem value="kwartaal">Per kwartaal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                          aria-label={`Regel ${index + 1} verwijderen`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
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
                  placeholder="Bijv: Betaling binnen 30 dagen na factuurdatum"
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
                  <InvoicePreview invoice={invoice} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="mx-4 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Zo ziet de email eruit die naar de klant wordt verstuurd
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-gray-600">Naar:</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded border">
                {client.email || 'Geen email adres ingevuld'}
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Onderwerp:</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded border font-medium">
                {emailSubject}
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Bericht:</Label>
              <div className="mt-1 p-4 bg-gray-50 rounded border whitespace-pre-wrap text-sm">
                {emailBody}
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Bijlage:</Label>
              <div className="mt-1 p-3 bg-blue-50 rounded border flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{invoiceNumber}.pdf</div>
                  <div className="text-xs text-gray-500">PDF Factuur</div>
                </div>
              </div>
            </div>
            {emailResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded border ${
                  emailResult.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {emailResult.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <span className="text-sm">{emailResult.message}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowEmailDialog(false); setEmailResult(null); }}>
                Sluiten
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !client.email}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {sendingEmail ? 'Versturen...' : 'Versturen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
