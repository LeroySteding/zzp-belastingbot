'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Calculator, 
  FileText, 
  Users, 
  Clock,
  ChevronDown,
  ExternalLink 
} from 'lucide-react'

interface AppConfig {
  name: string
  description: string
  icon: React.ReactNode
  url: string
  accent: string
}

const apps: AppConfig[] = [
  {
    name: 'Belastingbot',
    description: 'BTW & Belasting',
    icon: <Calculator className="h-5 w-5" />,
    url: process.env.NEXT_PUBLIC_TAX_APP_URL || 'https://belastingbot.nl',
    accent: 'tax'
  },
  {
    name: 'Factuur',
    description: 'Facturatie',
    icon: <FileText className="h-5 w-5" />,
    url: process.env.NEXT_PUBLIC_FACTUUR_APP_URL || 'https://factuur.app',
    accent: 'factuur'
  },
  {
    name: 'Klantportaal',
    description: 'Klantbeheer',
    icon: <Users className="h-5 w-5" />,
    url: process.env.NEXT_PUBLIC_PORTAL_APP_URL || 'https://klantportaal.app',
    accent: 'portal'
  },
  {
    name: 'Uren',
    description: 'Urenregistratie',
    icon: <Clock className="h-5 w-5" />,
    url: process.env.NEXT_PUBLIC_UREN_APP_URL || 'https://uren.app',
    accent: 'uren'
  }
]

interface AppSwitcherProps {
  currentApp?: 'tax' | 'factuur' | 'portal' | 'uren'
}

export function AppSwitcher({ currentApp }: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const current = apps.find(app => app.accent === currentApp)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
      >
        {current ? (
          <>
            <span className={`accent-${current.accent}`}>{current.icon}</span>
            <span className="font-medium text-sm hidden md:inline">{current.name}</span>
          </>
        ) : (
          <span className="font-medium text-sm">ZZP Apps</span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ZZP Toolsuite
              </div>
              
              {apps.map((app) => {
                const isCurrent = app.accent === currentApp
                
                return (
                  <Link
                    key={app.name}
                    href={app.url}
                    target={isCurrent ? undefined : '_blank'}
                    rel={isCurrent ? undefined : 'noopener noreferrer'}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg 
                      transition-all duration-200
                      ${isCurrent 
                        ? `bg-accent-${app.accent}/10 border-l-2 border-accent-${app.accent}` 
                        : 'hover:bg-muted'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={`accent-${app.accent} flex-shrink-0`}>
                      {app.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">
                        {app.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {app.description}
                      </div>
                    </div>
                    {!isCurrent && (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    {isCurrent && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-tax" />
                    )}
                  </Link>
                )
              })}
            </div>
            
            <div className="border-t border-border p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Alle tools voor de moderne ZZP&apos;er
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
