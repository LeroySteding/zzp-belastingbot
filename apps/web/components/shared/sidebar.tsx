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
  ScanLine,
  UsersRound,
  Target,
  Kanban,
  Search,
  UserPlus,
  FileCheck,
  Bell,
  Sparkles,
  TrendingUp,
  ScrollText,
  Mail,
} from 'lucide-react'
import { useState } from 'react'
import { AccountSwitcher } from '@/components/shared/account-switcher'

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
      { name: 'Financieel Overzicht', href: '/dashboard/financials', icon: TrendingUp },
      { name: 'AI Assistent', href: '/dashboard/assistant', icon: Sparkles },
      { name: 'Emails', href: '/dashboard/emails', icon: Mail },
    ],
  },
  {
    title: 'Facturatie',
    accentColor: 'var(--accent-factuur)',
    items: [
      { name: 'Facturen', href: '/factuur', icon: FileText },
      { name: 'Nieuwe Factuur', href: '/factuur/invoices/new', icon: PlusCircle },
      { name: 'Offertes', href: '/factuur/offertes', icon: FileCheck },
      { name: 'Herinneringen', href: '/factuur/reminders', icon: Bell },
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
      { name: 'Bon Scanner', href: '/belasting/scan', icon: ScanLine },
      { name: 'Importeren', href: '/belasting/import', icon: Upload },
      { name: 'Categorieën', href: '/belasting/categories', icon: Tag },
      { name: 'BTW Rapporten', href: '/belasting/reports', icon: FileText },
    ],
  },
  {
    title: 'Leads',
    accentColor: 'oklch(0.65 0.25 30)',
    items: [
      { name: 'Dashboard', href: '/leads', icon: Target },
      { name: 'Pipeline', href: '/leads/pipeline', icon: Kanban },
      { name: 'Zoek Prospects', href: '/leads/search', icon: Search },
      { name: 'Nieuwe Lead', href: '/leads/new', icon: UserPlus },
    ],
  },
  {
    title: 'Contracten',
    accentColor: 'oklch(0.55 0.2 200)',
    items: [
      { name: 'Overzicht', href: '/contracts', icon: ScrollText },
      { name: 'Nieuw Contract', href: '/contracts/new', icon: PlusCircle },
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
          aria-label={mobileMenuOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={mobileMenuOpen}
          aria-controls="sidebar-nav"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
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
            <div className="mt-3">
              <AccountSwitcher />
            </div>
          </div>

          {/* Navigation */}
          <nav id="sidebar-nav" aria-label="Hoofdmenu" className="flex-1 px-3 space-y-6 overflow-y-auto pb-4">
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
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'sidebar-nav-item text-sm',
                          isActive && 'active'
                        )}
                        style={isActive ? { borderLeft: `3px solid ${section.accentColor}` } : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.name}</span>
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
              href="/settings/team"
              aria-current={pathname === '/settings/team' ? 'page' : undefined}
              className={cn(
                'sidebar-nav-item text-sm mb-1',
                pathname === '/settings/team' && 'active'
              )}
            >
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              <span>Team</span>
            </Link>
            <Link
              href="/settings"
              aria-current={pathname === '/settings' ? 'page' : undefined}
              className={cn(
                'sidebar-nav-item text-sm mb-1',
                pathname === '/settings' && 'active'
              )}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Instellingen</span>
            </Link>
            <button
              className="sidebar-nav-item text-sm w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
