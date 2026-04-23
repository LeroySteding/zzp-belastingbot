'use server';

import { createClient } from '@/lib/supabase/server';
import { analyzeICP } from './icp-analyzer';
import type { ICPProfile } from './icp-analyzer';
import type { Lead } from './actions';

// ============================================
// TYPES
// ============================================

export interface LeadScoreBreakdown {
  total: number;
  industryMatch: { score: number; maxScore: number; reason: string };
  companySizeMatch: { score: number; maxScore: number; reason: string };
  jobTitleMatch: { score: number; maxScore: number; reason: string };
  locationMatch: { score: number; maxScore: number; reason: string };
  valuePotential: { score: number; maxScore: number; reason: string };
  engagement: { score: number; maxScore: number; reason: string };
}

export interface ScoredLead extends Lead {
  scoreBreakdown: LeadScoreBreakdown;
}

// ============================================
// SCORING ALGORITHM
// ============================================

export function calculateLeadScore(lead: Lead, icp: ICPProfile): LeadScoreBreakdown {
  const breakdown: LeadScoreBreakdown = {
    total: 0,
    industryMatch: { score: 0, maxScore: 25, reason: 'Geen branche-informatie' },
    companySizeMatch: { score: 0, maxScore: 15, reason: 'Geen bedrijfsgrootte-informatie' },
    jobTitleMatch: { score: 0, maxScore: 20, reason: 'Geen functietitel' },
    locationMatch: { score: 0, maxScore: 10, reason: 'Geen locatie-informatie' },
    valuePotential: { score: 0, maxScore: 15, reason: 'Geen waardering beschikbaar' },
    engagement: { score: 0, maxScore: 15, reason: 'Nog geen interactie' },
  };

  // Industry match (0-25 points)
  if (lead.company_industry && icp.industries.length > 0) {
    const leadIndustry = lead.company_industry.toLowerCase();
    const matchedIndustry = icp.industries.find(i =>
      leadIndustry.includes(i.name.toLowerCase()) ||
      i.name.toLowerCase().includes(leadIndustry)
    );

    if (matchedIndustry) {
      // Higher score for stronger matches in the ICP
      const industryWeight = matchedIndustry.percentage / 100;
      breakdown.industryMatch.score = Math.round(25 * (0.6 + 0.4 * industryWeight));
      breakdown.industryMatch.reason = `Match met "${matchedIndustry.name}" (${matchedIndustry.percentage}% van je klanten)`;
    } else {
      // Partial credit for having industry data
      breakdown.industryMatch.score = 5;
      breakdown.industryMatch.reason = `Branche "${lead.company_industry}" komt niet overeen met je typische klanten`;
    }
  }

  // Company size match (0-15 points)
  if (lead.company_size && icp.companySize.length > 0) {
    const leadSize = lead.company_size.toLowerCase();
    const matchedSize = icp.companySize.find(s =>
      leadSize.includes(s.range) || s.range.includes(leadSize)
    );

    if (matchedSize) {
      const sizeWeight = matchedSize.percentage / 100;
      breakdown.companySizeMatch.score = Math.round(15 * (0.6 + 0.4 * sizeWeight));
      breakdown.companySizeMatch.reason = `Bedrijfsgrootte ${matchedSize.range} past (${matchedSize.percentage}% van je klanten)`;
    } else {
      breakdown.companySizeMatch.score = 3;
      breakdown.companySizeMatch.reason = `Grootte "${lead.company_size}" wijkt af van je typische klanten`;
    }
  }

  // Job title match (0-20 points)
  if (lead.job_title && icp.topJobTitles.length > 0) {
    const leadTitle = lead.job_title.toLowerCase();
    const exactMatch = icp.topJobTitles.find(t => leadTitle.includes(t.toLowerCase()));
    const partialMatch = icp.topJobTitles.find(t => {
      const words = t.toLowerCase().split(' ');
      return words.some(w => w.length > 3 && leadTitle.includes(w));
    });

    if (exactMatch) {
      breakdown.jobTitleMatch.score = 20;
      breakdown.jobTitleMatch.reason = `"${lead.job_title}" matcht met veelvoorkomende titel "${exactMatch}"`;
    } else if (partialMatch) {
      breakdown.jobTitleMatch.score = 12;
      breakdown.jobTitleMatch.reason = `"${lead.job_title}" lijkt op "${partialMatch}"`;
    } else {
      // Check for decision-maker titles
      const decisionMakerKeywords = ['directeur', 'eigenaar', 'ceo', 'cto', 'cmo', 'head', 'manager', 'founder', 'oprichter', 'partner'];
      const isDecisionMaker = decisionMakerKeywords.some(k => leadTitle.includes(k));
      if (isDecisionMaker) {
        breakdown.jobTitleMatch.score = 15;
        breakdown.jobTitleMatch.reason = `"${lead.job_title}" is een beslisser`;
      } else {
        breakdown.jobTitleMatch.score = 5;
        breakdown.jobTitleMatch.reason = `"${lead.job_title}" is geen typische beslisser`;
      }
    }
  }

  // Location match (0-10 points)
  if (lead.company_location && icp.locations.length > 0) {
    const leadLocation = lead.company_location.toLowerCase();
    const exactMatch = icp.locations.find(l => leadLocation.includes(l.toLowerCase()));

    if (exactMatch) {
      breakdown.locationMatch.score = 10;
      breakdown.locationMatch.reason = `Locatie "${lead.company_location}" matcht met "${exactMatch}"`;
    } else if (leadLocation.includes('nederland') || leadLocation.includes('netherlands')) {
      breakdown.locationMatch.score = 5;
      breakdown.locationMatch.reason = `In Nederland maar niet in je primaire regio`;
    } else {
      breakdown.locationMatch.score = 2;
      breakdown.locationMatch.reason = `Locatie "${lead.company_location}" buiten je gebruikelijke werkgebied`;
    }
  }

  // Value potential (0-15 points)
  if (lead.value && lead.value > 0) {
    if (icp.avgDealValue > 0) {
      const ratio = lead.value / icp.avgDealValue;
      if (ratio >= 1.5) {
        breakdown.valuePotential.score = 15;
        breakdown.valuePotential.reason = `Waarde boven je gemiddelde dealwaarde`;
      } else if (ratio >= 0.8) {
        breakdown.valuePotential.score = 12;
        breakdown.valuePotential.reason = `Waarde rond je gemiddelde dealwaarde`;
      } else if (ratio >= 0.4) {
        breakdown.valuePotential.score = 8;
        breakdown.valuePotential.reason = `Waarde onder je gemiddelde maar redelijk`;
      } else {
        breakdown.valuePotential.score = 4;
        breakdown.valuePotential.reason = `Lage waarde vergeleken met je gemiddelde deal`;
      }
    } else {
      breakdown.valuePotential.score = 10;
      breakdown.valuePotential.reason = `Heeft een geschatte waarde van \u20AC${lead.value}`;
    }
  }

  // Engagement (0-15 points)
  if (lead.stage === 'geinteresseerd' || lead.stage === 'offerte') {
    breakdown.engagement.score = 15;
    breakdown.engagement.reason = `Lead is actief ge\u00EFnteresseerd`;
  } else if (lead.stage === 'gecontacteerd') {
    breakdown.engagement.score = 10;
    breakdown.engagement.reason = `Lead is al gecontacteerd`;
  } else if (lead.last_contacted_at) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact <= 7) {
      breakdown.engagement.score = 12;
      breakdown.engagement.reason = `Recent contact (${daysSinceContact} dagen geleden)`;
    } else if (daysSinceContact <= 30) {
      breakdown.engagement.score = 8;
      breakdown.engagement.reason = `Contact ${daysSinceContact} dagen geleden`;
    } else {
      breakdown.engagement.score = 4;
      breakdown.engagement.reason = `Lang geleden gecontacteerd (${daysSinceContact} dagen)`;
    }
  } else if (lead.stage === 'nieuw') {
    breakdown.engagement.score = 3;
    breakdown.engagement.reason = `Nieuwe lead, nog niet benaderd`;
  }

  breakdown.total = Math.min(
    breakdown.industryMatch.score +
    breakdown.companySizeMatch.score +
    breakdown.jobTitleMatch.score +
    breakdown.locationMatch.score +
    breakdown.valuePotential.score +
    breakdown.engagement.score,
    100
  );

  return breakdown;
}

