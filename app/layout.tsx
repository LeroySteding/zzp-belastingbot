import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "ZZP Tax - BTW Aangifte in 3 Klikken",
    template: "%s | ZZP Tax"
  },
  description: "Automatische bonscanner, BTW-berekening en kwartaalrapporten voor Nederlandse ZZP'ers. Bespaar tijd op je BTW-administratie.",
  keywords: ["ZZP", "BTW", "belasting", "administratie", "bonscanner", "OCR", "kwartaalrapport", "zelfstandige"],
  authors: [{ name: "ZZP Tax" }],
  creator: "ZZP Tax",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "/",
    siteName: "ZZP Tax",
    title: "ZZP Tax - BTW Aangifte in 3 Klikken",
    description: "Automatische bonscanner, BTW-berekening en kwartaalrapporten voor Nederlandse ZZP'ers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZZP Tax - BTW Aangifte in 3 Klikken",
    description: "Automatische bonscanner, BTW-berekening en kwartaalrapporten voor Nederlandse ZZP'ers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
