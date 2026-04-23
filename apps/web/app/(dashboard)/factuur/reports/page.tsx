'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Loader2 } from 'lucide-react';
import { formatCurrency, getInvoiceTotal, calculateInvoice } from '@/lib/factuur/invoice-utils';
import { Invoice } from '@/lib/factuur/types/invoice';
import { getInvoices } from '@/lib/factuur/actions';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    async function load() {
      const data = await getInvoices();
      setAllInvoices(data);
      setLoading(false);
    }
    load();
  }, []);

  // Get available years from invoices
  const availableYears = [...new Set(allInvoices.map(inv => inv.date.split('-')[0]))].sort().reverse();
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  // Filter invoices by year and paid/sent status
  const yearInvoices = allInvoices.filter(inv => {
    const year = inv.date.split('-')[0];
    return year === selectedYear && (inv.status === 'betaald' || inv.status === 'verzonden');
  });

  const totalRevenue = yearInvoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    const monthInvoices = yearInvoices.filter(inv => inv.date.startsWith(`${selectedYear}-${month}`));
    const revenue = monthInvoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);
    return {
      month: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'][i],
      omzet: revenue,
    };
  });

  const clientRevenue = new Map<string, number>();
  yearInvoices.forEach(inv => {
    const current = clientRevenue.get(inv.client.name) || 0;
    clientRevenue.set(inv.client.name, current + getInvoiceTotal(inv));
  });
  const clientData = Array.from(clientRevenue.entries())
    .map(([name, omzet]) => ({ name, omzet }))
    .sort((a, b) => b.omzet - a.omzet);

  const btwTotals = { btw21: 0, btw9: 0, btw0: 0 };
  yearInvoices.forEach(inv => {
    const calc = calculateInvoice(inv.items);
    btwTotals.btw21 += calc.btw21;
    btwTotals.btw9 += calc.btw9;
    btwTotals.btw0 += calc.btw0;
  });

  const btwData = [
    { name: 'BTW 21%', value: btwTotals.btw21 },
    { name: 'BTW 9%', value: btwTotals.btw9 },
    { name: 'BTW 0%', value: btwTotals.btw0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExportCSV = () => {
    const headers = ['Factuurnummer', 'Datum', 'Klant', 'Bedrag', 'BTW', 'Totaal', 'Status'];
    const rows = yearInvoices.map(inv => {
      const calc = calculateInvoice(inv.items);
      return [
        inv.invoiceNumber,
        inv.date,
        inv.client.name,
        calc.subtotal.toFixed(2),
        calc.totalBtw.toFixed(2),
        calc.total.toFixed(2),
        inv.status,
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omzet-${selectedYear}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-muted-foreground">Rapportages laden...</span>
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
            <Link href="/dashboard" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">ZZP Factuur</span>
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-2xl font-bold">Jaaroverzicht</h1>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Jaar:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totale Omzet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-sm text-muted-foreground mt-1">{yearInvoices.length} facturen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">BTW 21%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(btwTotals.btw21)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">BTW 9%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(btwTotals.btw9)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aantal Klanten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clientRevenue.size}</div>
            </CardContent>
          </Card>
        </div>

        {yearInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Geen facturen gevonden voor {selectedYear}.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Omzet per Maand</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="omzet" fill="#3b82f6" name="Omzet" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Omzet per Klant</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={clientData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="omzet"
                      >
                        {clientData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* BTW Overview Table */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>BTW Overzicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {btwData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-lg font-bold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 pt-4 border-t-2">
                    <span className="font-bold text-lg">Totaal BTW</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(btwTotals.btw21 + btwTotals.btw9 + btwTotals.btw0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
