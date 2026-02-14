import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { 
  CheckCircle2, 
  FileText, 
  Calculator, 
  ScanLine,
  BarChart3,
  Clock,
  Shield,
  Zap,
  ChevronRight,
  Star
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZZP Tax - BTW Aangifte in 3 Klikken | Automatische Bonscanner',
  description: 'Beheer je zakelijke uitgaven en BTW-administratie met gemak. Automatische bonscanner, BTW-berekening en kwartaalrapporten voor ZZP&apos;ers.',
  openGraph: {
    title: 'ZZP Tax - BTW Aangifte in 3 Klikken',
    description: 'Automatische bonscanner, BTW-berekening en kwartaalrapporten voor ZZP&apos;ers.',
    type: 'website',
    locale: 'nl_NL',
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            ZZP Tax
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Functies
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Prijzen
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Inloggen</Button>
            </Link>
            <Link href="/signup">
              <Button>Gratis Starten</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            🚀 Nieuw: Automatische bonscanner met AI
          </div>
          <h1 className="mb-6 text-4xl md:text-6xl font-bold tracking-tight">
            BTW Aangifte in <span className="text-primary">3 Klikken</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop met bonnetjes verzamelen in schoenendozen. Scan je bon, wij berekenen je BTW. 
            Kwartaalrapport klaar in minuten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                Gratis Proberen
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto">
                Hoe het werkt
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            ✓ Geen creditcard vereist  ✓ Opzeggen wanneer je wilt  ✓ GDPR-compliant
          </p>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="border-y bg-muted/30 py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Herkenbaar?
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="text-red-500 mt-1">✗</div>
                    <p>Je verzamelt bonnetjes in een la (of verliest ze)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-red-500 mt-1">✗</div>
                    <p>Kwartaaleinde = paniek en Excel-sheets tot diep in de nacht</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-red-500 mt-1">✗</div>
                    <p>Je betaalt je boekhouder €100+ per kwartaal voor basiswerk</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-red-500 mt-1">✗</div>
                    <p>BTW-aftrek gemist = geld weggooien</p>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  <span className="text-primary">Oplossing:</span> ZZP Tax
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="text-green-500 mt-1">✓</div>
                    <p>Scan je bon → automatisch ingevoerd (datum, bedrag, BTW)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-green-500 mt-1">✓</div>
                    <p>Kwartaalrapport genereren in 30 seconden</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-green-500 mt-1">✓</div>
                    <p>Dashboard toont direct hoeveel je terugkrijgt</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-green-500 mt-1">✓</div>
                    <p>Altijd inzicht in je uitgaven per categorie</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles wat je nodig hebt
            </h2>
            <p className="text-xl text-muted-foreground">
              Speciaal gebouwd voor Nederlandse ZZP&apos;ers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Scanner */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <ScanLine className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Bon Scanner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Maak een foto van je bon. AI leest automatisch bedrag, datum, leverancier en BTW-tarief.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Google Vision AI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Werkt met foto&apos;s en PDF&apos;s</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Herkent NL bonformaten</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: BTW Berekening */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">BTW Berekening</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Automatische berekening van alle BTW-rubrieken volgens Belastingdienst-standaard.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>0%, 9% en 21% BTW</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Splitst excl/incl bedragen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Toont teruggaaf direct</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3: Kwartaalrapport */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Kwartaalrapport</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Genereer een compleet BTW-rapport met één klik. Download als PDF voor je boekhouder.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Alle uitgaven per categorie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>BTW-rubriek overzicht</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Professional PDF export</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <Clock className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Bespaar tijd</h3>
                <p className="text-sm text-muted-foreground">Van uren naar minuten per kwartaal</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Shield className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Veilig & privé</h3>
                <p className="text-sm text-muted-foreground">Bank-level encryptie, GDPR-compliant</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Zap className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Altijd actueel</h3>
                <p className="text-sm text-muted-foreground">Automatische updates volgens laatste regels</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-y bg-muted/30 py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Eerlijke prijzen, geen verrassingen
              </h2>
              <p className="text-xl text-muted-foreground">
                Kies het plan dat bij je past. Altijd opzegbaar.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Free Tier */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Gratis</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€0</span>
                    <span className="text-muted-foreground">/maand</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Max 10 uitgaven/maand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Basis dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Handmatige invoer</span>
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <span className="ml-7">Geen bonscanner</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full">
                      Gratis Starten
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Basis Tier */}
              <Card className="border-primary shadow-lg relative">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                  POPULAIR
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Basis</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€9</span>
                    <span className="text-muted-foreground">/maand</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Onbeperkt uitgaven</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Bonscanner (50/maand)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>BTW-rapporten + PDF</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Alle categorieën</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full">
                      Kies Basis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€15</span>
                    <span className="text-muted-foreground">/maand</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Alles van Basis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Onbeperkt scannen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Batch upload (10+ bonnen)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Prio support</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full">
                      Kies Pro
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <p className="text-center mt-8 text-muted-foreground">
              Alle plannen: maandelijks opzegbaar, geen setup kosten, 14 dagen bedenktijd
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Wat andere ZZP&apos;ers zeggen
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  Eindelijk snap ik mijn BTW-teruggaaf. De scanner werkt perfect, scheelt me uren werk per kwartaal!
                </p>
                <p className="text-sm font-semibold">Lisa, Grafisch Ontwerper</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  Was altijd bang om BTW-aftrek te missen. Nu heb ik alles overzichtelijk. De PDF kan direct naar m&apos;n boekhouder.
                </p>
                <p className="text-sm font-semibold">Jeroen, IT Consultant</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  Super overzichtelijk dashboard. Ik zie direct waar mijn geld heen gaat en hoeveel BTW ik terugkrijg.
                </p>
                <p className="text-sm font-semibold">Emma, Fotograaf</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Veelgestelde vragen
            </h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hoe werkt de bonscanner precies?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Je maakt een foto van je bon (of upload een PDF). Google Vision AI leest de tekst en haalt er automatisch 
                  het bedrag, datum, leverancier en BTW-tarief uit. Je kunt alles nog controleren en aanpassen voor je opslaat.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is dit een vervanging voor mijn boekhouder?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Nee, ZZP Tax helpt je met de voorbereiding: uitgaven bijhouden en BTW-rapporten maken. Voor jaarcijfers 
                  en ingewikkelde fiscale zaken heb je nog steeds een boekhouder nodig. Maar je bespaart wel kosten 
                  omdat veel basiswerk al gedaan is.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Worden mijn gegevens veilig opgeslagen?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Ja! Alle data wordt versleuteld opgeslagen bij Supabase (EU-servers). We zijn GDPR-compliant. 
                  Je bonafbeeldingen worden niet permanent opgeslagen, alleen de geëxtraheerde informatie.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kan ik overstappen tussen plannen?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Absoluut! Je kunt altijd upgraden (met onmiddellijke activering) of downgraden (aan het einde van je betaalperiode). 
                  Ook kun je maandelijks opzeggen zonder verplichtingen.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Wat als ik meer dan 50 bonnen per maand heb?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Dan is het Pro-plan (€15/maand) perfect voor jou. Met Pro kun je onbeperkt scannen en zelfs meerdere 
                  bonnen tegelijk uploaden. Of je voert extra bonnen handmatig in (dat kan altijd, ook op Basis).
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Werkt dit ook voor andere belastingen dan BTW?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Nu focussen we op BTW-administratie, omdat dat voor de meeste ZZP&apos;ers het meest tijdrovend is. 
                  In de toekomst willen we uitbreiden met inkomstenbelasting-features zoals kilometeradministratie.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Klaar om tijd te besparen?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Doe je eerste BTW-aangifte in minder dan 5 minuten. Gratis account aanmaken duurt 30 seconden.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Gratis Account Aanmaken
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Geen creditcard nodig • Opzeggen wanneer je wilt • Direct beginnen
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <FileText className="h-5 w-5" />
                ZZP Tax
              </div>
              <p className="text-sm text-muted-foreground">
                BTW-administratie makkelijk gemaakt voor Nederlandse ZZP&apos;ers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Functies</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Prijzen</a></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Ondersteuning</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="mailto:support@zzptax.nl" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="/docs" className="hover:text-foreground transition-colors">Documentatie</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Juridisch</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Voorwaarden</a></li>
                <li><a href="/cookies" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ZZP Tax. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
