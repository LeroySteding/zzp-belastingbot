'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ScrollText,
  Plus,
  Loader2,
  Trash2,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { getContracts, deleteContract, type Contract } from '@/lib/contracts/actions';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  concept: { label: 'Concept', color: 'text-foreground', bg: 'bg-muted', icon: FileText },
  verzonden: { label: 'Verzonden', color: 'text-blue-700', bg: 'bg-blue-100', icon: Send },
  ondertekend: { label: 'Ondertekend', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  actief: { label: 'Actief', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  verlopen: { label: 'Verlopen', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  opgezegd: { label: 'Opgezegd', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

export default function ContractsPage() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState<string>('alle');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getContracts();
      setContracts(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je dit contract wilt verwijderen?')) {
      const success = await deleteContract(id);
      if (success) {
        setContracts(contracts.filter((c) => c.id !== id));
      }
    }
  };

  const filtered = contracts.filter((c) => {
    if (filter !== 'alle' && c.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.clientName || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts = contracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Contracten laden...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contracten</h1>
          <p className="text-muted-foreground mt-1">
            Beheer je overeenkomsten en contracten
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nieuw Contract
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op titel of klant..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm bg-background"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilter('alle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'alle'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Alle ({contracts.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {config.label} ({statusCounts[key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      {filtered.length === 0 ? (
        <div className="card-premium p-6">
          {contracts.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Nog geen contracten"
              description="Maak je eerste contract aan met een van onze templates."
              actionLabel="Nieuw contract"
              actionHref="/contracts/new"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="Geen resultaten"
              description="Probeer een ander zoekwoord of filter."
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contract) => {
            const statusConf = STATUS_CONFIG[contract.status] || STATUS_CONFIG.concept;
            const StatusIcon = statusConf.icon;

            return (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="card-premium p-5 flex items-center justify-between group hover:border-primary/20 transition-colors block"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="p-2.5 rounded-xl shrink-0"
                    style={{ backgroundColor: 'oklch(0.65 0.25 250 / 0.1)' }}
                  >
                    <ScrollText className="h-5 w-5" style={{ color: 'oklch(0.65 0.25 250)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{contract.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {contract.clientName || 'Geen klant'}
                      {contract.startDate && ` \u2022 Vanaf ${formatDate(contract.startDate)}`}
                      {contract.endDate && ` t/m ${formatDate(contract.endDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {(contract.hourlyRate || contract.fixedPrice) && (
                    <span className="text-sm font-medium hidden sm:inline">
                      {contract.fixedPrice
                        ? formatCurrency(contract.fixedPrice)
                        : `${formatCurrency(contract.hourlyRate!)}/u`}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusConf.bg} ${statusConf.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConf.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(contract.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
