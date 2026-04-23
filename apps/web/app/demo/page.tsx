'use client'

import Link from 'next/link'
import {
  FileText,
  Clock,
  Receipt,
  Users,
  ArrowRight,
  Play,
  PlusCircle,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DEMO_DATA } from '@/lib/demo/data'
import { useDemoToast } from './demo-layout-client'

function StatCard({ title, value, subtitle, icon: Icon, color, onClick }: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: string
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="card-premium p-6 group text-left w-full">
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
    </button>
  )
}

export default function DemoPage() {
  const { showDemoToast } = useDemoToast()
  const { stats, recentActivity, invoices } = DEMO_DATA

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je ZZP administratie</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Omzet deze maand"
          value={formatCurrency(stats.monthlyRevenue)}
          subtitle="3 facturen"
          icon={TrendingUp}
          color="oklch(0.65 0.25 250)"
          onClick={() => showDemoToast()}
        />
        <StatCard
          title="Open Facturen"
          value={String(stats.openInvoices)}
          subtitle={formatCurrency(6850)}
          icon={FileText}
          color="oklch(0.65 0.25 250)"
          onClick={() => showDemoToast()}
        />
        <StatCard
          title="Uren deze week"
          value={`${stats.hoursThisWeek}u`}
          icon={Clock}
          color="oklch(0.65 0.26 300)"
          onClick={() => showDemoToast()}
        />
        <StatCard
          title="Actieve Projecten"
          value={String(stats.activeProjects)}
          icon={Users}
          color="oklch(0.7 0.2 80)"
          onClick={() => showDemoToast()}
        />
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Snelle Acties</h2>
          <div className="space-y-2">
            <button
              onClick={() => showDemoToast()}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group w-full text-left"
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.65 0.25 250 / 0.1)', color: 'oklch(0.65 0.25 250)' }}>
                <PlusCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Nieuwe Factuur</span>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => showDemoToast()}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group w-full text-left"
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.65 0.26 300 / 0.1)', color: 'oklch(0.65 0.26 300)' }}>
                <Play className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Start Timer</span>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => showDemoToast()}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group w-full text-left"
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.6 0.18 150 / 0.1)', color: 'oklch(0.6 0.18 150)' }}>
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Uitgave Toevoegen</span>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recente Activiteit
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-foreground/20 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recente Facturen</h2>
          <Link
            href="/demo/factuur"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Alle facturen <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">Nummer</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">Klant</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">Datum</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">Bedrag</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 3).map((inv) => (
                <tr key={inv.number} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-sm font-medium">{inv.number}</td>
                  <td className="py-3 text-sm text-muted-foreground">{inv.client}</td>
                  <td className="py-3 text-sm text-muted-foreground">{inv.date}</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(inv.amount)}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === 'betaald'
                        ? 'bg-green-100 text-green-700'
                        : inv.status === 'verzonden'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
