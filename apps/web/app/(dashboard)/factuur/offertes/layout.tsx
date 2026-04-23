import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Offertes' }

export default function OffertesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
