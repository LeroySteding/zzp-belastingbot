'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Download, Mail, FileText, Loader2, ArrowRight,
  CheckCircle2, AlertCircle, Send,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate, calculateInvoice } from '@/lib/factuur/invoice-utils';
import InvoicePreview from '@/components/factuur/InvoicePreview';
import { sendInvoiceEmail } from '@/lib/factuur/email-actions';
import {
  getOfferte,
  updateOfferteStatus,
  convertToInvoice,
  deleteOfferte,
  type Offerte,
  type OfferteStatus,
} from '@/lib/offerte/actions';

const statusColors: Record<string, string> = {
  concept: 'bg-gray-100 text-gray-800',
  verzonden: 'bg-blue-100 text-blue-800',
  geaccepteerd: 'bg-green-100 text-green-800',
  afgewezen: 'bg-red-100 text-red-800',
  verlopen: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  geaccepteerd: 'Geaccepteerd',
  afgewezen: 'Afgewezen',
  verlopen: 'Verlopen',
};

export default function OfferteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [offerte, setOfferte] = useState<Offerte | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getOfferte(id);
      setOfferte(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Offerte laden...</span>
        </div>
      </div>
    );
  }

  if (!offerte) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Offerte niet gevonden</h2>
          <p className="text-gray-600 mb-4">Deze offerte bestaat niet of je hebt er geen toegang toe.</p>
          <Button asChild>
            <Link href="/factuur/offertes">Terug naar Offertes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const calculation = calculateInvoice(offerte.items);

  // Build invoice-compatible object for preview and PDF
  const invoiceForPreview = {
    id: offerte.id,
    invoiceNumber: offerte.offerteNumber,
    date: offerte.date,
    dueDate: offerte.validUntil,
    company: offerte.company,
    client: offerte.client,
    items: offerte.items,
    status: 'concept' as const,
    notes: offerte.notes,
    template: (offerte.template || 'modern') as 'modern' | 'classic' | 'minimal',
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    const success = await updateOfferteStatus(offerte.id, newStatus as OfferteStatus);
    if (success) {
      setOfferte({ ...offerte, status: newStatus as OfferteStatus });
    }
    setUpdatingStatus(false);
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('Weet je zeker dat je deze offerte wilt omzetten naar een factuur? De offerte wordt gemarkeerd als "Geaccepteerd".')) {
      return;
    }
    setConverting(true);
    const invoiceId = await convertToInvoice(offerte.id);
    setConverting(false);

    if (invoiceId) {
      router.push('/factuur/invoices');
    } else {
      alert('Er is een fout opgetreden bij het omzetten naar een factuur.');
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch('/api/factuur/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForPreview),
      });

      if (!response.ok) throw new Error('PDF generatie mislukt');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${offerte.offerteNumber}.pdf`;
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

  const handleDelete = async () => {
    if (confirm(`Weet je zeker dat je offerte ${offerte.offerteNumber} wilt verwijderen?`)) {
      const success = await deleteOfferte(offerte.id);
      if (success) {
        router.push('/factuur/offertes');
      }
    }
  };

  const emailSubject = `Offerte ${offerte.offerteNumber} van ${offerte.company.name}`;
  const emailBody = `Beste ${offerte.client.name},

Hierbij ontvangt u offerte ${offerte.offerteNumber} van ${offerte.company.name}.

Offertegegevens:
- Offertenummer: ${offerte.offerteNumber}
- Datum: ${new Date(offerte.date).toLocaleDateString('nl-NL')}
- Geldig tot: ${new Date(offerte.validUntil).toLocaleDateString('nl-NL')}
- Totaalbedrag: ${formatCurrency(calculation.total)}

De offerte is als PDF bijgevoegd bij deze email.

Wij horen graag of u akkoord gaat met deze offerte. Neem gerust contact met ons op als u vragen heeft.

