import Link from 'next/link'
import { FileText, Clock, Receipt, Users, ChevronRight, Check, ArrowRight } from 'lucide-react'

const features = [
  {
    title: 'Facturatie',
    description: 'Maak professionele facturen in minuten. Automatische BTW-berekening, PDF export en betalingsherinneringen.',
    href: '/factuur',
    icon: FileText,
    accent: '#3B82F6',
  },
  {
    title: 'Urenregistratie',
    description: 'Start een timer, log je uren en genereer urenstaten. Koppel direct aan projecten en facturen.',
    href: '/uren/track',
    icon: Clock,
    accent: '#8B5CF6',
  },
  {
    title: 'BTW Administratie',
    description: 'Scan bonnetjes, importeer bankafschriften en genereer je kwartaalaangifte. KOR-check inbegrepen.',
    href: '/belasting',
    icon: Receipt,
    accent: '#10B981',
  },
  {
    title: 'Klantportaal',
    description: 'Deel projectvoortgang, bestanden en facturen via een white-label portaal op je eigen domein.',
    href: '/portal',
    icon: Users,
    accent: '#F59E0B',
  },
]

const benefits = [
  'Geen losse tools meer - alles in een dashboard',
  'Uren direct omzetten naar facturen',
  'BTW-aangifte data altijd up-to-date',
  'Professioneel klantportaal onder je eigen merk',
  'Gebouwd voor Nederlandse wetgeving (KvK, BTW, KOR)',
  'Gratis starten, opschalen wanneer je wilt',
]

const pricing = [
  {
    name: 'Gratis',
    price: '0',
    description: 'Om te starten',
    features: ['5 facturen per maand', 'Handmatige urenregistratie', '10 uitgaven per maand', 'Basis dashboard'],
    cta: 'Gratis beginnen',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '14,95',
    description: 'Voor actieve ZZP\'ers',
    features: ['Onbeperkt facturen', 'Timer + projecten', 'Onbeperkt uitgaven', 'Bank import (ING, Rabo, ABN)', 'BTW rapporten + OCR', '1 klantportaal'],
    cta: 'Start 14 dagen gratis',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Professional',
    price: '24,95',
    description: 'Alles onbeperkt',
    features: ['Alles uit Starter', 'Onbeperkt klantportalen', 'Custom domein portaal', 'Terugkerende facturen', 'Betalingsherinneringen', 'Prioriteit support'],
    cta: 'Start 14 dagen gratis',
    href: '/signup',
    highlighted: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-sm">ZP</span>
            </div>
            <span className="font-semibold text-lg">ZZP Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Prijzen</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Inloggen</Link>
            <Link href="/signup" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:bg-foreground/90 transition-colors">
              Gratis starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground mb-4 tracking-wide uppercase">Voor Nederlandse freelancers</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Stop met jongleren tussen 5 tools voor je administratie
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-10">
            Facturatie, uren, belasting en klantportaal in een platform.
            Gebouwd door een ZZP&apos;er, voor ZZP&apos;ers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background font-medium px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors text-base"
            >
              Gratis account aanmaken
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 border border-border font-medium px-6 py-3 rounded-lg hover:bg-secondary transition-colors text-base"
            >
              Bekijk demo
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-border/40 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Gebouwd met de Nederlandse markt in gedachten</p>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <span>ING / Rabo / ABN AMRO</span>
            <span className="hidden sm:inline">BTW 0% / 9% / 21%</span>
            <span>KOR-check</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Alles wat je nodig hebt</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Vier tools, een platform</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group block p-8 rounded-2xl border border-border hover:border-border/80 bg-card hover:shadow-sm transition-all duration-200"
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5"
                  style={{ backgroundColor: `${feature.accent}12`, color: feature.accent }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                <span className="inline-flex items-center text-sm font-medium gap-1 text-foreground/70 group-hover:text-foreground transition-colors">
                  Bekijk module <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-secondary/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="grid sm:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Waarom ZZP Platform</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Je administratie zou geen dagtaak moeten zijn
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                De meeste ZZP&apos;ers gebruiken Moneybird voor facturen, Toggl voor uren,
                Excel voor BTW en e-mail voor klantcommunicatie. Dat is vier keer inloggen,
                vier keer data invoeren en nul integratie.
              </p>
            </div>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-foreground" />
                  </div>
                  <span className="text-[15px]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Eerlijke prijzen</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Betaal alleen voor wat je gebruikt</h2>
          <p className="text-muted-foreground">Geen verborgen kosten. Geen jaarcontract. Maandelijks opzegbaar.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'border-2 border-foreground bg-card shadow-sm'
                  : 'border border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <p className="text-xs font-medium bg-foreground text-background inline-block px-2.5 py-1 rounded-full mb-4">Populairst</p>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">&euro;{plan.price}</span>
                <span className="text-muted-foreground text-sm">/maand</span>
              </div>
              <Link
                href={plan.href}
                className={`block text-center text-sm font-medium py-2.5 rounded-lg mb-6 transition-colors ${
                  plan.highlighted
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'border border-border hover:bg-secondary'
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Klaar om je administratie te vereenvoudigen?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Maak een gratis account aan en ontdek hoe makkelijk je administratie kan zijn.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-foreground text-background font-medium px-8 py-3 rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Gratis beginnen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[10px]">ZP</span>
            </div>
            <span className="text-sm text-muted-foreground">ZZP Platform</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Inloggen</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Registreren</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
