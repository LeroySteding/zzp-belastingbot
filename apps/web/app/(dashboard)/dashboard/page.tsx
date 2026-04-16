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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getInvoices } from '@/lib/factuur/actions'
import { getTimeEntries, getUrenProjects } from '@/lib/uren/actions'
import { getExpenses } from '@/lib/belasting/actions'
import { getPortalProjects } from '@/lib/portal/actions'

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

  useEffect(() => {
    async function load() {
      const [invoices, timeEntries, expenses, projects, portalProjects] = await Promise.all([
        getInvoices(),
        getTimeEntries(),
        getExpenses(),
        getUrenProjects(),
        getPortalProjects(),
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

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je ZZP administratie</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">Snelle Acties</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          <QuickAction title="Nieuwe Factuur" icon={PlusCircle} href="/factuur/invoices/new" color="oklch(0.65 0.25 250)" />
          <QuickAction title="Start Timer" icon={Play} href="/uren/track" color="oklch(0.65 0.26 300)" />
          <QuickAction title="Uitgave Toevoegen" icon={Receipt} href="/belasting/expenses" color="oklch(0.6 0.18 150)" />
        </div>
      </div>
    </div>
  )
}
