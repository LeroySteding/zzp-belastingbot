'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Calculator,
  TrendingUp,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import { formatEuro, getQuarterPeriod } from '@/lib/belasting/btw-calculations';
import { generateBTWAangifte, type BTWAangifteData } from '@/lib/belasting/btw-report';
import Link from 'next/link';

const deadlineData: Record<number, string> = {
  1: '30 april',
  2: '31 juli',
  3: '31 oktober',
  4: '31 januari (volgend jaar)',
};

export default function BTWAangiftePage() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter.toString());
  const [report, setReport] = useState<BTWAangifteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await generateBTWAangifte(
        parseInt(selectedYear),
        parseInt(selectedQuarter)
      );

      if (!result) {
        setError('Kon het rapport niet genereren. Controleer of je bent ingelogd.');
        return;
      }

      setReport(result);
      // Open alle secties standaard na generatie
      setExpandedSections({
        rubrieken: true,
        invoices21: false,
        invoices9: false,
        invoices0: false,
        expenses: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout bij genereren rapport');
    } finally {
      setLoading(false);
    }
  }

  function buildCSV(data: BTWAangifteData): string {
    const lines: string[] = [];
    lines.push(`BTW Aangifte ${data.period}`);
    lines.push(`Deadline: ${data.deadline}`);
    lines.push('');
    lines.push('RUBRIEKEN');
    lines.push('Rubriek,Omschrijving,Bedrag');
    lines.push(`1a,"${data.rubriek1a.description}","${data.rubriek1a.amount.toFixed(2)}"`);
    lines.push(`1b,"${data.rubriek1b.description}","${data.rubriek1b.amount.toFixed(2)}"`);
    lines.push(`1e,"${data.rubriek1e.description}","${data.rubriek1e.amount.toFixed(2)}"`);
    lines.push(`5a,"${data.rubriek5a.description}","${data.rubriek5a.amount.toFixed(2)}"`);
    lines.push(`5b,"${data.rubriek5b.description}","${data.rubriek5b.amount.toFixed(2)}"`);
    lines.push('');
    lines.push(`Te betalen / terug te vragen,"${data.totalOwed.toFixed(2)}"`);
    lines.push('');
    for (const [label, list] of [['21%', data.invoices21], ['9%', data.invoices9]] as const) {
      if (list.length > 0) {
        lines.push(`FACTUREN ${label} BTW`);
        lines.push('Factuurnummer,Klant,Subtotaal,BTW');
        for (const inv of list) lines.push(`"${inv.number}","${inv.client}","${inv.subtotal.toFixed(2)}","${inv.btw.toFixed(2)}"`);
        lines.push('');
      }
    }
    if (data.invoices0.length > 0) {
      lines.push('FACTUREN 0% BTW');
      lines.push('Factuurnummer,Klant,Subtotaal');
      for (const inv of data.invoices0) lines.push(`"${inv.number}","${inv.client}","${inv.subtotal.toFixed(2)}"`);
      lines.push('');
    }
    if (data.expenses.length > 0) {
      lines.push('UITGAVEN (VOORBELASTING)');
      lines.push('Datum,Omschrijving,Categorie,Bedrag excl.,BTW');
      for (const exp of data.expenses) lines.push(`"${exp.date}","${exp.description}","${exp.category}","${exp.amount.toFixed(2)}","${exp.btw.toFixed(2)}"`);
    }
    return lines.join('\n');
  }

  function handleExportCSV() {
    if (!report) return;
    const csv = buildCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `btw-aangifte-${report.period.replace(' ', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getUrgencyStyles(urgency: 'green' | 'orange' | 'red') {
    switch (urgency) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  }

  function getUrgencyIcon(urgency: 'green' | 'orange' | 'red') {
    switch (urgency) {
      case 'green':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'orange':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'red':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Terug naar belasting">
          <Link href="/belasting/reports">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">BTW-aangifte</h1>
          <p className="text-muted-foreground mt-1">
            Genereer een volledig BTW-aangifte overzicht per kwartaal met omzet en voorbelasting
          </p>
        </div>
      </div>

      {/* Foutmelding */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Fout</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kwartaal selectie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            BTW-aangifte genereren
          </CardTitle>
          <CardDescription>
            Selecteer een jaar en kwartaal om een compleet BTW-aangifte overzicht te genereren op basis van je betaalde facturen en geregistreerde uitgaven.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jaar
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kwartaal
                </label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((q) => (
                      <SelectItem key={q} value={q.toString()}>
                        Q{q} - {getQuarterPeriod(parseInt(selectedYear), q)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deadline informatie */}
            <div className="bg-muted/50 border rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Deadline BTW-aangifte Q{selectedQuarter} {selectedYear}:
                </span>
                <span className="font-medium text-foreground">
                  {deadlineData[parseInt(selectedQuarter)]} {parseInt(selectedQuarter) === 4 ? parseInt(selectedYear) + 1 : selectedYear}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 md:flex-none"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Bezig met genereren...' : 'Genereer BTW-aangifte'}
              </Button>

              {report && (
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporteer CSV
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rapport resultaat */}
      {report && (
        <>
          {/* Deadline banner */}
          <div className={`p-4 rounded-lg border ${getUrgencyStyles(report.deadlineUrgency)}`}>
            <div className="flex items-center gap-3">
              {getUrgencyIcon(report.deadlineUrgency)}
              <div>
                <p className="font-medium">
                  Deadline BTW-aangifte {report.period}: {report.deadline}
                </p>
                <p className="text-sm mt-0.5">
                  {report.deadlineDaysRemaining > 0
                    ? `Nog ${report.deadlineDaysRemaining} ${report.deadlineDaysRemaining === 1 ? 'dag' : 'dagen'} tot de deadline`
                    : 'De deadline is verstreken'}
                </p>
              </div>
            </div>
          </div>

          {/* Samenvatting kaarten */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Totale omzet</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {formatEuro(report.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{report.invoiceCount} facturen</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Verschuldigde BTW</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatEuro(report.rubriek5a.amount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Rubriek 5a</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">Voorbelasting</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {formatEuro(report.rubriek5b.amount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{report.expenseCount} uitgaven</p>
              </CardContent>
            </Card>

            <Card className={report.totalOwed >= 0 ? 'border-red-200' : 'border-green-200'}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {report.totalOwed >= 0 ? 'Te betalen' : 'Terug te vragen'}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${report.totalOwed >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatEuro(Math.abs(report.totalOwed))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">5a - 5b = saldo</p>
              </CardContent>
            </Card>
          </div>

          {/* Rubrieken overzicht */}
          <Card>
            <CardHeader>
              <CardTitle>BTW-rubrieken</CardTitle>
              <CardDescription>
                Overzicht conform het aangifteformulier van de Belastingdienst
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Rubriek 1a */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm font-bold text-muted-foreground mr-3">1a</span>
                    <span className="text-sm">{report.rubriek1a.description} (21%)</span>
                  </div>
                  <span className="font-medium">{formatEuro(report.rubriek1a.amount)}</span>
                </div>

                {/* Rubriek 1b */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm font-bold text-muted-foreground mr-3">1b</span>
                    <span className="text-sm">{report.rubriek1b.description} (9%)</span>
                  </div>
                  <span className="font-medium">{formatEuro(report.rubriek1b.amount)}</span>
                </div>

                {/* Rubriek 1e */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm font-bold text-muted-foreground mr-3">1e</span>
                    <span className="text-sm">{report.rubriek1e.description}</span>
                  </div>
                  <span className="font-medium">{formatEuro(report.rubriek1e.amount)}</span>
                </div>

                <div className="border-t my-3" />

                {/* Rubriek 5a */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm font-bold text-blue-600 mr-3">5a</span>
                    <span className="text-sm font-medium">{report.rubriek5a.description}</span>
                  </div>
                  <span className="font-bold text-blue-700">{formatEuro(report.rubriek5a.amount)}</span>
                </div>

                {/* Rubriek 5b */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm font-bold text-orange-600 mr-3">5b</span>
                    <span className="text-sm font-medium">{report.rubriek5b.description}</span>
                  </div>
                  <span className="font-bold text-orange-700">{formatEuro(report.rubriek5b.amount)}</span>
                </div>

                <div className="border-t my-3" />

                {/* Totaal */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${report.totalOwed >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div>
                    <span className="font-mono text-sm font-bold text-muted-foreground mr-3">5g</span>
                    <span className="text-sm font-bold">
                      {report.totalOwed >= 0 ? 'Te betalen aan de Belastingdienst' : 'Terug te vragen van de Belastingdienst'}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${report.totalOwed >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatEuro(Math.abs(report.totalOwed))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail secties */}

          {/* Facturen 21% */}
          {report.invoices21.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('invoices21')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {expandedSections.invoices21 ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Facturen met 21% BTW ({report.invoices21.length})
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatEuro(report.rubriek1a.amount)}
                  </span>
                </div>
              </CardHeader>
              {expandedSections.invoices21 && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Factuurnummer</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Klant</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Subtotaal</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">BTW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.invoices21.map((inv, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 font-medium">{inv.number}</td>
                            <td className="py-2 text-muted-foreground">{inv.client}</td>
                            <td className="py-2 text-right">{formatEuro(inv.subtotal)}</td>
                            <td className="py-2 text-right">{formatEuro(inv.btw)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Facturen 9% */}
          {report.invoices9.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('invoices9')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {expandedSections.invoices9 ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Facturen met 9% BTW ({report.invoices9.length})
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatEuro(report.rubriek1b.amount)}
                  </span>
                </div>
              </CardHeader>
              {expandedSections.invoices9 && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Factuurnummer</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Klant</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Subtotaal</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">BTW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.invoices9.map((inv, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 font-medium">{inv.number}</td>
                            <td className="py-2 text-muted-foreground">{inv.client}</td>
                            <td className="py-2 text-right">{formatEuro(inv.subtotal)}</td>
                            <td className="py-2 text-right">{formatEuro(inv.btw)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Facturen 0% */}
          {report.invoices0.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('invoices0')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {expandedSections.invoices0 ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Facturen met 0% BTW / vrijgesteld ({report.invoices0.length})
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatEuro(report.rubriek1e.amount)}
                  </span>
                </div>
              </CardHeader>
              {expandedSections.invoices0 && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Factuurnummer</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Klant</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Subtotaal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.invoices0.map((inv, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 font-medium">{inv.number}</td>
                            <td className="py-2 text-muted-foreground">{inv.client}</td>
                            <td className="py-2 text-right">{formatEuro(inv.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Uitgaven */}
          {report.expenses.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('expenses')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {expandedSections.expenses ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Uitgaven / Voorbelasting ({report.expenses.length})
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    BTW: {formatEuro(report.rubriek5b.amount)}
                  </span>
                </div>
              </CardHeader>
              {expandedSections.expenses && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Datum</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Omschrijving</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Categorie</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Bedrag excl.</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">BTW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.expenses.map((exp, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 text-muted-foreground">
                              {new Date(exp.date).toLocaleDateString('nl-NL')}
                            </td>
                            <td className="py-2">{exp.description}</td>
                            <td className="py-2 text-muted-foreground">{exp.category}</td>
                            <td className="py-2 text-right">{formatEuro(exp.amount)}</td>
                            <td className="py-2 text-right">{formatEuro(exp.btw)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 font-medium">
                          <td colSpan={3} className="py-2">Totaal</td>
                          <td className="py-2 text-right">{formatEuro(report.totalExpenses)}</td>
                          <td className="py-2 text-right">{formatEuro(report.rubriek5b.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Geen data melding */}
          {report.invoiceCount === 0 && report.expenseCount === 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">Geen gegevens gevonden</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Er zijn geen betaalde facturen of geregistreerde uitgaven gevonden voor {report.period}.
                      Controleer of je facturen de status &quot;betaald&quot; hebben en of je uitgaven zijn geregistreerd voor dit kwartaal.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/factuur/invoices">Naar facturen</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/belasting/expenses">Naar uitgaven</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Informatie kaart */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                BTW-aangifte deadlines
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Als ZZP&apos;er moet je elk kwartaal BTW-aangifte doen bij de Belastingdienst. De deadlines zijn:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-white/50 rounded p-2">
                  <span className="text-xs font-bold text-blue-800">Q1</span>
                  <span className="text-xs text-blue-700 ml-2">januari - maart</span>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">Deadline: 30 april</p>
                </div>
                <div className="bg-white/50 rounded p-2">
                  <span className="text-xs font-bold text-blue-800">Q2</span>
                  <span className="text-xs text-blue-700 ml-2">april - juni</span>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">Deadline: 31 juli</p>
                </div>
                <div className="bg-white/50 rounded p-2">
                  <span className="text-xs font-bold text-blue-800">Q3</span>
                  <span className="text-xs text-blue-700 ml-2">juli - september</span>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">Deadline: 31 oktober</p>
                </div>
                <div className="bg-white/50 rounded p-2">
                  <span className="text-xs font-bold text-blue-800">Q4</span>
                  <span className="text-xs text-blue-700 ml-2">oktober - december</span>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">Deadline: 31 januari (volgend jaar)</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Let op: dit overzicht is een hulpmiddel. Controleer de gegevens altijd voordat je de aangifte indient bij de Belastingdienst.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
