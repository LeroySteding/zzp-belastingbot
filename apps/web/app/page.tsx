import Link from 'next/link'
import { FileText, Clock, Receipt, Users, Check, ArrowRight, ChevronRight, Target, ScrollText, Sparkles, ScanLine, RotateCcw, Bell, CreditCard, TrendingUp, Shield, Zap, BarChart3, Building2, Landmark } from 'lucide-react'
import LandingNav from '@/components/landing/nav'
import StatCounters from '@/components/landing/stat-counters'

const testimonials = [
  { name: 'Lisa de Vries', initials: 'LV', role: 'Freelance Designer', quote: 'Sinds ik ZZP Platform gebruik, besteed ik 3 uur per week minder aan administratie. De BTW berekening is een lifesaver.' },
  { name: 'Mark Jansen', initials: 'MJ', role: 'IT Consultant', quote: 'Eindelijk een platform dat snapt wat een ZZP\'er nodig heeft. Geen overbodige features, alles werkt gewoon.' },
  { name: 'Sophie Bakker', initials: 'SB', role: 'Content Specialist', quote: 'De combinatie van facturatie en urenregistratie bespaart mij enorm veel tijd. En de klantportaal is super professioneel.' },
]

const comparison = [
  { feature: 'Startprijs', zzp: '€0/mnd', moneybird: '€14/mnd', freshbooks: '€17/mnd' },
  { feature: 'Facturatie', zzp: true, moneybird: true, freshbooks: true },
  { feature: 'Urenregistratie', zzp: true, moneybird: false, freshbooks: true },
  { feature: 'Offertes', zzp: true, moneybird: true, freshbooks: true },
  { feature: 'BTW Aangifte', zzp: true, moneybird: true, freshbooks: false },
  { feature: 'Klantportaal', zzp: true, moneybird: false, freshbooks: false },
  { feature: 'Lead Pipeline / CRM', zzp: true, moneybird: false, freshbooks: false },
  { feature: 'AI Assistent', zzp: true, moneybird: false, freshbooks: false },
  { feature: 'Contracten', zzp: true, moneybird: false, freshbooks: false },
  { feature: 'Bank import (5 banken)', zzp: true, moneybird: true, freshbooks: false },
  { feature: 'OCR Bon Scanner', zzp: true, moneybird: true, freshbooks: true },
  { feature: 'iDEAL Betaallinks', zzp: true, moneybird: true, freshbooks: false },
]

const modules = [
  {
    title: 'Facturatie',
    description: 'Professionele facturen in 1 minuut. PDF generatie, email met betaallink, automatische nummeropvolging.',
    icon: FileText,
    accent: '#3B82F6',
    features: ['PDF export', 'Email verzending', 'iDEAL betaallinks', 'Meerdere templates'],
  },
  {
    title: 'Offertes',
    description: 'Maak offertes die met 1 klik een factuur worden. Volg de status en stuur herinneringen.',
    icon: ScrollText,
    accent: '#6366F1',
    features: ['Offerte naar factuur', 'Status tracking', 'PDF & email', 'Geldigheid bijhouden'],
  },
  {
    title: 'Urenregistratie',
    description: 'Start een timer of voer handmatig in. Koppel uren aan projecten en genereer urenstaten.',
    icon: Clock,
    accent: '#8B5CF6',
    features: ['Live timer', 'Projecten & budgetten', 'Urenstaten export', 'Budget waarschuwingen'],
  },
  {
    title: 'Boekhouding & BTW',
    description: 'Scan bonnetjes met OCR, importeer bankafschriften en genereer je kwartaalaangifte automatisch.',
    icon: Receipt,
    accent: '#10B981',
    features: ['OCR bon scanner', 'Bank import (5 banken)', 'BTW kwartaalrapport', 'KOR-check'],
  },
  {
    title: 'Klantportaal',
    description: 'Deel projectvoortgang, bestanden en facturen via een white-label portaal onder je eigen merk.',
    icon: Users,
    accent: '#F59E0B',
    features: ['White-label', 'Milestones', 'Bestanden delen', 'Berichten'],
  },
  {
    title: 'Lead Pipeline',
    description: 'Vind prospects, volg leads door je pipeline en converteer ze naar klanten. Met Apollo integratie.',
    icon: Target,
    accent: '#EF4444',
    features: ['Kanban board', 'Apollo search', 'Lead scoring', 'Outreach templates'],
  },
]

