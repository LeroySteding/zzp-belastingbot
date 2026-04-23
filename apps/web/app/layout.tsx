import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ZZP Platform - Facturatie, Boekhouding & Urenregistratie voor ZZP\'ers',
    template: '%s | ZZP Platform',
  },
  description: 'Alles-in-één platform voor ZZP\'ers: facturatie, urenregistratie, BTW aangifte, offertes, klantportaal en lead pipeline. Gratis starten, geen creditcard nodig.',
  keywords: ['ZZP', 'facturatie', 'boekhouding', 'urenregistratie', 'BTW aangifte', 'ZZP administratie', 'freelancer', 'factuur maken', 'offerte maken', 'klantportaal', 'Nederland'],
  authors: [{ name: 'ZZP Platform' }],
  creator: 'ZZP Platform',
  metadataBase: new URL('https://zzpplatform.nl'),
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://zzpplatform.nl',
    siteName: 'ZZP Platform',
    title: 'ZZP Platform - Facturatie, Boekhouding & Urenregistratie',
    description: 'Alles-in-één platform voor ZZP\'ers. Facturatie, urenregistratie, BTW, offertes, klantportaal. Gratis starten.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZZP Platform - Administratie voor ZZP\'ers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZZP Platform - Facturatie & Boekhouding voor ZZP\'ers',
    description: 'Alles-in-één platform voor ZZP\'ers. Gratis starten, geen creditcard nodig.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://zzpplatform.nl',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
