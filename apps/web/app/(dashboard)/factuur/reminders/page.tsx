'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Bell, Send, Loader2, FileText, AlertTriangle, CheckCircle2, AlertCircle, Clock,
  Mail, ArrowLeft,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/factuur/invoice-utils';
import {
  getOverdueInvoices,
  sendReminder,
  sendAllReminders,
  getRemindersHistory,
  type OverdueInvoice,
} from '@/lib/factuur/reminder-actions';

export default function RemindersPage() {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [history, setHistory] = useState<{
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    lastReminderSentAt: string;
    reminderCount: number;
    total: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'history'>('overdue');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [overdueData, historyData] = await Promise.all([
      getOverdueInvoices(),
      getRemindersHistory(),
    ]);
    setOverdueInvoices(overdueData);
    setHistory(historyData);
    setLoading(false);
  }

  const handleSendReminder = async (invoiceId: string) => {
    setSendingId(invoiceId);
    setResult(null);
    const res = await sendReminder(invoiceId);
    setSendingId(null);

    if (res.success) {
      setResult({ type: 'success', message: 'Herinnering succesvol verstuurd!' });
      await loadData();
    } else {
      setResult({ type: 'error', message: res.error || 'Versturen mislukt.' });
    }
  };

  const handleSendAll = async () => {
    if (!confirm(`Weet je zeker dat je herinneringen wilt sturen voor alle ${overdueInvoices.length} verlopen facturen?`)) {
      return;
    }

    setSendingAll(true);
    setResult(null);
    const res = await sendAllReminders();
    setSendingAll(false);

    if (res.sent > 0 || res.failed === 0) {
      setResult({
        type: 'success',
        message: `${res.sent} herinnering(en) verstuurd${res.failed > 0 ? `, ${res.failed} mislukt` : ''}.`,
      });
    } else {
      setResult({
        type: 'error',
        message: `Alle ${res.failed} herinneringen mislukt. ${res.errors[0] || ''}`,
      });
    }
    await loadData();
  };

  const getDaysOverdueColor = (days: number) => {
    if (days >= 30) return 'text-red-600';
    if (days >= 14) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days >= 30) return 'bg-red-100 text-red-800';
    if (days >= 14) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/factuur">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-orange-600" />
              <h1 className="text-2xl font-bold">Betalingsherinneringen</h1>
            </div>
            {overdueInvoices.length > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {overdueInvoices.length} verlopen
              </Badge>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/factuur/invoices">Facturen</Link>
            </Button>
            {overdueInvoices.length > 0 && (
              <Button onClick={handleSendAll} disabled={sendingAll}>
                {sendingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Stuur Alle Herinneringen
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Result Alert */}
        {result && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg border mb-6 ${
              result.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span>{result.message}</span>
            <button
              className="ml-auto text-sm underline"
              onClick={() => setResult(null)}
            >
              Sluiten
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Verlopen Facturen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overdueInvoices.length}</div>
              <p className="text-sm text-gray-600 mt-1">onbetaalde facturen na vervaldatum</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Totaal Openstaand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
              <p className="text-sm text-gray-600 mt-1">te ontvangen bedrag</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Herinneringen Verstuurd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {history.reduce((sum, h) => sum + h.reminderCount, 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">totaal verstuurd</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'overdue' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overdue')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Verlopen Facturen ({overdueInvoices.length})
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Geschiedenis ({history.length})
          </Button>
        </div>

        {/* Overdue Tab */}
        {activeTab === 'overdue' && (
          <Card>
            <CardHeader>
              <CardTitle>Verlopen Facturen</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Facturen laden...</span>
                </div>
              ) : overdueInvoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium">Geen verlopen facturen!</p>
                  <p className="text-sm mt-1">Alle facturen zijn op tijd betaald.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factuurnummer</TableHead>
                      <TableHead>Klant</TableHead>
                      <TableHead>Vervaldatum</TableHead>
                      <TableHead>Dagen Verlopen</TableHead>
                      <TableHead className="text-right">Bedrag</TableHead>
                      <TableHead>Laatste Herinnering</TableHead>
                      <TableHead className="text-right">Actie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div>{invoice.clientName}</div>
                            {invoice.clientEmail && (
                              <div className="text-xs text-gray-500">{invoice.clientEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <Badge className={getDaysOverdueBadge(invoice.daysOverdue)}>
                            {invoice.daysOverdue} dagen
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell>
                          {invoice.lastReminderSentAt ? (
                            <div className="text-sm">
                              <div>{formatDate(invoice.lastReminderSentAt)}</div>
                              <div className="text-xs text-gray-500">
                                {invoice.reminderCount}x verstuurd
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Nog niet verstuurd</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSendReminder(invoice.id)}
                            disabled={sendingId === invoice.id || !invoice.clientEmail}
                            title={!invoice.clientEmail ? 'Geen email adres' : undefined}
                          >
                            {sendingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Herinnering
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Verstuurde Herinneringen</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Laden...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Geen herinneringen verstuurd</p>
                  <p className="text-sm mt-1">Zodra je herinneringen verstuurt verschijnen ze hier.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factuurnummer</TableHead>
                      <TableHead>Klant</TableHead>
                      <TableHead className="text-right">Bedrag</TableHead>
                      <TableHead>Aantal Keer Verstuurd</TableHead>
                      <TableHead>Laatst Verstuurd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.invoiceId}>
                        <TableCell className="font-medium">{item.invoiceNumber}</TableCell>
                        <TableCell>{item.clientName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {item.reminderCount}x
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.lastReminderSentAt ? formatDate(item.lastReminderSentAt) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
