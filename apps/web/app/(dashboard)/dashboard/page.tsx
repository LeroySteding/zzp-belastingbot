'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Clock,
  Receipt,
  Users,
  ArrowRight,
  Play,
  PlusCircle,
  CalendarClock,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ScrollText,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Check,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { getInvoices } from '@/lib/factuur/actions'
import { getTimeEntries, getUrenProjects } from '@/lib/uren/actions'
import { getExpenses } from '@/lib/belasting/actions'
import { getPortalProjects } from '@/lib/portal/actions'
import { getDashboardSummary, type DashboardSummary } from '@/lib/dashboard/dashboard-actions'
import { getRecentActivity, type ActivityItem } from '@/lib/dashboard/activity-feed'

// ============================================
// ICON MAPPING
// ============================================

const ICONS: Record<string, React.ElementType> = {
  'file-text': FileText,
  'clock': Clock,
  'receipt': Receipt,
  'target': Target,
  'scroll-text': ScrollText,
  'users': Users,
}

// ============================================
// HELPERS
// ============================================

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} uur geleden`
  const days = Math.floor(hours / 24)
  return `${days} dagen geleden`
}

// ============================================
// COMPONENTS
// ============================================

function StatCard({ title, value, subtitle, icon: Icon, color, href }: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: string
  href: string
}) {
  return (
    <Link href={href} className="card-premium p-6 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  )
}

function QuickAction({ title, icon: Icon, href, color }: {
  title: string
  icon: React.ElementType
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
    >
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium">{title}</span>
      <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </Link>
  )
}

// ============================================
// MAIN PAGE
// ============================================

interface DashboardData {
  openInvoices: { count: number; total: number }
  hoursThisWeek: number
  btwThisQuarter: number
  activeProjects: number
  portalProjects: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    openInvoices: { count: 0, total: 0 },
    hoursThisWeek: 0,
    btwThisQuarter: 0,
    activeProjects: 0,
    portalProjects: 0,
  })
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    async function load() {
      const [invoices, timeEntries, expenses, projects, portalProjects, summaryData, activityData] = await Promise.all([
        getInvoices(),
        getTimeEntries(),
        getExpenses(),
        getUrenProjects(),
        getPortalProjects(),
        getDashboardSummary(),
        getRecentActivity(10),
      ])

      // Open invoices (status = verzonden)
      const openInvs = invoices.filter(inv => inv.status === 'verzonden')
      const openTotal = openInvs.reduce((sum, inv) => {
        const itemTotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 + item.btwRate / 100), 0)
        return sum + itemTotal
      }, 0)

      // Hours this week
      const now = new Date()
      const dayOfWeek = now.getDay() || 7
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek + 1)
      weekStart.setHours(0, 0, 0, 0)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEntries = timeEntries.filter(e => e.date >= weekStartStr)
      const weekHours = weekEntries.reduce((sum, e) => sum + e.duration / 60, 0)

      // BTW this quarter from expenses
      const currentYear = now.getFullYear()
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
      const quarterExpenses = expenses.filter(
        e => e.year === currentYear && e.quarter === currentQuarter
      )
      const btwTotal = quarterExpenses.reduce((sum, e) => sum + e.btw_amount, 0)

      // Active projects
      const activeProjectCount = projects.length
      const portalVisible = portalProjects.filter(
        (p: any) => p.displayStatus === 'in-uitvoering' || p.displayStatus === 'review'
      ).length

      setData({
        openInvoices: { count: openInvs.length, total: Math.round(openTotal * 100) / 100 },
        hoursThisWeek: Math.round(weekHours * 10) / 10,
        btwThisQuarter: Math.round(btwTotal * 100) / 100,
        activeProjects: activeProjectCount,
        portalProjects: portalVisible,
      })
      setSummary(summaryData)
      setActivity(activityData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Dashboard laden...</span>
      </div>
    )
  }

  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#eab308']

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je ZZP administratie</p>
      </div>

      {/* Row 1: 5 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Open Facturen"
          value={formatCurrency(data.openInvoices.total)}
          subtitle={`${data.openInvoices.count} facturen`}
          icon={FileText}
          color="oklch(0.65 0.25 250)"
          href="/factuur"
        />
        <StatCard
          title="Uren deze week"
          value={`${data.hoursThisWeek}u`}
          icon={Clock}
          color="oklch(0.65 0.26 300)"
          href="/uren/track"
        />
        <StatCard
          title="BTW dit kwartaal"
          value={formatCurrency(data.btwThisQuarter)}
          subtitle="Voorbelasting uitgaven"
          icon={Receipt}
          color="oklch(0.6 0.18 150)"
          href="/belasting"
        />
        <StatCard
          title="Actieve Projecten"
          value={String(data.activeProjects)}
          subtitle={`${data.portalProjects} in klantportaal`}
          icon={Users}
          color="oklch(0.7 0.2 80)"
          href="/uren/projects"
        />
        <Link href="/dashboard/financials" className="card-premium p-6 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Omzet deze maand</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary?.cashFlow.income ?? 0)}
              </p>
              {summary && summary.revenueTrend !== 0 && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${summary.revenueTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {summary.revenueTrend > 0
                    ? <ArrowUpRight className="h-3 w-3" />
                    : <ArrowDownRight className="h-3 w-3" />
                  }
                  {summary.revenueTrend > 0 ? '+' : ''}{summary.revenueTrend}% t.o.v. vorige maand
                </p>
              )}
              {summary && summary.revenueTrend === 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  Gelijk aan vorige maand
                </p>
              )}
            </div>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'oklch(0.6 0.18 150 / 0.08)', color: 'oklch(0.6 0.18 150)' }}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </div>

      {/* Row 2: Revenue Chart + Invoice Aging */}
      {summary && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Revenue Chart */}
          <div className="card-premium p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Omzet vs Kosten</h2>
            {summary.revenueByMonth.length === 0 || summary.revenueByMonth.every((m: any) => (m.income === 0 || !m.income) && (m.expenses === 0 || !m.expenses)) ? (
              <EmptyState
                icon={BarChart3}
                title="Nog geen omzet data"
                description="Maak je eerste factuur om je omzet te zien"
                actionLabel="Nieuwe factuur"
                actionHref="/dashboard/invoices/new"
              />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.revenueByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelStyle={{ fontWeight: 600 }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <Bar dataKey="income" name="Omzet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Kosten" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Invoice Aging Pie */}
          <div className="card-premium p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Factuur Status</h2>
            {summary.invoiceAging.some(a => a.count > 0) ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.invoiceAging.filter(a => a.count > 0)}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {summary.invoiceAging.filter(a => a.count > 0).map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} facturen (${formatCurrency(props.payload.total)})`,
                          name,
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {summary.invoiceAging.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="Geen openstaande facturen"
                description="Alle facturen zijn betaald of je hebt nog geen facturen verstuurd"
              />
            )}
          </div>
        </div>
      )}

      {/* Row 3: Activity + Deadlines + Cash Flow */}
      {summary && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recente Activiteit */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold mb-4">Recente Activiteit</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activity.length > 0 ? activity.map((item) => {
                const IconComp = ICONS[item.icon] || FileText
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <IconComp className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.href ? (
                        <Link href={item.href} className="text-sm font-medium hover:underline truncate block">
                          {item.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium truncate">{item.title}</p>
                      )}
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                )
              }) : (
                <EmptyState
                  icon={Clock}
                  title="Nog geen activiteit"
                  description="Begin met factureren of uren schrijven"
                  actionLabel="Ga aan de slag"
                  actionHref="/dashboard/invoices"
                />
              )}
            </div>
          </div>

          {/* Aankomende Deadlines */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold mb-4">Aankomende Deadlines</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {summary.deadlines.length > 0 ? summary.deadlines.map((dl, idx) => {
                const urgencyColors = {
                  green: 'bg-green-100 text-green-700',
                  orange: 'bg-orange-100 text-orange-700',
                  red: 'bg-red-100 text-red-700',
                }
                const typeIcons: Record<string, React.ElementType> = {
                  factuur: FileText,
                  btw: Receipt,
                  project: CalendarClock,
                }
                const TypeIcon = typeIcons[dl.type] || CalendarClock
                return (
                  <Link key={idx} href={dl.href} className="flex items-start gap-3 group">
                    <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-muted">
                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium group-hover:underline truncate">{dl.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColors[dl.urgency]}`}>
                          {dl.daysRemaining < 0
                            ? `${Math.abs(dl.daysRemaining)} dagen te laat`
                            : dl.daysRemaining === 0
                              ? 'Vandaag'
                              : `${dl.daysRemaining} dagen`
                          }
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              }) : (
                <EmptyState
                  icon={Check}
                  title="Geen deadlines"
                  description="Je hebt geen aankomende deadlines. Lekker rustig!"
                />
              )}
            </div>
          </div>

          {/* Cashflow */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold mb-4">Cashflow</h2>
            <div className="space-y-4">
              {/* Income bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Inkomsten</span>
                  <span className="font-medium text-green-600">{formatCurrency(summary.cashFlow.income)}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: summary.cashFlow.income > 0
                        ? `${Math.min(100, (summary.cashFlow.income / Math.max(summary.cashFlow.income, summary.cashFlow.expenses)) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              {/* Expense bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Uitgaven</span>
                  <span className="font-medium text-red-500">{formatCurrency(summary.cashFlow.expenses)}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: summary.cashFlow.expenses > 0
                        ? `${Math.min(100, (summary.cashFlow.expenses / Math.max(summary.cashFlow.income, summary.cashFlow.expenses)) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              {/* Net amount */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Netto</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${summary.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(summary.cashFlow.net)}
                    </span>
                    {summary.cashFlow.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-600" />}
                    {summary.cashFlow.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    {summary.cashFlow.trend === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.cashFlow.trend === 'up' && 'Stijgend t.o.v. vorige maand'}
                  {summary.cashFlow.trend === 'down' && 'Dalend t.o.v. vorige maand'}
                  {summary.cashFlow.trend === 'neutral' && 'Gelijk aan vorige maand'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Top Clients + Expenses */}
      {summary && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Klanten */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold mb-4">Top Klanten</h2>
            {summary.topClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">Klant</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Omzet</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Facturen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topClients.map((client, idx) => (
                      <tr key={idx} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 font-medium">{client.clientName}</td>
                        <td className="py-2.5 text-right">{formatCurrency(client.revenue)}</td>
                        <td className="py-2.5 text-right text-muted-foreground">{client.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Nog geen klanten"
                description="Voeg je eerste klant toe via een factuur"
                actionLabel="Nieuwe factuur"
                actionHref="/dashboard/invoices/new"
              />
            )}
          </div>

          {/* Uitgaven per Categorie */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold mb-4">Uitgaven per Categorie</h2>
            {summary.expenseCategories.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.expenseCategories}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                      >
                        {summary.expenseCategories.map((_, idx) => (
                          <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  {summary.expenseCategories.map((cat, idx) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="truncate">{cat.category}</span>
                      </div>
                      <span className="font-medium shrink-0 ml-2">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Receipt}
                title="Nog geen uitgaven"
                description="Registreer je eerste uitgave"
                actionLabel="Uitgave toevoegen"
                actionHref="/dashboard/expenses/new"
              />
            )}
          </div>
        </div>
      )}

      {/* Row 5: Quick Actions */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">Snelle Acties</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <QuickAction title="Nieuwe Factuur" icon={PlusCircle} href="/factuur/invoices/new" color="oklch(0.65 0.25 250)" />
          <QuickAction title="Start Timer" icon={Play} href="/uren/track" color="oklch(0.65 0.26 300)" />
          <QuickAction title="Uitgave Toevoegen" icon={Receipt} href="/belasting/expenses" color="oklch(0.6 0.18 150)" />
          <QuickAction title="Financieel Overzicht" icon={TrendingUp} href="/dashboard/financials" color="oklch(0.6 0.18 150)" />
          <QuickAction title="Nieuw Contract" icon={ScrollText} href="/contracts/new" color="oklch(0.55 0.2 200)" />
          <QuickAction title="AI Assistent" icon={Sparkles} href="/dashboard/assistant" color="oklch(0.6 0.25 270)" />
        </div>
      </div>
    </div>
  )
}
