'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceTotal } from '@/lib/factuur/invoice-utils';
import { Invoice } from '@/lib/factuur/types/invoice';
import { getInvoices } from '@/lib/factuur/actions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getInvoices();
      setInvoices(data);
      setLoading(false);
    }
    load();
  }, []);

  // Calculate statistics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const thisMonthInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });

  const thisQuarterInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const quarter = Math.floor(currentMonth / 3);
    const invQuarter = Math.floor(invDate.getMonth() / 3);
    return invQuarter === quarter && invDate.getFullYear() === currentYear;
  });

  const thisYearInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate.getFullYear() === currentYear;
  });

  const monthlyRevenue = thisMonthInvoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const quarterlyRevenue = thisQuarterInvoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const yearlyRevenue = thisYearInvoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const outstandingAmount = invoices
    .filter(inv => inv.status === 'verzonden')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentYear, i, 1);
    const monthName = month.toLocaleDateString('nl-NL', { month: 'short' });
    const revenue = invoices
      .filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === i && invDate.getFullYear() === currentYear && inv.status === 'betaald';
      })
      .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

    return { month: monthName, revenue };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Dashboard laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/factuur/invoices">Facturen</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/factuur/clients">Klanten</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/factuur/recurring">Terugkerend</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/factuur/reports">Rapportages</Link>
            </Button>
            <Button asChild>
              <Link href="/factuur/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Factuur
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welkom terug!</h2>
          <p className="text-gray-600">Hier is een overzicht van je facturatie</p>
        </div>

        {/* Revenue Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Deze Maand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {thisMonthInvoices.filter(inv => inv.status === 'betaald').length} betaalde facturen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Dit Kwartaal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(quarterlyRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {thisQuarterInvoices.filter(inv => inv.status === 'betaald').length} betaalde facturen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Dit Jaar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(yearlyRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {thisYearInvoices.filter(inv => inv.status === 'betaald').length} betaalde facturen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Openstaand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(outstandingAmount)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {invoices.filter(inv => inv.status === 'verzonden').length} verzonden facturen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Omzet per Maand ({currentYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `\u20AC${value}`} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Maand: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recente Facturen</CardTitle>
              <Button variant="ghost" asChild>
                <Link href="/factuur/invoices">Bekijk Alle</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nog geen facturen. <Link href="/factuur/invoices/new" className="text-blue-600 hover:underline">Maak je eerste factuur</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-600">{invoice.client.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(getInvoiceTotal(invoice))}</div>
                        <div className="text-sm text-gray-600">{formatDate(invoice.date)}</div>
                      </div>
                      <Badge className={statusColors[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
