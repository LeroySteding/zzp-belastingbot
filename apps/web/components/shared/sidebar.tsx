'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Tag,
  Upload,
  Clock,
  Play,
  FolderKanban,
  ClipboardList,
  Users,
  Globe,
  Palette,
  FileBarChart,
  PlusCircle,
} from 'lucide-react'
import { useState } from 'react'

interface NavSection {
  title: string
  accentColor: string
  items: {
    name: string
    href: string
    icon: React.ElementType
  }[]
}

const navSections: NavSection[] = [
  {
    title: 'Overzicht',
    accentColor: 'var(--brand-primary)',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Facturatie',
    accentColor: 'var(--accent-factuur)',
    items: [
      { name: 'Facturen', href: '/factuur', icon: FileText },
      { name: 'Nieuwe Factuur', href: '/factuur/invoices/new', icon: PlusCircle },
      { name: 'Klanten', href: '/factuur/clients', icon: Users },
      { name: 'Rapportages', href: '/factuur/reports', icon: FileBarChart },
    ],
  },
  {
    title: 'Urenregistratie',
    accentColor: 'var(--accent-uren)',
    items: [
      { name: 'Timer', href: '/uren/track', icon: Play },
      { name: 'Projecten', href: '/uren/projects', icon: FolderKanban },
      { name: 'Urenstaten', href: '/uren/timesheets', icon: ClipboardList },
    ],
  },
  {
    title: 'Belasting',
    accentColor: 'var(--accent-belasting)',
    items: [
      { name: 'Uitgaven', href: '/belasting/expenses', icon: Receipt },
      { name: 'Importeren', href: '/belasting/import', icon: Upload },
      { name: 'Categorieën', href: '/belasting/categories', icon: Tag },
      { name: 'BTW Rapporten', href: '/belasting/reports', icon: FileText },
    ],
  },
  {
    title: 'Klantportaal',
    accentColor: 'var(--accent-portal)',
    items: [
      { name: 'Projecten', href: '/portal/projects', icon: FolderKanban },
      { name: 'Klanten', href: '/portal/clients', icon: Users },
      { name: 'Branding', href: '/portal/settings', icon: Palette },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    router.push('/login')
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-background"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 transition-transform lg:translate-x-0',
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
              Alles-in-één voor ZZP&apos;ers
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-6 overflow-y-auto pb-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'))
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
                        style={isActive ? { borderLeft: `3px solid ${section.accentColor}` } : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border">
            <Link
              href="/settings"
              className="sidebar-nav-item text-sm mb-1"
            >
              <Settings className="h-4 w-4" />
              Instellingen
            </Link>
            <button
              className="sidebar-nav-item text-sm w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Uitloggen
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
