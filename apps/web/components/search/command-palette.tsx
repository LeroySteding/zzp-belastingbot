'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Users,
  FolderOpen,
  Receipt,
  ScrollText,
  Target,
  FileCheck,
  Loader2,
  Plus,
  Clock,
} from 'lucide-react';
import { globalSearch, type SearchResult } from '@/lib/search/actions';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<
  SearchResult['type'],
  { label: string; icon: React.ElementType; color: string }
> = {
  invoice: { label: 'Facturen', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  client: { label: 'Klanten', icon: Users, color: 'bg-emerald-100 text-emerald-700' },
  project: { label: 'Projecten', icon: FolderOpen, color: 'bg-purple-100 text-purple-700' },
  expense: { label: 'Uitgaven', icon: Receipt, color: 'bg-orange-100 text-orange-700' },
  offerte: { label: 'Offertes', icon: ScrollText, color: 'bg-indigo-100 text-indigo-700' },
  lead: { label: 'Leads', icon: Target, color: 'bg-pink-100 text-pink-700' },
  contract: { label: 'Contracten', icon: FileCheck, color: 'bg-teal-100 text-teal-700' },
};

const QUICK_ACTIONS = [
  { label: 'Nieuwe factuur', href: '/dashboard/invoices/new', icon: Plus },
  { label: 'Uren registreren', href: '/dashboard/uren', icon: Clock },
  { label: 'Nieuwe offerte', href: '/dashboard/offertes/new', icon: ScrollText },
  { label: 'Uitgave toevoegen', href: '/dashboard/expenses', icon: Receipt },
  { label: 'Nieuw contract', href: '/dashboard/contracts/new', icon: FileCheck },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Groepeer resultaten op type
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {});

  // Maak een platte lijst voor keyboard navigatie
  const flatResults = Object.values(groupedResults).flat();
  const showQuickActions = query.length === 0 && results.length === 0;
  const totalItems = showQuickActions ? QUICK_ACTIONS.length : flatResults.length;

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input wanneer modal opent
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      // Kleine vertraging zodat de modal zichtbaar is
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced zoekactie
  const doSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(searchQuery);
      setResults(data);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Scroll geselecteerd item in beeld
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;
    const selected = container.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const navigateTo = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (showQuickActions && QUICK_ACTIONS[selectedIndex]) {
          navigateTo(QUICK_ACTIONS[selectedIndex].href);
        } else if (flatResults[selectedIndex]) {
          navigateTo(flatResults[selectedIndex].href);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onOpenChange(false);
        break;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 bg-background rounded-xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoekinvoer */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {loading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zoeken naar facturen, klanten, projecten..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            Esc
          </kbd>
        </div>

        {/* Resultaten */}
        <div ref={resultsContainerRef} className="max-h-80 overflow-y-auto">
          {/* Snelacties (voordat er getypt wordt) */}
          {showQuickActions && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Snelacties
              </p>
              {QUICK_ACTIONS.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.href}
                    data-selected={index === selectedIndex}
                    onClick={() => navigateTo(action.href)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors',
                      index === selectedIndex
                        ? 'bg-muted/80 text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Laadstatus */}
          {loading && query.length >= 2 && results.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Zoeken...</span>
            </div>
          )}

          {/* Geen resultaten */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Geen resultaten voor &apos;{query}&apos;
              </p>
            </div>
          )}

          {/* Gegroepeerde resultaten */}
          {Object.entries(groupedResults).map(([type, items]) => {
            const config = TYPE_CONFIG[type as SearchResult['type']];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <div key={type} className="py-2">
                <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {config.label}
                </p>
                {items.map((result) => {
                  const globalIndex = flatResults.indexOf(result);
                  return (
                    <button
                      key={result.id}
                      data-selected={globalIndex === selectedIndex}
                      onClick={() => navigateTo(result.href)}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-muted/80 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          config.color,
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                          config.color,
                        )}
                      >
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer met keyboard hints */}
        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30">
          <span className="text-[11px] text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded border border-border bg-background text-[10px] mr-1">
              ↑↓
            </kbd>
            navigeren
          </span>
          <span className="text-[11px] text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded border border-border bg-background text-[10px] mr-1">
              Enter
            </kbd>
            openen
          </span>
          <span className="text-[11px] text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded border border-border bg-background text-[10px] mr-1">
              Esc
            </kbd>
            sluiten
          </span>
        </div>
      </div>
    </div>
  );
}
