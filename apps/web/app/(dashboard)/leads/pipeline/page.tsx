'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpDown,
  GripVertical,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getLeadsByStage, updateLeadStage } from '@/lib/leads/actions';
import type { Lead } from '@/lib/leads/actions';

const STAGES = [
  { key: 'nieuw', label: 'Nieuw', color: 'border-gray-300', headerBg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' },
  { key: 'gecontacteerd', label: 'Gecontacteerd', color: 'border-blue-300', headerBg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  { key: 'geinteresseerd', label: 'Ge\u00EFnteresseerd', color: 'border-yellow-300', headerBg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  { key: 'offerte', label: 'Offerte', color: 'border-purple-300', headerBg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  { key: 'gewonnen', label: 'Gewonnen', color: 'border-green-300', headerBg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
  { key: 'verloren', label: 'Verloren', color: 'border-red-300', headerBg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
] as const;

const STAGE_KEYS = STAGES.map(s => s.key);

type SortOption = 'date' | 'value' | 'score';
type SourceFilter = 'alle' | 'handmatig' | 'apollo' | 'linkedin' | 'website' | 'referral';

function daysInStage(lead: Lead): number {
  const updated = new Date(lead.updated_at);
  const now = new Date();
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
}

function ScoreDot({ score }: { score: number }) {
  let color = 'bg-gray-300';
  if (score >= 70) color = 'bg-green-500';
  else if (score >= 40) color = 'bg-yellow-500';
  else if (score > 0) color = 'bg-red-400';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={`Score: ${score}`} />;
}

export default function PipelinePage() {
  const [loading, setLoading] = useState(true);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('alle');
  const [movingLead, setMovingLead] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getLeadsByStage();
    setLeadsByStage(data);
    setLoading(false);
  }

  const handleMoveStage = async (leadId: string, direction: 'next' | 'prev') => {
    // Find current stage
    let currentStageKey = '';
    for (const [stage, leads] of Object.entries(leadsByStage)) {
      if (leads.find(l => l.id === leadId)) {
        currentStageKey = stage;
        break;
      }
    }

    const currentIndex = STAGE_KEYS.indexOf(currentStageKey as typeof STAGE_KEYS[number]);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= STAGE_KEYS.length) return;

    const newStage = STAGE_KEYS[newIndex];
    setMovingLead(leadId);

    const updated = await updateLeadStage(leadId, newStage as Lead['stage']);
    if (updated) {
      // Move lead in local state
      setLeadsByStage(prev => {
        const newState = { ...prev };
        const lead = newState[currentStageKey].find(l => l.id === leadId);
        if (lead) {
          newState[currentStageKey] = newState[currentStageKey].filter(l => l.id !== leadId);
          const updatedLead = { ...lead, stage: newStage as Lead['stage'], updated_at: new Date().toISOString() };
          newState[newStage] = [updatedLead, ...(newState[newStage] || [])];
        }
        return newState;
      });
    }
    setMovingLead(null);
  };

  const sortLeads = (leads: Lead[]): Lead[] => {
    const sorted = [...leads];
    switch (sortBy) {
      case 'value':
        return sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
      case 'score':
        return sorted.sort((a, b) => b.score - a.score);
      default:
        return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  };

  const filterLeads = (leads: Lead[]): Lead[] => {
    if (sourceFilter === 'alle') return leads;
    return leads.filter(l => l.source === sourceFilter);
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Pipeline laden...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Board</h1>
          <p className="text-muted-foreground mt-1">Sleep leads door je pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Source filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
            >
              <option value="alle">Alle bronnen</option>
              <option value="handmatig">Handmatig</option>
              <option value="apollo">Apollo</option>
              <option value="linkedin">LinkedIn</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
            </select>
          </div>
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
            >
              <option value="date">Datum</option>
              <option value="value">Waarde</option>
              <option value="score">Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const leads = sortLeads(filterLeads(leadsByStage[stage.key] || []));
            const stageValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
            return (
              <div
                key={stage.key}
                className={`w-72 flex-shrink-0 rounded-xl border-2 ${stage.color} bg-background`}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 rounded-t-lg ${stage.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.badge}`}>
                      {leads.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(stageValue)}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {leads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Geen leads
                    </div>
                  ) : (
                    leads.map((lead) => {
                      const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ');
                      const stageIndex = STAGE_KEYS.indexOf(stage.key);
                      const canMoveLeft = stageIndex > 0;
                      const canMoveRight = stageIndex < STAGE_KEYS.length - 1;
                      const days = daysInStage(lead);
                      const isMoving = movingLead === lead.id;

                      return (
                        <div
                          key={lead.id}
                          className={`rounded-lg border border-border bg-background p-3 hover:shadow-md transition-all ${isMoving ? 'opacity-50' : ''}`}
                        >
                          <Link href={`/leads/${lead.id}`} className="block">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {displayName && (
                                  <p className="font-medium text-sm truncate">{displayName}</p>
                                )}
                                <p className="text-xs text-muted-foreground truncate">{lead.company_name}</p>
                                {lead.job_title && (
                                  <p className="text-xs text-muted-foreground truncate">{lead.job_title}</p>
                                )}
                              </div>
                              <ScoreDot score={lead.score} />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              {lead.value ? (
                                <span className="text-xs font-semibold text-green-600">
                                  {formatCurrency(lead.value)}
                                </span>
                              ) : (
                                <span />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {days === 0 ? 'vandaag' : `${days}d`}
                              </span>
                            </div>
                          </Link>
                          {/* Move buttons */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <button
                              onClick={() => handleMoveStage(lead.id, 'prev')}
                              disabled={!canMoveLeft || isMoving}
                              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                              title="Vorige stap"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <GripVertical className="h-3 w-3 text-muted-foreground/30" />
                            <button
                              onClick={() => handleMoveStage(lead.id, 'next')}
                              disabled={!canMoveRight || isMoving}
                              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                              title="Volgende stap"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