const extraFeatures = [
  { icon: RotateCcw, title: 'Recurring facturen', desc: 'Automatisch maandelijks of per kwartaal' },
  { icon: Bell, title: 'Betalingsherinneringen', desc: 'Automatische emails voor verlopen facturen' },
  { icon: CreditCard, title: 'Mollie iDEAL', desc: 'Klanten betalen direct via betaallink' },
  { icon: Sparkles, title: 'AI Assistent', desc: 'Stel financiele vragen in gewoon Nederlands' },
  { icon: TrendingUp, title: 'Winst/verlies dashboard', desc: 'P&L overzicht met forecasting' },
  { icon: ScrollText, title: 'Contracten', desc: 'Templates voor freelance, project en NDA' },
  { icon: ScanLine, title: 'OCR Bon Scanner', desc: 'Foto van bon wordt automatisch een uitgave' },
  { icon: Building2, title: 'Team toegang', desc: 'Geef je boekhouder of medewerker toegang' },
  { icon: Landmark, title: 'Bank koppelingen', desc: 'ING, Rabobank, ABN AMRO, Knab, Revolut' },
  { icon: BarChart3, title: 'BTW Rapporten', desc: 'Kwartaalrapport met PDF download' },
  { icon: Shield, title: 'Nederlandse wetgeving', desc: 'KvK, BTW, KOR - alles ingebouwd' },
  { icon: Zap, title: 'Snelle setup', desc: 'Account aanmaken en factureren in 2 minuten' },
]

const pricing = [
  {
    name: 'Gratis',
    price: '0',
    period: 'voor altijd',
    description: 'Perfect om te starten',
    features: ['3 facturen per maand', '1 project', 'Basis boekhouding', 'BTW berekening', 'PDF export'],
    cta: 'Gratis beginnen',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '19',
    period: 'per maand',
    description: 'Voor actieve ZZP\'ers',
    features: ['Onbeperkt facturen', '10 projecten', 'Alle modules', 'PDF & email verzending', 'Bank import (5 banken)', 'OCR bon scanner', 'Recurring facturen', 'Betalingsherinneringen', 'AI Assistent'],
    cta: 'Start met Pro',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '39',
    period: 'per maand',
    description: 'Alles wat je nodig hebt',
    features: ['Alles van Pro', 'Onbeperkt projecten', 'Team toegang (5 leden)', 'Klantportaal (white-label)', 'Lead pipeline & CRM', 'Contracten module', 'Bank koppelingen (PSD2)', 'Mollie iDEAL betaallinks', 'Prioriteit support'],
    cta: 'Start met Business',
    href: '/signup',
    highlighted: false,
  },
]

