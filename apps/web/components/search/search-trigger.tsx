'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { CommandPalette } from './command-palette';

export function SearchTrigger() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setSearchOpen(true)}
        aria-label="Zoeken (Ctrl+K)"
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors"
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Zoeken...</span>
        <kbd className="hidden sm:inline text-xs bg-background px-1.5 py-0.5 rounded border border-border ml-2" aria-hidden="true">
          ⌘K
        </kbd>
      </button>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