// ============================================
// BATCH OPERATIONS
// ============================================

export async function scoreAllLeads(): Promise<ScoredLead[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [icp, { data: leads }] = await Promise.all([
    analyzeICP(),
    supabase.from('leads').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);

  if (!leads) return [];

  const scored: ScoredLead[] = [];

  for (const lead of leads) {
    const scoreBreakdown = calculateLeadScore(lead as Lead, icp);

    // Update the score in the database
    await supabase
      .from('leads')
      .update({ score: scoreBreakdown.total })
      .eq('id', lead.id)
      .eq('user_id', user.id);

    scored.push({
      ...(lead as Lead),
      score: scoreBreakdown.total,
      scoreBreakdown,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

export async function scoreLead(leadId: string): Promise<LeadScoreBreakdown | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [icp, { data: lead }] = await Promise.all([
    analyzeICP(),
    supabase.from('leads').select('*').eq('id', leadId).eq('user_id', user.id).single(),
  ]);

  if (!lead) return null;

  const breakdown = calculateLeadScore(lead as Lead, icp);

  // Update score in DB
  await supabase
    .from('leads')
    .update({ score: breakdown.total })
    .eq('id', leadId)
    .eq('user_id', user.id);

  return breakdown;
}

export async function getTopLeads(limit: number = 10): Promise<ScoredLead[]> {
  const scored = await scoreAllLeads();
  return scored.slice(0, limit);
}
