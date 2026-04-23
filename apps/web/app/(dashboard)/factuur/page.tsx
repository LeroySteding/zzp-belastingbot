'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileCheck,
  Bell,
  Users,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { formatCurrency, formatDate, getInvoiceTotal } from '@/lib/factuur/invoice-utils'
import { Invoice } from '@/lib/factuur/types/invoice'
import { getInvoices } from '@/lib/factuur/actions'
import { getOverdueInvoices, type OverdueInvoice } from '@/lib/factuur/reminder-actions'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

const statusVariantMap: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  concept: 'neutral',
  verzonden: 'info',
  betaald: 'success',
}

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
}

export default function FacturatieOverzichtPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [data, overdue] = await Promise.all([
        getInvoices(),
        getOverdueInvoices(),
      ])
      setInvoices(data)
      setOverdueInvoices(overdue)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  // Calculate statistics
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const thisMonthInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date)
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear
  })

  const monthlyRevenue = thisMonthInvoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)

  const outstandingAmount = invoices
    .filter(inv => inv.status === 'verzonden')
    .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)

  const outstandingCount = invoices.filter(inv => inv.status === 'verzonden').length

  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

  const conceptCount = invoices.filter(inv => inv.status === 'concept').length

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Counts for quick actions
  const totalInvoices = invoices.length
  const offerteCount = 0 // Offertes are separate; show link without count
  const clientNames = new Set(invoices.map(inv => inv.client.name))
  const clientCount = clientNames.size

  return (
    <div className="animate-fade-in space-y-4 md:space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturatie</h1>
          <p className="text-muted-foreground mt-1">Beheer je facturen, offertes en klanten</p>
        </div>
        <Button asChild>
          <Link href="/factuur/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Factuur
          </Link>
        </Button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/factuur/invoices?status=betaald" className="card-premium p-6 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Deze maand omzet</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(monthlyRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {thisMonthInvoices.filter(inv => inv.status === 'betaald').length} betaalde facturen
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'oklch(0.6 0.18 150 / 0.08)', color: 'oklch(0.6 0.18 150)' }}
              aria-hidden="true"
            >
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Link>

        <Link href="/factuur/invoices?status=verzonden" className="card-premium p-6 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Openstaand</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(outstandingAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {outstandingCount} verzonden facturen
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'oklch(0.65 0.25 250 / 0.08)', color: 'oklch(0.65 0.25 250)' }}
              aria-hidden="true"
            >
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Link>

        <Link href="/factuur/reminders" className="card-premium p-6 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Verlopen facturen</p>
              <p className="text-2xl font-bold mt-1 text-error">{overdueInvoices.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(overdueTotal)} openstaand
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'oklch(0.65 0.25 30 / 0.08)', color: 'oklch(0.65 0.25 30)' }}
              aria-hidden="true"
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Link>

        <Link href="/factuur/invoices?status=concept" className="card-premium p-6 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Concepten</p>
              <p className="text-2xl font-bold mt-1">{conceptCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Nog te versturen
              </p>
            </div>
            <div
              className="p-3 rounded-xl bg-muted"
              aria-hidden="true"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Snelle Acties</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Link
            href="/factuur/invoices"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.65 0.25 250 / 0.08)', color: 'oklch(0.65 0.25 250)' }} aria-hidden="true">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Alle Facturen</span>
              <p className="text-xs text-muted-foreground">{totalInvoices} facturen</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>

          <Link
            href="/factuur/invoices/new"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.6 0.18 150 / 0.08)', color: 'oklch(0.6 0.18 150)' }} aria-hidden="true">
              <Plus className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Nieuwe Factuur</span>
              <p className="text-xs text-muted-foreground">Maak een factuur aan</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>

          <Link
            href="/factuur/offertes"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.65 0.26 300 / 0.08)', color: 'oklch(0.65 0.26 300)' }} aria-hidden="true">
              <FileCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Offertes</span>
              <p className="text-xs text-muted-foreground">Beheer je offertes</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>

          <Link
            href="/factuur/clients"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.7 0.2 80 / 0.08)', color: 'oklch(0.7 0.2 80)' }} aria-hidden="true">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Klanten</span>
              <p className="text-xs text-muted-foreground">{clientCount} klanten</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>

          <Link
            href="/factuur/reminders"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
          >
            <div className="p-2 rounded-lg relative" style={{ backgroundColor: 'oklch(0.65 0.25 30 / 0.08)', color: 'oklch(0.65 0.25 30)' }} aria-hidden="true">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Herinneringen</span>
              <p className="text-xs text-muted-foreground">
                {overdueInvoices.length > 0 ? `${overdueInvoices.length} verlopen` : 'Geen verlopen facturen'}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>

          <Link
            href="/factuur/reports"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.55 0.2 200 / 0.08)', color: 'oklch(0.55 0.2 200)' }} aria-hidden="true">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Rapportages</span>
              <p className="text-xs text-muted-foreground">Omzet en statistieken</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueInvoices.length > 0 && (
        <div className="card-premium p-4 md:p-6 border-warning/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold">Verlopen Facturen</h2>
          </div>
          <div className="space-y-3">
            {overdueInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-warning/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-warning/10" aria-hidden="true">
                    <FileText className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{invoice.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{formatCurrency(invoice.total)}</p>
                    <p className="text-xs text-error">{invoice.daysOverdue} dagen verlopen</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/factuur/reminders">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Herinnering
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card-premium p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recente Facturen</h2>
          <Link
            href="/factuur/invoices"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Bekijk alle
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Nog geen facturen</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">Maak je eerste factuur aan om te beginnen</p>
            <Link href="/factuur/invoices/new" className="text-sm font-medium text-primary hover:underline">
              Nieuwe factuur aanmaken →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/factuur/invoices/${invoice.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-card-hover transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-muted" aria-hidden="true">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{invoice.client.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{formatCurrency(getInvoiceTotal(invoice))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                  </div>
                  <StatusBadge variant={statusVariantMap[invoice.status]} dot>
                    {statusLabels[invoice.status]}
                  </StatusBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
