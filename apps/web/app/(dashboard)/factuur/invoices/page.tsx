'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Copy, Trash2, FileText, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceTotal } from '@/lib/factuur/invoice-utils';
import { Invoice, InvoiceStatus } from '@/lib/factuur/types/invoice';
import { getInvoices, deleteInvoiceAction, duplicateInvoiceAction } from '@/lib/factuur/actions';

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  useEffect(() => {
    loadInvoices();
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

  const handleDownload = (invoiceNumber: string) => {
    alert(`PDF downloaden van factuur ${invoiceNumber}`);
  };

  const sentTotal = invoices
    .filter(inv => inv.status === 'verzonden')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const paidTotal = invoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const draftCount = invoices.filter(inv => inv.status === 'concept').length;

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
            <h1 className="text-2xl font-bold">Facturen</h1>
          </div>
          <Button asChild>
            <Link href="/factuur/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Factuur
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Verzonden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(sentTotal)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {invoices.filter(inv => inv.status === 'verzonden').length} facturen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Betaald</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(paidTotal)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {invoices.filter(inv => inv.status === 'betaald').length} facturen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Concepten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{draftCount}</div>
              <p className="text-sm text-gray-600 mt-1">nog te verzenden</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Alle Facturen</CardTitle>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600">Filter op status:</span>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-40">
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Facturen laden...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factuurnummer</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Vervaldatum</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {statusFilter !== 'all' ? 'Geen facturen met deze status' : 'Nog geen facturen. Maak je eerste factuur!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.client.name}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getInvoiceTotal(invoice))}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge className={statusColors[invoice.status]}>
                              {statusLabels[invoice.status]}
                            </Badge>
                            {invoice.recurring && (
                              <Badge className="bg-purple-100 text-purple-800">
                                Terugkerend
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(invoice.invoiceNumber)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(invoice)}
                              title="Dupliceren"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(invoice)}
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
    </div>
  );
}
