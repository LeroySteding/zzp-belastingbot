'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileText,
  Clock,
  Receipt,
  Menu,
  X,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { useState, createContext, useContext, useCallback } from 'react'

// Demo toast context
interface DemoToastState {
  visible: boolean
  message: string
}

const DemoToastContext = createContext<{
  showDemoToast: (message?: string) => void
}>({
  showDemoToast: () => {},
})

export function useDemoToast() {
  return useContext(DemoToastContext)
}

const demoNav = [
  { name: 'Dashboard', href: '/demo', icon: LayoutDashboard },
  { name: 'Facturen', href: '/demo/factuur', icon: FileText },
  { name: 'Uren', href: '/demo/uren', icon: Clock },
  { name: 'Belasting', href: '/demo', icon: Receipt },
]

export default function DemoLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<DemoToastState>({ visible: false, message: '' })

  const showDemoToast = useCallback((message?: string) => {
    setToast({ visible: true, message: message || 'Dit is een demo - maak een account aan om deze actie uit te voeren' })
    setTimeout(() => setToast({ visible: false, message: '' }), 3000)
  }, [])

  return (
    <DemoToastContext.Provider value={{ showDemoToast }}>
      <div className="min-h-screen bg-background">
        {/* Demo banner */}
        <div className="bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Demo modus</span>
              <span className="hidden sm:inline text-background/70">
                &mdash; Bekijk het platform met voorbeelddata
              </span>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-background text-foreground px-4 py-1.5 rounded-lg hover:bg-background/90 transition-colors"
            >
              Start gratis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-14 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="bg-background"
            aria-label={mobileMenuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 top-10"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-10 left-0 z-40 h-[calc(100vh-2.5rem)] w-64 transition-transform lg:translate-x-0',
            'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="p-6">
              <h1 className="text-xl font-bold text-sidebar-foreground">
                ZZP Platform
              </h1>
              <p className="text-xs text-sidebar-foreground/50 mt-1">
                Demo - Studio Voorbeeld
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
              {demoNav.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'sidebar-nav-item text-sm',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Footer CTA */}
            <div className="p-4 border-t border-sidebar-border">
              <Link href="/signup">
                <Button className="w-full gap-2">
                  Start gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/login"
                className="block text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
              >
                Al een account? Inloggen
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:pl-64 pt-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Demo toast */}
        {toast.visible && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-right-full">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 shadow-lg">
              <Eye className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Demo modus</p>
                <p className="text-sm mt-1 opacity-90">{toast.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoToastContext.Provider>
  )
}
