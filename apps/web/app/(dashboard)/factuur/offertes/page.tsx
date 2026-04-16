'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText, Loader2, FileCheck, Send, XCircle, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';
import { getOffertes, deleteOfferte, type Offerte, type OfferteStatus } from '@/lib/offerte/actions';

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

export default function OffertesPage() {
  const [offertes, setOffertes] = useState<Offerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OfferteStatus | 'all'>('all');

  useEffect(() => {
    loadOffertes();
  }, []);

  async function loadOffertes() {
    setLoading(true);
    const data = await getOffertes();
    setOffertes(data);
    setLoading(false);
  }

  const filteredOffertes = statusFilter === 'all'
    ? offertes
    : offertes.filter(off => off.status === statusFilter);

  const handleDelete = async (offerte: Offerte) => {
    if (confirm(`Weet je zeker dat je offerte ${offerte.offerteNumber} wilt verwijderen?`)) {
      const success = await deleteOfferte(offerte.id);
      if (success) {
        setOffertes(offertes.filter(off => off.id !== offerte.id));
      }
    }
  };

  const conceptCount = offertes.filter(off => off.status === 'concept').length;
  const verzondenCount = offertes.filter(off => off.status === 'verzonden').length;
  const geaccepteerdTotal = offertes
    .filter(off => off.status === 'geaccepteerd')
    .reduce((sum, off) => sum + off.total, 0);
  const openTotal = offertes
    .filter(off => off.status === 'verzonden')
    .reduce((sum, off) => sum + off.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/factuur" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-2xl font-bold">Offertes</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/factuur/invoices">Facturen</Link>
            </Button>
            <Button asChild>
              <Link href="/factuur/offertes/new">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Offerte
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Concepten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{conceptCount}</div>
              <p className="text-sm text-gray-600 mt-1">nog te verzenden</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Verzonden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{verzondenCount}</div>
              <p className="text-sm text-gray-600 mt-1">{formatCurrency(openTotal)} openstaand</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Geaccepteerd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(geaccepteerdTotal)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {offertes.filter(off => off.status === 'geaccepteerd').length} offertes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Totaal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{offertes.length}</div>
              <p className="text-sm text-gray-600 mt-1">offertes dit jaar</p>
            </CardContent>
          </Card>
        </div>

        {/* Offertes Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Alle Offertes</CardTitle>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600">Filter op status:</span>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="verzonden">Verzonden</SelectItem>
                    <SelectItem value="geaccepteerd">Geaccepteerd</SelectItem>
                    <SelectItem value="afgewezen">Afgewezen</SelectItem>
                    <SelectItem value="verlopen">Verlopen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Offertes laden...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offertenummer</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Geldig tot</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffertes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {statusFilter !== 'all'
                          ? 'Geen offertes met deze status'
                          : 'Nog geen offertes. Maak je eerste offerte!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOffertes.map((offerte) => (
                      <TableRow key={offerte.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/factuur/offertes/${offerte.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {offerte.offerteNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{offerte.client.name || '-'}</TableCell>
                        <TableCell>{formatDate(offerte.date)}</TableCell>
                        <TableCell>{formatDate(offerte.validUntil)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(offerte.total)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[offerte.status]}>
                            {statusLabels[offerte.status]}
                          </Badge>
                          {offerte.convertedInvoiceId && (
                            <Badge className="bg-purple-100 text-purple-800 ml-2">
                              Gefactureerd
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/factuur/offertes/${offerte.id}`}>
                                Bekijk
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(offerte)}
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
