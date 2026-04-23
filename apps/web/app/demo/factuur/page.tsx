'use client'

import Link from 'next/link'
import { FileText, Plus, Download, Send, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { DEMO_DATA } from '@/lib/demo/data'
import { useDemoToast } from '../demo-layout-client'

export default function DemoFactuurPage() {
  const { showDemoToast } = useDemoToast()
  const { invoices, clients } = DEMO_DATA

  const totalOpen = invoices
    .filter(i => i.status === 'verzonden')
    .reduce((sum, i) => sum + i.amount, 0)
  const totalPaid = invoices
    .filter(i => i.status === 'betaald')
    .reduce((sum, i) => sum + i.amount, 0)
  const totalDraft = invoices
    .filter(i => i.status === 'concept')
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facturen</h1>
          <p className="text-muted-foreground mt-1">Beheer en verstuur je facturen</p>
        </div>
        <Button className="gap-2" onClick={() => showDemoToast()}>
          <Plus className="h-4 w-4" />
          Nieuwe Factuur
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-premium p-5">
          <p className="text-sm text-muted-foreground">Openstaand</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOpen)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'verzonden').length} facturen
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-sm text-muted-foreground">Betaald</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'betaald').length} facturen
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-sm text-muted-foreground">Concept</p>
          <p className="text-2xl font-bold mt-1 text-gray-500">{formatCurrency(totalDraft)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'concept').length} facturen
          </p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Nummer</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Klant</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Omschrijving</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Datum</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Bedrag</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Acties</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.number} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{inv.number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{inv.client}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{inv.description}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{inv.date}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium">{formatCurrency(inv.amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === 'betaald'
                        ? 'bg-green-100 text-green-700'
                        : inv.status === 'verzonden'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => showDemoToast()}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                        title="Downloaden"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {inv.status === 'concept' && (
                        <button
                          onClick={() => showDemoToast()}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          title="Versturen"
                        >
                          <Send className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => showDemoToast()}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                        title="Meer"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients section */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">Klanten</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((client) => (
            <button
              key={client.kvk}
              onClick={() => showDemoToast()}
              className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold">{client.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                <p className="text-xs text-muted-foreground">KvK: {client.kvk}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
