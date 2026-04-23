'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';
import {
  getRecurringInvoices,
  processRecurringInvoices,
  pauseRecurring,
  resumeRecurring,
  RecurringInvoiceData,
} from '@/lib/factuur/actions';

const statusColors: Record<string, string> = {
  concept: 'bg-gray-100 text-gray-800',
  verzonden: 'bg-blue-100 text-blue-800',
  betaald: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
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
    processed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getRecurringInvoices();
    setInvoices(data);
    setLoading(false);
  }

  async function handleProcess() {
    setProcessing(true);
    setProcessResult(null);
    const result = await processRecurringInvoices();
    setProcessResult(result);
    setProcessing(false);
    // Reload data to show updated state
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

  // Calculate stats
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
            <Link href="/factuur" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-gray-300">|</span>
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
              Verwerk Openstaande
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Process Result Banner */}
        {processResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              processResult.errors.length > 0
                ? 'bg-yellow-50 border-yellow-200'
                : processResult.processed > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {processResult.processed > 0
                    ? `${processResult.processed} factuur/facturen succesvol aangemaakt`
                    : 'Geen facturen om te verwerken'}
                </p>
                {processResult.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {processResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Actieve Recurring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRecurringInvoices}</div>
              <p className="text-sm text-gray-600 mt-1">terugkerende facturen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Maandelijks Inkomen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(monthlyRecurringRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">verwachte maandomzet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Te Verwerken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{dueCount}</div>
              <p className="text-sm text-gray-600 mt-1">facturen wachten op generatie</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Totaal Gegenereerd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalGeneratedCount}</div>
              <p className="text-sm text-gray-600 mt-1">facturen aangemaakt</p>
            </CardContent>
          </Card>
        </div>

        {/* Recurring Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Terugkerende Facturen</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Laden...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                {invoices.map((invoice) => {
                  const isExpanded = expandedId === invoice.id;
                  const isDue =
                    invoice.nextRecurringDate &&
                    new Date(invoice.nextRecurringDate) <= new Date();

                  return (
                    <div key={invoice.id} className="border rounded-lg">
                      {/* Main Row */}
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : invoice.id)
                        }
                      >
                        <div className="shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {invoice.invoiceNumber}
                            </span>
                            <Badge
                              className={
                                statusColors[invoice.status] || 'bg-gray-100'
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
                          <div className="text-sm text-gray-600 mt-1">
                            {invoice.clientName}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-medium">
                            {formatCurrency(invoice.total)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {invoice.nextRecurringDate
                              ? `Volgende: ${formatDate(invoice.nextRecurringDate)}`
                              : 'Geen volgende datum'}
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

                      {/* Expanded Content - Generated Invoices History */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Gegenereerde Facturen ({invoice.generatedInvoices.length})
                          </h4>
                          {invoice.generatedInvoices.length === 0 ? (
                            <p className="text-sm text-gray-500">
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
                                      {gen.invoiceNumber}
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
                                          'bg-gray-100'
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
      </div>

      {/* Resume Dialog */}
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
