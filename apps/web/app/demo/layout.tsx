import type { Metadata } from 'next'
import DemoLayoutClient from './demo-layout-client'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Bekijk de ZZP Platform demo met voorbeelddata.',
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DemoLayoutClient>{children}</DemoLayoutClient>
}
