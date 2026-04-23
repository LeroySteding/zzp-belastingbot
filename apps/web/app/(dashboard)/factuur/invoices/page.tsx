'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Copy, Trash2, FileText, Loader2, RotateCcw, LinkIcon, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getInvoiceTotal } from '@/lib/factuur/invoice-utils';
import { Invoice, InvoiceStatus } from '@/lib/factuur/types/invoice';
import { getInvoices, deleteInvoiceAction, duplicateInvoiceAction } from '@/lib/factuur/actions';
import { getOrCreatePaymentLink, isMollieConfigured } from '@/lib/factuur/payment-actions';

const statusColors: Record<string, string> = {
  concept: 'bg-muted text-foreground',
  verzonden: 'bg-blue-100 text-blue-800',
  betaald: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [mollieEnabled, setMollieEnabled] = useState(false);
  const [creatingLink, setCreatingLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
    isMollieConfigured().then(setMollieEnabled);
  }, []);

  async function loadInvoices() {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  }

  const filteredInvoices = statusFilter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === statusFilter);

  const handleDuplicate = async (invoice: Invoice) => {
    const newId = await duplicateInvoiceAction(invoice.id);
    if (newId) {
      await loadInvoices();
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (confirm(`Weet je zeker dat je factuur ${invoice.invoiceNumber} wilt verwijderen?`)) {
      const success = await deleteInvoiceAction(invoice.id);
      if (success) {
        setInvoices(invoices.filter(inv => inv.id !== invoice.id));
      }
    }
  };

  const handlePaymentLink = async (invoice: Invoice) => {
    setCreatingLink(invoice.id);
    try {
      const result = await getOrCreatePaymentLink(invoice.id);
      if (result.url) {
        await navigator.clipboard.writeText(result.url);
        setLinkCopied(invoice.id);
        setTimeout(() => setLinkCopied(null), 3000);
      } else {
        alert(result.error || 'Kon geen betaallink aanmaken.');
      }
    } catch {
      alert('Er is een fout opgetreden bij het aanmaken van de betaallink.');
    } finally {
      setCreatingLink(null);
    }
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (invoice: Invoice) => {
    setDownloading(invoice.id);
    try {
      const response = await fetch(`/api/factuur/pdf?id=${invoice.id}&type=invoice`);

      if (!response.ok) {
        throw new Error('PDF generatie mislukt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Er is een fout opgetreden bij het downloaden van de PDF.');
    } finally {
      setDownloading(null);
    }
  };

  const sentTotal = invoices
    .filter(inv => inv.status === 'verzonden')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const paidTotal = invoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const draftCount = invoices.filter(inv => inv.status === 'concept').length;

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <h1 className="text-xl sm:text-2xl font-bold">Facturen</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/api/export/invoices" download className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporteer</span> CSV
            </a>
            <Button variant="outline" size="sm" asChild>
              <Link href="/factuur/recurring">
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Terugkerend</span>
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/factuur/invoices/new">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nieuwe Factuur</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Verzonden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(sentTotal)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {invoices.filter(inv => inv.status === 'verzonden').length} facturen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Betaald</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(paidTotal)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {invoices.filter(inv => inv.status === 'betaald').length} facturen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concepten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{draftCount}</div>
              <p className="text-sm text-muted-foreground mt-1">nog te verzenden</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle>Alle Facturen</CardTitle>
              <div className="flex gap-2 sm:gap-4 items-center">
                <span className="text-sm text-muted-foreground hidden sm:inline">Filter op status:</span>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-36 sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="verzonden">Verzonden</SelectItem>
                    <SelectItem value="betaald">Betaald</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-4">
                <TableSkeleton rows={5} />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factuurnummer</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead className="hidden md:table-cell">Datum</TableHead>
                    <TableHead className="hidden md:table-cell">Vervaldatum</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        {statusFilter !== 'all' ? (
                          <div className="text-center py-8 text-muted-foreground">Geen facturen met deze status</div>
                        ) : (
                          <EmptyState
                            icon={FileText}
                            title="Nog geen facturen"
                            description="Maak je eerste factuur aan om te beginnen met factureren."
                            actionLabel="Nieuwe factuur"
                            actionHref="/factuur/invoices/new"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{invoice.client.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(invoice.date)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getInvoiceTotal(invoice))}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge className={statusColors[invoice.status]}>
                              {invoice.status === 'betaald' && (
                                <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                              )}
                              {statusLabels[invoice.status]}
                            </Badge>
                            {invoice.recurring && (
                              <Link href="/factuur/recurring">
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">
                                  Terugkerend
                                </Badge>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {mollieEnabled && invoice.status !== 'betaald' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePaymentLink(invoice)}
                                disabled={creatingLink === invoice.id}
                                aria-label={linkCopied === invoice.id ? 'Link gekopieerd!' : 'Betaallink kopiëren'}
                              >
                                {creatingLink === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : linkCopied === invoice.id ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                                ) : (
                                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(invoice)}
                              disabled={downloading === invoice.id}
                              aria-label="Download PDF"
                            >
                              {downloading === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <Download className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(invoice)}
                              aria-label="Dupliceren"
                            >
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(invoice)}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
