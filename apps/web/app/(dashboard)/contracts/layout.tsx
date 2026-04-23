import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contracten' }

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