Met vriendelijke groet,
${offerte.company.name}`;

  const handleSendEmail = async () => {
    if (!offerte.client.email) {
      setEmailResult({ type: 'error', message: 'Vul eerst een email adres in bij de klantgegevens.' });
      return;
    }

    setSendingEmail(true);
    setEmailResult(null);

    try {
      const result = await sendInvoiceEmail(invoiceForPreview as any, offerte.client.email, emailSubject, emailBody);

      if (result.success) {
        setEmailResult({ type: 'success', message: 'Email is succesvol verstuurd!' });
        // Also update status to 'verzonden' if it was 'concept'
        if (offerte.status === 'concept') {
          await updateOfferteStatus(offerte.id, 'verzonden');
          setOfferte({ ...offerte, status: 'verzonden' });
        }
      } else {
        setEmailResult({ type: 'error', message: result.error || 'Email versturen mislukt.' });
      }
    } catch (err: any) {
      setEmailResult({ type: 'error', message: `Onverwachte fout: ${err.message}` });
    } finally {
      setSendingEmail(false);
    }
  };

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
            <div>
              <h1 className="text-2xl font-bold">{offerte.offerteNumber}</h1>
              <p className="text-sm text-gray-600">
                {offerte.client.name} - {formatDate(offerte.date)}
              </p>
            </div>
            <Badge className={statusColors[offerte.status]}>
              {statusLabels[offerte.status]}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleGeneratePdf} disabled={generatingPdf}>
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PDF
            </Button>
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            {!offerte.convertedInvoiceId && offerte.status !== 'afgewezen' && offerte.status !== 'verlopen' && (
              <Button onClick={handleConvertToInvoice} disabled={converting}>
                {converting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Converteer naar Factuur
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={offerte.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="verzonden">Verzonden</SelectItem>
                    <SelectItem value="geaccepteerd">Geaccepteerd</SelectItem>
                    <SelectItem value="afgewezen">Afgewezen</SelectItem>
                    <SelectItem value="verlopen">Verlopen</SelectItem>
                  </SelectContent>
                </Select>
                {updatingStatus && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Status bijwerken...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offerte Info */}
            <Card>
              <CardHeader>
                <CardTitle>Offertegegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nummer</span>
                  <span className="font-medium">{offerte.offerteNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Datum</span>
                  <span>{formatDate(offerte.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Geldig tot</span>
                  <span>{formatDate(offerte.validUntil)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotaal</span>
                  <span>{formatCurrency(calculation.subtotal)}</span>
                </div>
                {calculation.btw21 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">BTW 21%</span>
                    <span>{formatCurrency(calculation.btw21)}</span>
                  </div>
                )}
                {calculation.btw9 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">BTW 9%</span>
                    <span>{formatCurrency(calculation.btw9)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Totaal</span>
                  <span>{formatCurrency(calculation.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Klant</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{offerte.client.name}</p>
                <p className="text-gray-600">{offerte.client.address}</p>
                {offerte.client.email && <p className="text-gray-600">{offerte.client.email}</p>}
                {offerte.client.kvk && <p className="text-gray-600">KvK: {offerte.client.kvk}</p>}
                {offerte.client.btwNumber && <p className="text-gray-600">BTW: {offerte.client.btwNumber}</p>}
              </CardContent>
            </Card>

            {/* Converted Invoice Link */}
            {offerte.convertedInvoiceId && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Omgezet naar Factuur</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    {offerte.convertedAt && `Op ${formatDate(offerte.convertedAt)}`}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/factuur/invoices">
                      <FileText className="h-4 w-4 mr-2" />
                      Bekijk Factuur
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {offerte.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{offerte.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Delete */}
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
            >
              Offerte Verwijderen
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Offerte Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <InvoicePreview invoice={invoiceForPreview} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="mx-4 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Offerte Versturen</DialogTitle>
            <DialogDescription>
              Zo ziet de email eruit die naar de klant wordt verstuurd
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-gray-600">Naar:</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded border">
                {offerte.client.email || 'Geen email adres ingevuld'}
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
                  <div className="font-medium text-sm">{offerte.offerteNumber}.pdf</div>
                  <div className="text-xs text-gray-500">PDF Offerte</div>
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
                disabled={sendingEmail || !offerte.client.email}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
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
