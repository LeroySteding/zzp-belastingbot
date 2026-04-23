'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  FileText,
  Loader2,
  RefreshCw,
  Pause,
  Play,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  Calendar,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';
import {
  getRecurringInvoices,
  pauseRecurring,
  resumeRecurring,
  RecurringInvoiceData,
} from '@/lib/factuur/actions';
import {
  processRecurringInvoices as processRecurring,
  getRecurringInvoicesSummary,
} from '@/lib/factuur/recurring-processor';

const statusColors: Record<string, string> = {
  concept: 'bg-muted text-foreground',
  verzonden: 'bg-blue-100 text-blue-800',
  betaald: 'bg-green-100 text-green-800',
  verlopen: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
  verlopen: 'Verlopen',
};

const frequencyLabels: Record<string, string> = {
  maandelijks: 'Maandelijks',
  kwartaal: 'Per kwartaal',
};

export default function RecurringInvoicesPage() {
  const [invoices, setInvoices] = useState<RecurringInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resumeDialogId, setResumeDialogId] = useState<string | null>(null);
  const [resumeFrequency, setResumeFrequency] = useState<'maandelijks' | 'kwartaal'>('maandelijks');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    dueNow: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [data, summaryData] = await Promise.all([
      getRecurringInvoices(),
      getRecurringInvoicesSummary(),
    ]);
    setInvoices(data);
    setSummary(summaryData);
    setLoading(false);
  }

  async function handleProcess() {
    setProcessing(true);
    setProcessResult(null);
    const result = await processRecurring();
    setProcessResult(result);
    setProcessing(false);
    await loadData();
  }

  async function handlePause(id: string) {
    setActionLoading(id);
    const success = await pauseRecurring(id);
    if (success) {
      await loadData();
    }
    setActionLoading(null);
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    const success = await resumeRecurring(id, resumeFrequency);
    if (success) {
      setResumeDialogId(null);
      await loadData();
    }
    setActionLoading(null);
  }

  // Bereken statistieken
  const monthlyRecurringRevenue = invoices.reduce((sum, inv) => {
    if (inv.recurringFrequency === 'maandelijks') {
      return sum + inv.total;
    } else if (inv.recurringFrequency === 'kwartaal') {
      return sum + inv.total / 3;
    }
    return sum;
  }, 0);

  const totalRecurringInvoices = invoices.length;

  const dueCount = invoices.filter((inv) => {
    if (!inv.nextRecurringDate) return false;
    return new Date(inv.nextRecurringDate) <= new Date();
  }).length;

  const totalGeneratedCount = invoices.reduce(
    (sum, inv) => sum + inv.generatedInvoices.length,
    0
  );

  // Sorteer: te verwerken facturen bovenaan
  const sortedInvoices = [...invoices].sort((a, b) => {
    const aDue = a.nextRecurringDate && new Date(a.nextRecurringDate) <= new Date();
    const bDue = b.nextRecurringDate && new Date(b.nextRecurringDate) <= new Date();
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    if (a.nextRecurringDate && b.nextRecurringDate) {
      return new Date(a.nextRecurringDate).getTime() - new Date(b.nextRecurringDate).getTime();
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild aria-label="Terug naar facturen">
              <Link href="/factuur/invoices">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Link href="/factuur" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-2xl font-bold">Terugkerende Facturen</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/factuur/invoices">Alle Facturen</Link>
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Genereer nu
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Waarschuwing: te verwerken facturen */}
        {dueCount > 0 && !processResult && (
          <div className="mb-6 p-4 rounded-lg border bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-900">
                  {dueCount} {dueCount === 1 ? 'factuur wacht' : 'facturen wachten'} op generatie
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Klik op &quot;Genereer nu&quot; om deze facturen automatisch aan te maken als concept.
                </p>
              </div>
              <Button onClick={handleProcess} disabled={processing} size="sm" variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100">
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Genereer nu
              </Button>
            </div>
          </div>
        )}

        {/* Resultaat banner */}
        {processResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              processResult.errors.length > 0
                ? 'bg-yellow-50 border-yellow-200'
                : processResult.created > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {processResult.errors.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                ) : processResult.created > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Info className="h-5 w-5 text-blue-600 shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {processResult.created > 0
                      ? `${processResult.created} ${processResult.created === 1 ? 'factuur' : 'facturen'} succesvol aangemaakt als concept`
                      : 'Geen facturen om te verwerken'}
                  </p>
                  {processResult.created > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      De nieuwe facturen zijn aangemaakt als concept. Controleer en verstuur ze via het facturenoverzicht.
                    </p>
                  )}
                  {processResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {processResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProcessResult(null)}
              >
                Sluiten
              </Button>
            </div>
          </div>
        )}

        {/* Statistieken */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Actieve Recurring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRecurringInvoices}</div>
              <p className="text-sm text-muted-foreground mt-1">terugkerende facturen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Maandelijks Inkomen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(monthlyRecurringRevenue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">verwachte maandomzet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Te Verwerken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${dueCount > 0 ? 'text-orange-600' : 'text-foreground'}`}>
                {dueCount}
              </div>
              <p className="text-sm text-muted-foreground mt-1">facturen wachten op generatie</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Totaal Gegenereerd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalGeneratedCount}</div>
              <p className="text-sm text-muted-foreground mt-1">facturen aangemaakt</p>
            </CardContent>
          </Card>
        </div>

        {/* Terugkerende facturen tabel */}
        <Card>
          <CardHeader>
            <CardTitle>Terugkerende Facturen</CardTitle>
            <CardDescription>
              Overzicht van alle terugkerende facturen en hun generatiestatus. Facturen die klaar zijn voor generatie staan bovenaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Laden...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-border" />
                <p className="text-lg font-medium mb-2">
                  Geen terugkerende facturen
                </p>
                <p className="text-sm mb-4">
                  Maak een factuur met terugkerende frequentie aan om hier te
                  beginnen.
                </p>
                <Button asChild>
                  <Link href="/factuur/invoices/new">Nieuwe Factuur</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedInvoices.map((invoice) => {
                  const isExpanded = expandedId === invoice.id;
                  const isDue =
                    invoice.nextRecurringDate &&
                    new Date(invoice.nextRecurringDate) <= new Date();

                  // Bereken dagen tot volgende generatie
                  let daysUntilNext: number | null = null;
                  if (invoice.nextRecurringDate) {
                    const nextDate = new Date(invoice.nextRecurringDate);
                    const today = new Date();
                    daysUntilNext = Math.ceil(
                      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                  }

                  return (
                    <div key={invoice.id} className={`border rounded-lg ${isDue ? 'border-orange-300 bg-orange-50/30' : ''}`}>
                      {/* Hoofdrij */}
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : invoice.id)
                        }
                      >
                        <div className="shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {invoice.invoiceNumber}
                            </span>
                            <Badge
                              className={
                                statusColors[invoice.status] || 'bg-muted'
                              }
                            >
                              {statusLabels[invoice.status] || invoice.status}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800">
                              {frequencyLabels[invoice.recurringFrequency] ||
                                invoice.recurringFrequency}
                            </Badge>
                            {isDue && (
                              <Badge className="bg-orange-100 text-orange-800">
                                Te verwerken
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {invoice.clientName}
                            {invoice.generatedInvoices.length > 0 && (
                              <span className="text-muted-foreground ml-2">
                                -- {invoice.generatedInvoices.length} keer gegenereerd
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-medium">
                            {formatCurrency(invoice.total)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isDue ? (
                              <span className="text-orange-700 font-medium">Klaar voor generatie</span>
                            ) : invoice.nextRecurringDate ? (
                              <>
                                Volgende: {formatDate(invoice.nextRecurringDate)}
                                {daysUntilNext !== null && daysUntilNext > 0 && (
                                  <span className="text-muted-foreground ml-1">
                                    (over {daysUntilNext} {daysUntilNext === 1 ? 'dag' : 'dagen'})
                                  </span>
                                )}
                              </>
                            ) : (
                              'Geen volgende datum'
                            )}
                          </div>
                        </div>

                        <div
                          className="flex gap-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePause(invoice.id)}
                            disabled={actionLoading === invoice.id}
                            title="Pauzeren"
                          >
                            {actionLoading === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Uitgeklapte inhoud - Gegenereerde facturen geschiedenis */}
                      {isExpanded && (
                        <div className="border-t bg-muted/50 p-4">
                          <h4 className="text-sm font-medium text-foreground mb-3">
                            Gegenereerde Facturen ({invoice.generatedInvoices.length})
                          </h4>
                          {invoice.generatedInvoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Nog geen facturen gegenereerd vanuit deze
                              terugkerende factuur.
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Factuurnummer</TableHead>
                                  <TableHead>Datum</TableHead>
                                  <TableHead className="text-right">
                                    Bedrag
                                  </TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {invoice.generatedInvoices.map((gen) => (
                                  <TableRow key={gen.id}>
                                    <TableCell className="font-medium">
                                      <Link
                                        href={`/factuur/invoices/${gen.id}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {gen.invoiceNumber}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(gen.date)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(gen.total)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={
                                          statusColors[gen.status] ||
                                          'bg-muted'
                                        }
                                      >
                                        {statusLabels[gen.status] || gen.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informatie kaart */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">
                  Hoe werken terugkerende facturen?
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>-- Maak een factuur aan met een terugkerende frequentie (maandelijks of per kwartaal)</li>
                  <li>-- Wanneer de volgende datum bereikt is, verschijnt de factuur als &quot;Te verwerken&quot;</li>
                  <li>-- Klik op &quot;Genereer nu&quot; om automatisch nieuwe conceptfacturen aan te maken</li>
                  <li>-- Nieuwe facturen worden aangemaakt als concept, zodat je ze kunt controleren voor verzending</li>
                  <li>-- De volgende generatiedatum wordt automatisch doorgeschoven</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hervatten dialoog */}
      <Dialog
        open={resumeDialogId !== null}
        onOpenChange={(open) => {
          if (!open) setResumeDialogId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terugkerende factuur hervatten</DialogTitle>
            <DialogDescription>
              Kies de frequentie waarmee deze factuur opnieuw gegenereerd moet
              worden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Frequentie</label>
              <Select
                value={resumeFrequency}
                onValueChange={(v) =>
                  setResumeFrequency(v as 'maandelijks' | 'kwartaal')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maandelijks">Maandelijks</SelectItem>
                  <SelectItem value="kwartaal">Per kwartaal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setResumeDialogId(null)}
              >
                Annuleren
              </Button>
              <Button
                onClick={() => resumeDialogId && handleResume(resumeDialogId)}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Hervatten
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
