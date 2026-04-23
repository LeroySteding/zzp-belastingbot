'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Prijzen' },
  { href: '/demo', label: 'Demo' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-sm">ZP</span>
          </div>
          <span className="font-semibold text-lg">ZZP Platform</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Inloggen
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Gratis starten
          </Link>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="sm:hidden p-2 -mr-2 text-foreground"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="relative bg-background w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <span className="text-background font-bold text-sm">ZP</span>
                </div>
                <span className="font-semibold text-lg">ZZP Platform</span>
              </div>
              <button
                className="p-2 -mr-2 text-foreground"
                onClick={() => setOpen(false)}
                aria-label="Sluit menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-1 p-6 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium py-3 text-foreground hover:text-foreground/80 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-lg font-medium py-3 text-foreground hover:text-foreground/80 transition-colors"
              >
                Inloggen
              </Link>
              <div className="mt-6">
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block text-center text-base font-medium bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors"
                >
                  Gratis starten
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
