import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Facturen' }

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
