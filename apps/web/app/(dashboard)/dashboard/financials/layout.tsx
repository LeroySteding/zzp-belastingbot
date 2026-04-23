import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Financieel Overzicht' }

export default function FinancialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
