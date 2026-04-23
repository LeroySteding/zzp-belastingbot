'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { getLeads, getPipelineStats, getSavedSearches, deleteSavedSearch } from '@/lib/leads/actions';
import type { Lead, PipelineStats, SavedSearch } from '@/lib/leads/actions';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  nieuw: { label: 'Nieuw', color: 'text-foreground', bg: 'bg-muted' },
  gecontacteerd: { label: 'Gecontacteerd', color: 'text-blue-700', bg: 'bg-blue-100' },
  geinteresseerd: { label: 'Ge\u00EFnteresseerd', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  offerte: { label: 'Offerte', color: 'text-purple-700', bg: 'bg-purple-100' },
  gewonnen: { label: 'Gewonnen', color: 'text-green-700', bg: 'bg-green-100' },
  verloren: { label: 'Verloren', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function LeadsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    async function load() {
      const [statsData, leadsData, searchesData] = await Promise.all([
        getPipelineStats(),
        getLeads(),
        getSavedSearches(),
      ]);
      setStats(statsData);
      setRecentLeads(leadsData.slice(0, 10));
      setSavedSearches(searchesData);
      setLoading(false);
    }
    load();
  }, []);

  const handleDeleteSearch = async (id: string) => {
    if (confirm('Weet je zeker dat je deze zoekopdracht wilt verwijderen?')) {
      const success = await deleteSavedSearch(id);
      if (success) {
        setSavedSearches(savedSearches.filter(s => s.id !== id));
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Leads laden...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lead Pipeline</h1>
          <p className="text-muted-foreground mt-1">Beheer je prospects en leads</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/leads/search"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm font-medium"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Zoek</span> Prospects
          </Link>
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Lead</span> Toevoegen
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-premium p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal Leads</p>
                <p className="text-2xl font-bold mt-1">{stats.totalLeads}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'oklch(0.65 0.25 250 / 0.15)', color: 'oklch(0.65 0.25 250)' }}>
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Waarde</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'oklch(0.6 0.18 150 / 0.15)', color: 'oklch(0.6 0.18 150)' }}>
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversie Ratio</p>
                <p className="text-2xl font-bold mt-1">{stats.conversionRate}%</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'oklch(0.7 0.2 80 / 0.15)', color: 'oklch(0.7 0.2 80)' }}>
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Offertes</p>
                <p className="text-2xl font-bold mt-1">{stats.stages.offerte || 0}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'oklch(0.65 0.26 300 / 0.15)', color: 'oklch(0.65 0.26 300)' }}>
                <Target className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Pipeline */}
      {stats && (
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pipeline Overzicht</h2>
            <Link
              href="/leads/pipeline"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Kanban Board <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(STAGE_CONFIG).map(([key, config]) => (
              <Link
                key={key}
                href={`/leads/pipeline`}
                className={`rounded-lg p-3 text-center transition-colors hover:opacity-80 ${config.bg}`}
              >
                <p className={`text-2xl font-bold ${config.color}`}>{stats.stages[key] || 0}</p>
                <p className={`text-xs font-medium mt-1 ${config.color}`}>{config.label}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leads */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recente Leads</h2>
          <Link
            href="/leads/pipeline"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Alle leads <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nog geen leads"
            description="Voeg je eerste lead toe om je sales pipeline te starten."
            actionLabel="Lead toevoegen"
            actionHref="/leads/new"
          />
        ) : (
          <div className="divide-y divide-border">
            {recentLeads.map((lead) => {
              const stageConfig = STAGE_CONFIG[lead.stage];
              const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.company_name;
              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between py-3 hover:bg-card-hover px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {(lead.first_name?.[0] || lead.company_name[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company_name}{lead.job_title ? ` \u2022 ${lead.job_title}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lead.value && (
                      <span className="text-sm font-medium">{formatCurrency(lead.value)}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageConfig.bg} ${stageConfig.color}`}>
                      {stageConfig.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Opgeslagen Zoekopdrachten</h2>
          <div className="divide-y divide-border">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium">{search.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {search.search_type === 'company' ? 'Bedrijf' : 'Contacten'} \u2022{' '}
                    {search.result_count} resultaten \u2022{' '}
                    {formatDate(search.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/leads/search"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
