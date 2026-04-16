'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Clock,
  Receipt,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Play,
  PlusCircle,
  CalendarClock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Mock data - will be replaced with Supabase queries
const dashboardData = {
  openInvoices: { count: 3, total: 4250.00 },
  hoursThisWeek: 32.5,
  btwThisQuarter: { input: 1245.50, output: 3890.00 },
  activeProjects: 4,
  recentActivity: [
    { id: '1', type: 'invoice', message: 'Factuur FACT-2026-012 verzonden naar TechStart BV', time: '2 uur geleden' },
    { id: '2', type: 'time', message: '4.5 uur geregistreerd voor Website Redesign', time: '3 uur geleden' },
    { id: '3', type: 'expense', message: 'Uitgave toegevoegd: Adobe Creative Cloud €54,99', time: '5 uur geleden' },
    { id: '4', type: 'portal', message: 'Klant heeft milestone goedgekeurd: Design Review', time: '1 dag geleden' },
    { id: '5', type: 'invoice', message: 'Factuur FACT-2026-011 betaald door WebWinkel Amsterdam', time: '2 dagen geleden' },
  ],
  upcomingDeadlines: [
    { id: '1', title: 'BTW Aangifte Q1 2026', date: '2026-04-30', type: 'belasting' },
    { id: '2', title: 'Project deadline: E-commerce Platform', date: '2026-05-15', type: 'project' },
    { id: '3', title: 'Factuur FACT-2026-009 vervalt', date: '2026-04-22', type: 'factuur' },
  ],
}

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

export default function DashboardPage() {
  const data = dashboardData

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
          subtitle="van 40u budget"
          icon={Clock}
          color="oklch(0.65 0.26 300)"
          href="/uren/track"
        />
        <StatCard
          title="BTW dit kwartaal"
          value={formatCurrency(data.btwThisQuarter.output - data.btwThisQuarter.input)}
          subtitle="Output - Input BTW"
          icon={Receipt}
          color="oklch(0.6 0.18 150)"
          href="/belasting/reports"
        />
        <StatCard
          title="Actieve Projecten"
          value={String(data.activeProjects)}
          subtitle="2 met klantportaal"
          icon={Users}
          color="oklch(0.7 0.2 80)"
          href="/portal/projects"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Snelle Acties</h2>
          <div className="space-y-2">
            <QuickAction title="Nieuwe Factuur" icon={PlusCircle} href="/factuur/invoices/new" color="oklch(0.65 0.25 250)" />
            <QuickAction title="Start Timer" icon={Play} href="/uren/track" color="oklch(0.65 0.26 300)" />
            <QuickAction title="Uitgave Toevoegen" icon={Receipt} href="/belasting/expenses" color="oklch(0.6 0.18 150)" />
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Aankomende Deadlines</h2>
          <div className="space-y-3">
            {data.upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-start gap-3">
                <CalendarClock className="h-4 w-4 mt-0.5 text-warning" />
                <div>
                  <p className="text-sm font-medium">{deadline.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(deadline.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Recente Activiteit</h2>
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