const faqs = [
  { q: 'Is het echt gratis om te starten?', a: 'Ja, het gratis plan is voor altijd gratis. Je kunt 3 facturen per maand maken, 1 project beheren en basis boekhouding doen. Geen creditcard nodig.' },
  { q: 'Moet ik BTW-plichtig zijn?', a: 'Nee, het platform werkt voor alle ZZP\'ers. Als je onder de KOR valt (omzet onder 20.000 per jaar), detecteert het systeem dit automatisch en past de BTW-berekening aan.' },
  { q: 'Kan ik mijn boekhouder toegang geven?', a: 'Ja, met het Business plan kun je tot 5 teamleden uitnodigen met verschillende rollen: boekhouder (alleen lezen), medewerker (facturen maken) of beheerder.' },
  { q: 'Welke banken worden ondersteund?', a: 'Je kunt CSV-bestanden importeren van ING, Rabobank, ABN AMRO, Knab en Revolut. PSD2 bank koppelingen (live synchronisatie) zijn beschikbaar in het Business plan.' },
  { q: 'Hoe werkt de factuur email?', a: 'Je maakt een factuur, klikt op verzenden, en je klant ontvangt een professionele email met de factuur als PDF bijlage en optioneel een iDEAL betaallink.' },
  { q: 'Kan ik overstappen van Moneybird of FreshBooks?', a: 'Je kunt je bestaande klanten en producten handmatig overzetten. CSV import van bankafschriften werkt direct. Een volledige migratie tool komt binnenkort.' },
  { q: 'Is mijn data veilig?', a: 'Ja, alle data wordt opgeslagen in een beveiligde Supabase database met Row Level Security. Alleen jij hebt toegang tot je eigen gegevens. Wij verkopen nooit je data.' },
  { q: 'Hoe zeg ik op?', a: 'Maandelijks opzegbaar, geen jaarcontract. Ga naar Instellingen en klik op Abonnement opzeggen. Je data blijft 30 dagen beschikbaar na opzegging.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <LandingNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-sm text-muted-foreground mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Het #1 platform voor Nederlandse ZZP&apos;ers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Je complete administratie in een platform
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-10">
            Facturatie, offertes, urenregistratie, boekhouding, klantportaal en CRM.
            Alles wat je als ZZP&apos;er nodig hebt. Gebouwd door een ZZP&apos;er, voor ZZP&apos;ers.
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
              href="/demo"
              className="inline-flex items-center justify-center gap-2 border border-border font-medium px-6 py-3 rounded-lg hover:bg-secondary transition-colors text-base"
            >
              Bekijk demo
            </Link>
          </div>
        </div>
        <StatCounters />
      </section>

      {/* Dashboard mockup */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
          {/* Top bar */}
          <div className="h-10 bg-secondary/50 border-b border-border flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
            <span className="text-xs text-muted-foreground ml-2">dashboard</span>
          </div>
          {/* Fake dashboard content */}
          <div className="p-6 space-y-4">
            {/* 4 mini stat cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Open facturen', value: '€4.250', color: '#3B82F6' },
                { label: 'Uren deze week', value: '32,5u', color: '#8B5CF6' },
                { label: 'BTW Q2', value: '€1.245', color: '#10B981' },
                { label: 'Projecten', value: '4', color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold" style={{color: s.color}}>{s.value}</p>
                </div>
              ))}
            </div>
            {/* Fake bar chart */}
            <div className="h-32 flex items-end gap-1.5 px-2">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{height: `${h}%`, backgroundColor: i === 11 ? '#3B82F6' : '#3B82F620'}} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/40 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Koppelt met je bank</p>
          <div className="flex items-center gap-6 sm:gap-8 text-sm text-muted-foreground flex-wrap justify-center">
            <span className="font-medium">ING</span>
            <span className="font-medium">Rabobank</span>
            <span className="font-medium">ABN AMRO</span>
            <span className="font-medium">Knab</span>
            <span className="font-medium">Revolut</span>
            <span className="font-medium">Mollie</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Herkenbaar?</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">De meeste ZZP&apos;ers worstelen hiermee</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { title: '5 losse tools', desc: 'Moneybird voor facturen, Toggl voor uren, Excel voor BTW, WeTransfer voor bestanden. Niks werkt samen.' },
            { title: 'Uren kwijt aan admin', desc: 'Elke week uren bezig met factureren, BTW uitrekenen en klanten mailen. Tijd die je aan je vak kunt besteden.' },
            { title: 'Geen financieel overzicht', desc: 'Hoeveel omzet heb je dit kwartaal? Hoeveel BTW moet je afdragen? Je weet het pas als je boekhouder belt.' },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-2xl border border-border bg-card">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="bg-secondary/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="mb-14">
            <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Alles in een platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Zes krachtige modules</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <div
                  key={mod.title}
                  className="p-8 rounded-2xl border border-border bg-card hover:shadow-sm transition-all duration-200"
                >
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5"
                    style={{ backgroundColor: `${mod.accent}12`, color: mod.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{mod.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-[15px]">{mod.description}</p>
                  <ul className="space-y-1.5">
                    {mod.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Extra features grid */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">En nog veel meer</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Alles wat een ZZP&apos;er nodig heeft</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {extraFeatures.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="p-4 rounded-xl border border-border bg-card">
                <Icon className="h-5 w-5 text-muted-foreground mb-3" />
                <h4 className="font-medium text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Simpel</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">In 3 stappen aan de slag</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Maak een account', desc: 'Gratis aanmelden met je email. Duurt minder dan een minuut.' },
              { step: '2', title: 'Vul je gegevens in', desc: 'Bedrijfsnaam, KvK, BTW-nummer en IBAN. De onboarding wizard helpt je.' },
              { step: '3', title: 'Maak je eerste factuur', desc: 'Voeg een klant toe, maak een factuur en verstuur hem als PDF met betaallink.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Ervaringen</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Wat ZZP&apos;ers zeggen</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="p-6 rounded-2xl border border-border bg-card">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400">&#9733;</span>)}
              </div>
              <p className="text-[15px] leading-relaxed mb-4 text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm">{t.initials}</div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-secondary/30 border-y border-border/40">
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Vergelijk</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Waarom overstappen?</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold">ZZP Platform</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">Moneybird</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">FreshBooks</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-3 pr-4">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.zzp === 'string' ? (
                        <span className="font-semibold">{row.zzp}</span>
                      ) : row.zzp ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.moneybird === 'string' ? (
                        <span className="text-muted-foreground">{row.moneybird}</span>
                      ) : row.moneybird ? (
                        <Check className="h-4 w-4 text-muted-foreground mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.freshbooks === 'string' ? (
                        <span className="text-muted-foreground">{row.freshbooks}</span>
                      ) : row.freshbooks ? (
                        <Check className="h-4 w-4 text-muted-foreground mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Eerlijke prijzen</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Betaal alleen voor wat je gebruikt</h2>
          <p className="text-muted-foreground">
            Geen verborgen kosten. Geen jaarcontract. Maandelijks opzegbaar.
          </p>
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
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
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

      {/* FAQ */}
      <section id="faq" className="bg-secondary/30 border-y border-border/40">
        <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">Veelgestelde vragen</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Alles wat je wilt weten</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-card">
                <summary className="flex items-center justify-between cursor-pointer p-5 text-[15px] font-medium">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Klaar om je administratie te vereenvoudigen?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Maak een gratis account aan en ontdek waarom honderden ZZP&apos;ers al zijn overgestapt.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background font-medium px-8 py-3 rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Gratis beginnen <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 border border-border font-medium px-8 py-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Bekijk demo
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
            <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
