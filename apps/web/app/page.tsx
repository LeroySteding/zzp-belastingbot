import Link from 'next/link'
import { ArrowRight, FileText, Clock, Receipt, Users } from 'lucide-react'

const modules = [
  { name: 'Dashboard', href: '/dashboard', icon: ArrowRight, description: 'Unified overzicht', color: 'oklch(0.6 0.22 264)' },
  { name: 'Facturatie', href: '/factuur', icon: FileText, description: 'Facturen & klanten', color: 'oklch(0.65 0.25 250)' },
  { name: 'Urenregistratie', href: '/uren/track', icon: Clock, description: 'Timer & projecten', color: 'oklch(0.65 0.26 300)' },
  { name: 'Belasting', href: '/belasting', icon: Receipt, description: 'BTW & uitgaven', color: 'oklch(0.6 0.18 150)' },
  { name: 'Klantportaal', href: '/portal', icon: Users, description: 'White-label portal', color: 'oklch(0.7 0.2 80)' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">ZZP Platform</h1>
        <p className="text-lg text-muted-foreground">
          Alles-in-een voor Nederlandse freelancers. Facturatie, urenregistratie,
          belastingadministratie en klantportaal in één app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="card-premium p-6 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklch, ${mod.color} 15%, transparent)`, color: mod.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{mod.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{mod.description}</p>
              <div className="mt-3 text-sm font-medium flex items-center gap-1" style={{ color: mod.color }}>
                Openen <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Demo mode — geen login vereist
      </p>
    </div>
  )
}
