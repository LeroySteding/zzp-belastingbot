'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Link2,
  Plug,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';
import { getInvoices } from '@/lib/factuur/actions';
import { Invoice } from '@/lib/factuur/types/invoice';

// ---------------------------------------------------------------------------
// Types for the API response
// ---------------------------------------------------------------------------

interface PaymentMatch {
  id: string;
  invoice_id: string | null;
  provider: string;
  external_id: string | null;
  amount: number;
  status: 'matched' | 'unmatched' | 'ignored';
  payment_date: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  invoices: {
    id: string;
    invoice_number: string;
    total: number;
    status: string;
  } | null;
}

interface Stats {
  total: number;
  matched: number;
  unmatched: number;
  ignored: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<PaymentMatch[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, matched: 0, unmatched: 0, ignored: 0 });
  const [openInvoices, setOpenInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mollieRes, invoices] = await Promise.all([
        fetch('/api/integrations/mollie'),
        getInvoices(),
      ]);

      const mollieData = await mollieRes.json();

      setConfigured(mollieData.configured ?? false);
      setMatches(mollieData.matches || []);
      setStats(mollieData.stats || { total: 0, matched: 0, unmatched: 0, ignored: 0 });

      // Open invoices for the manual match dropdown
      setOpenInvoices(
        invoices.filter(
          (inv) => inv.status === 'verzonden' || inv.status === 'concept',
        ),
      );
    } catch {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trigger sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/integrations/mollie', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.message || 'Synchronisatie voltooid');
      setLastSyncTime(new Date().toLocaleTimeString('nl-NL'));
      await fetchData();
    } catch (err: any) {
      setSyncMessage(`Fout: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Manual match
  const handleManualMatch = async (paymentMatchId: string, invoiceId: string) => {
    try {
      const res = await fetch('/api/integrations/mollie', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMatchId, invoiceId, action: 'match' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        alert(data.error || 'Er is een fout opgetreden');
      }
    } catch {
      alert('Er is een fout opgetreden bij het matchen');
    }
  };

  // Ignore payment
  const handleIgnore = async (paymentMatchId: string) => {
    try {
      const res = await fetch('/api/integrations/mollie', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMatchId, action: 'ignore' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch {
      alert('Er is een fout opgetreden');
    }
  };

  // ---------- Render helpers ----------

  const statusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gematcht
          </Badge>
        );
      case 'unmatched':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Niet gematcht
          </Badge>
        );
      case 'ignored':
        return (
          <Badge className="bg-muted text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Genegeerd
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-muted-foreground">Integraties laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/factuur" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-2xl font-bold">Integraties</h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/factuur">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/factuur/invoices">Facturen</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Mollie Betalingen
              </CardTitle>
              {configured ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verbonden
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Niet geconfigureerd
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!configured ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Om Mollie te koppelen moet je de <code className="bg-muted px-2 py-0.5 rounded text-sm">MOLLIE_API_KEY</code>{' '}
                  environment variable instellen op je server.
                </p>
                <div className="bg-muted/50 border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Stappen om te verbinden:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>
                      Log in op je{' '}
                      <a
                        href="https://www.mollie.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Mollie Dashboard
                      </a>
                    </li>
                    <li>
                      Ga naar <strong>Developers &gt; API keys</strong>
                    </li>
                    <li>Kopieer je Live of Test API key</li>
                    <li>
                      Voeg de key toe als <code className="bg-muted px-1 py-0.5 rounded">MOLLIE_API_KEY</code> in
                      je <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> bestand
                    </li>
                    <li>Herstart de applicatie</li>
                  </ol>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Webhook URL:</strong> Stel de volgende webhook URL in bij Mollie om
                    automatisch betalingen te ontvangen:
                  </p>
                  <code className="text-sm bg-blue-100 px-2 py-1 rounded mt-2 block">
                    https://jouw-domein.nl/api/integrations/mollie/webhook
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      Mollie is verbonden. Klik op &quot;Synchroniseer&quot; om recente betalingen
                      op te halen en automatisch te matchen met openstaande facturen.
                    </p>
                    {lastSyncTime && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Laatste synchronisatie: {lastSyncTime}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleSync} disabled={syncing}>
                    {syncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Synchroniseer betalingen
                  </Button>
                </div>
                {syncMessage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{syncMessage}</p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Webhook URL:</strong> Voor automatische updates, stel deze webhook URL
                    in bij Mollie:
                  </p>
                  <code className="text-sm bg-blue-100 px-2 py-1 rounded mt-2 block">
                    https://jouw-domein.nl/api/integrations/mollie/webhook
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {configured && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Totaal betalingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Gematcht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.matched}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Niet gematcht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.unmatched}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  Genegeerd
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-muted-foreground">{stats.ignored}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Matches Table */}
        {configured && matches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Recente Mollie Betalingen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Factuur</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {match.payment_date
                          ? formatDate(match.payment_date)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {match.description || '-'}
                        </div>
                        {match.external_id && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {match.external_id}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(match.amount))}
                      </TableCell>
                      <TableCell>{statusBadge(match.status)}</TableCell>
                      <TableCell>
                        {match.status === 'matched' && match.invoices ? (
                          <span className="text-sm font-medium text-green-700">
                            {match.invoices.invoice_number}
                          </span>
                        ) : match.status === 'unmatched' ? (
                          <Select
                            onValueChange={(invoiceId) =>
                              handleManualMatch(match.id, invoiceId)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Kies factuur..." />
                            </SelectTrigger>
                            <SelectContent>
                              {openInvoices.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {inv.invoiceNumber} - {formatCurrency(
                                    inv.items.reduce(
                                      (sum, item) =>
                                        sum +
                                        item.quantity * item.unitPrice * (1 + item.btwRate / 100),
                                      0,
                                    ),
                                  )}
                                </SelectItem>
                              ))}
                              {openInvoices.length === 0 && (
                                <SelectItem value="none" disabled>
                                  Geen openstaande facturen
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {match.status === 'unmatched' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIgnore(match.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Negeer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {configured && matches.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 text-border" />
                <p className="text-lg font-medium mb-2">Nog geen betalingen gesynchroniseerd</p>
                <p className="text-sm mb-4">
                  Klik op &quot;Synchroniseer betalingen&quot; om je Mollie betalingen op te halen.
                </p>
                <Button onClick={handleSync} disabled={syncing}>
                  {syncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Synchroniseer betalingen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
