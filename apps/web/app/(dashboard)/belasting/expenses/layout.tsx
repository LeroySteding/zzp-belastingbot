import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Uitgaven' }

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
