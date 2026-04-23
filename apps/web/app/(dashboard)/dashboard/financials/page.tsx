'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PieChart as PieChartIcon,
  Download,
  Loader2,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton, FinancialsSkeleton } from '@/components/ui/skeleton';
import {
  getFinancialOverview,
  exportFinancialCSV,
  type FinancialOverview,
  type MonthlyData,
} from '@/lib/dashboard/financial-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

const PIE_COLORS = [
  'oklch(0.65 0.25 250)',
  'oklch(0.65 0.26 300)',
  'oklch(0.6 0.18 150)',
  'oklch(0.7 0.2 80)',
  'oklch(0.65 0.25 30)',
  'oklch(0.55 0.2 200)',
];

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card-premium p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function FinancialsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialOverview | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const overview = await getFinancialOverview(year);
      setData(overview);
      setLoading(false);
    }
    load();
  }, [year]);

  const handleExport = async () => {
    setExporting(true);
    const csv = await exportFinancialCSV(year);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `winst-verlies-${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  // Combine actual + forecast for chart
  const chartData: (MonthlyData & { isForecast?: boolean })[] = data
    ? [
        ...data.months.map((m) => ({ ...m, isForecast: false })),
        ...data.forecast.map((m) => ({ ...m, isForecast: true })),
      ]
    : [];

  // BTW per quarter
  const quarters = data
    ? [1, 2, 3, 4].map((q) => {
        const qMonths = data.months.filter(
          (m) => Math.ceil(m.month / 3) === q
        );
        const forecastQMonths = data.forecast.filter(
          (m) => Math.ceil(m.month / 3) === q
        );
        const allQMonths = [...qMonths, ...forecastQMonths];
        return {
          quarter: q,
          label: `Q${q}`,
          btwOutput: allQMonths.reduce((s, m) => s + m.btwOutput, 0),
          btwInput: allQMonths.reduce((s, m) => s + m.btwInput, 0),
          btwBalance: allQMonths.reduce((s, m) => s + m.btwBalance, 0),
          isForecast: qMonths.length === 0 && forecastQMonths.length > 0,
          isPartialForecast: qMonths.length > 0 && forecastQMonths.length > 0,
        };
      })
    : [];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 mt-1" />
        </div>
        <FinancialsSkeleton />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar dashboard
          </Link>
          <h1 className="text-2xl font-bold">Financieel Overzicht</h1>
          <p className="text-muted-foreground mt-1">
            Winst/verlies analyse en prognose voor {year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm font-medium disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Jaaromzet"
          value={formatCurrency(data.yearTotal.income)}
          subtitle={`${data.months.reduce((s, m) => s + m.invoiceCount, 0)} facturen`}
          icon={DollarSign}
          color="oklch(0.65 0.25 250)"
          trend={data.yearTotal.income > 0 ? 'up' : 'neutral'}
        />
        <KPICard
          title="Jaarkosten"
          value={formatCurrency(data.yearTotal.expenses)}
          subtitle={`${data.months.reduce((s, m) => s + m.expenseCount, 0)} uitgaven`}
          icon={Receipt}
          color="oklch(0.65 0.25 30)"
          trend={data.yearTotal.expenses > 0 ? 'down' : 'neutral'}
        />
        <KPICard
          title="Netto Winst"
          value={formatCurrency(data.yearTotal.profit)}
          subtitle={
            data.yearTotal.income > 0
              ? `${Math.round((data.yearTotal.profit / data.yearTotal.income) * 100)}% marge`
              : undefined
          }
          icon={TrendingUp}
          color="oklch(0.6 0.18 150)"
          trend={data.yearTotal.profit >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="BTW Saldo"
          value={formatCurrency(data.yearTotal.btw)}
          subtitle="Af te dragen"
          icon={BarChart3}
          color="oklch(0.65 0.26 300)"
        />
      </div>

      {/* Area Chart: Omzet vs Kosten */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">
          Omzet vs Kosten per maand
        </h2>
        <div className="h-[350px]" role="img" aria-label="Grafiek: Omzet versus kosten per maand">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.25 250)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.25 250)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.25 30)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.25 30)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="monthName"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.substring(0, 3)}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name="Omzet"
                stroke="oklch(0.65 0.25 250)"
                fill="url(#incomeGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Kosten"
                stroke="oklch(0.65 0.25 30)"
                fill="url(#expenseGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {data.forecast.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            * Stippellijn toont prognose op basis van gemiddelde laatste 3 maanden
          </p>
        )}
      </div>

      {/* Bar Chart + Pie Chart row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart: Netto Winst */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">
            Netto winst per maand
          </h2>
          <div className="h-[300px]" role="img" aria-label="Grafiek: Netto winst per maand">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.substring(0, 3)}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="profit" name="Winst" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.profit >= 0
                          ? entry.isForecast
                            ? 'oklch(0.6 0.18 150 / 0.5)'
                            : 'oklch(0.6 0.18 150)'
                          : entry.isForecast
                            ? 'oklch(0.65 0.25 30 / 0.5)'
                            : 'oklch(0.65 0.25 30)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Expenses by category */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">
            Uitgaven per categorie
          </h2>
          {data.expensesByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <PieChartIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Geen uitgaven dit jaar</p>
              </div>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: any) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {data.expensesByCategory.map((_entry, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Monthly P&L Table */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">
          Maandelijkse Winst & Verlies
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maand</TableHead>
                <TableHead className="text-right">Omzet</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
                <TableHead className="text-right">Winst</TableHead>
                <TableHead className="text-right">BTW Af te dragen</TableHead>
                <TableHead className="text-right">BTW Voorbelasting</TableHead>
                <TableHead className="text-right">BTW Saldo</TableHead>
                <TableHead className="text-right">Facturen</TableHead>
                <TableHead className="text-right">Uitgaven</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.months.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{m.monthName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(m.income)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(m.expenses)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      m.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(m.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(m.btwOutput)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(m.btwInput)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(m.btwBalance)}
                  </TableCell>
                  <TableCell className="text-right">{m.invoiceCount}</TableCell>
                  <TableCell className="text-right">{m.expenseCount}</TableCell>
                </TableRow>
              ))}
              {data.forecast.map((m) => (
                <TableRow key={`f-${m.month}`} className="opacity-60">
                  <TableCell className="font-medium italic">
                    {m.monthName} *
                  </TableCell>
                  <TableCell className="text-right italic">
                    {formatCurrency(m.income)}
                  </TableCell>
                  <TableCell className="text-right italic">
                    {formatCurrency(m.expenses)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium italic ${
                      m.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(m.profit)}
                  </TableCell>
                  <TableCell className="text-right italic">
                    {formatCurrency(m.btwOutput)}
                  </TableCell>
                  <TableCell className="text-right italic">
                    {formatCurrency(m.btwInput)}
                  </TableCell>
                  <TableCell className="text-right italic">
                    {formatCurrency(m.btwBalance)}
                  </TableCell>
                  <TableCell className="text-right italic">-</TableCell>
                  <TableCell className="text-right italic">-</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Totaal {year}</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(data.yearTotal.income)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(data.yearTotal.expenses)}
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    data.yearTotal.profit >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(data.yearTotal.profit)}
                </TableCell>
                <TableCell className="text-right font-bold" colSpan={2}>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(data.yearTotal.btw)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data.months.reduce((s, m) => s + m.invoiceCount, 0)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data.months.reduce((s, m) => s + m.expenseCount, 0)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        {data.forecast.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            * Cursief = prognose op basis van gemiddelde laatste 3 maanden
          </p>
        )}
      </div>

      {/* BTW Quarterly Overview */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">BTW Kwartaaloverzicht</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quarters.map((q) => (
            <div
              key={q.quarter}
              className={`rounded-xl border p-4 ${
                q.isForecast ? 'opacity-60 border-dashed' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{q.label}</span>
                {q.isForecast && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Prognose
                  </span>
                )}
                {q.isPartialForecast && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Deels prognose
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Af te dragen</span>
                  <span>{formatCurrency(q.btwOutput)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voorbelasting</span>
                  <span>{formatCurrency(q.btwInput)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Saldo</span>
                    <span
                      className={
                        q.btwBalance >= 0 ? 'text-red-600' : 'text-green-600'
                      }
                    >
                      {formatCurrency(q.btwBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
