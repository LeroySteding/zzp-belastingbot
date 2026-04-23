'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

export interface Lead {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  job_title: string | null;
  company_name: string;
  company_domain: string | null;
  company_linkedin: string | null;
  company_size: string | null;
  company_industry: string | null;
  company_location: string | null;
  stage: 'nieuw' | 'gecontacteerd' | 'geinteresseerd' | 'offerte' | 'gewonnen' | 'verloren';
  score: number;
  value: number | null;
  source: 'handmatig' | 'apollo' | 'linkedin' | 'website' | 'referral';
  apollo_search_id: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  converted_client_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  type: 'notitie' | 'email' | 'telefoon' | 'meeting' | 'offerte' | 'status_change' | 'enrichment';
  content: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_type: 'company' | 'contacts';
  search_params: Record<string, any>;
  apollo_task_id: string | null;
  result_count: number;
  created_at: string;
}

export interface PipelineStats {
  stages: Record<string, number>;
  totalValue: number;
  totalLeads: number;
  conversionRate: number;
}

export type LeadInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  job_title?: string;
  company_name: string;
  company_domain?: string;
  company_linkedin?: string;
  company_size?: string;
  company_industry?: string;
  company_location?: string;
  stage?: Lead['stage'];
  score?: number;
  value?: number;
  source?: Lead['source'];
  apollo_search_id?: string;
  notes?: string;
  next_followup_at?: string;
};

// ============================================
// LEADS CRUD
// ============================================

export async function getLeads(stage?: string, search?: string): Promise<Lead[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (stage && stage !== 'alle') {
    query = query.eq('stage', stage);
  }

  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return data as Lead;
}

export async function createLead(input: LeadInput): Promise<Lead | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('leads')
    .insert({
      user_id: user.id,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      email: input.email || null,
      phone: input.phone || null,
      linkedin_url: input.linkedin_url || null,
      job_title: input.job_title || null,
      company_name: input.company_name,
      company_domain: input.company_domain || null,
      company_linkedin: input.company_linkedin || null,
      company_size: input.company_size || null,
      company_industry: input.company_industry || null,
      company_location: input.company_location || null,
      stage: input.stage || 'nieuw',
      score: input.score || 0,
      value: input.value || null,
      source: input.source || 'handmatig',
      apollo_search_id: input.apollo_search_id || null,
      notes: input.notes || null,
      next_followup_at: input.next_followup_at || null,
    })
    .select()
    .single();

  if (error || !data) return null;

  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<LeadInput>): Promise<Lead | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  return data as Lead;
}

export async function updateLeadStage(id: string, stage: Lead['stage']): Promise<Lead | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get current lead to log the change
  const { data: current } = await supabase
    .from('leads')
    .select('stage')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!current) return null;

  const oldStage = current.stage;

  const updateData: Record<string, any> = { stage };
  if (stage === 'gecontacteerd' || stage === 'geinteresseerd' || stage === 'offerte') {
    updateData.last_contacted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  // Log the stage change as an activity
  await supabase.from('lead_activities').insert({
    lead_id: id,
    user_id: user.id,
    type: 'status_change',
    content: `Stage gewijzigd van "${oldStage}" naar "${stage}"`,
    metadata: { old_stage: oldStage, new_stage: stage },
  });

  return data as Lead;
}

export async function deleteLead(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// ACTIVITIES
// ============================================

export async function addLeadActivity(
  leadId: string,
  type: LeadActivity['type'],
  content: string,
  metadata?: Record<string, any>
): Promise<LeadActivity | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      user_id: user.id,
      type,
      content,
      metadata: metadata || null,
    })
    .select()
    .single();

  if (error || !data) return null;

  // Update last_contacted_at on the lead if relevant
  if (['email', 'telefoon', 'meeting'].includes(type)) {
    await supabase
      .from('leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('user_id', user.id);
  }

  return data as LeadActivity;
}

export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data as LeadActivity[];
}

// ============================================
// CONVERSION
// ============================================

export async function convertLeadToClient(leadId: string): Promise<{ clientId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get lead data
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('user_id', user.id)
    .single();

  if (!lead) return null;

  // Create client from lead data
  const clientName = lead.company_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Onbekend';
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: clientName,
      email: lead.email || '',
      address: lead.company_location || '',
    })
    .select('id')
    .single();

  if (clientError || !client) return null;

  // Update lead with conversion info
  await supabase
    .from('leads')
    .update({
      stage: 'gewonnen',
      converted_client_id: client.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('user_id', user.id);

  // Log the conversion activity
  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    user_id: user.id,
    type: 'status_change',
    content: `Lead geconverteerd naar klant "${clientName}"`,
    metadata: { client_id: client.id },
  });

  return { clientId: client.id };
}

// ============================================
// PIPELINE STATS
// ============================================

export async function getPipelineStats(): Promise<PipelineStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { stages: {}, totalValue: 0, totalLeads: 0, conversionRate: 0 };

  const { data: leads } = await supabase
    .from('leads')
    .select('stage, value')
    .eq('user_id', user.id);

  if (!leads) return { stages: {}, totalValue: 0, totalLeads: 0, conversionRate: 0 };

  const stages: Record<string, number> = {
    nieuw: 0,
    gecontacteerd: 0,
    geinteresseerd: 0,
    offerte: 0,
    gewonnen: 0,
    verloren: 0,
  };

  let totalValue = 0;
  let wonCount = 0;
  let closedCount = 0;

  for (const lead of leads) {
    stages[lead.stage] = (stages[lead.stage] || 0) + 1;
    if (lead.value) totalValue += Number(lead.value);
    if (lead.stage === 'gewonnen') {
      wonCount++;
      closedCount++;
    }
    if (lead.stage === 'verloren') {
      closedCount++;
    }
  }

  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  return {
    stages,
    totalValue,
    totalLeads: leads.length,
    conversionRate,
  };
}

export async function getLeadsByStage(): Promise<Record<string, Lead[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (!leads) return {};

  const grouped: Record<string, Lead[]> = {
    nieuw: [],
    gecontacteerd: [],
    geinteresseerd: [],
    offerte: [],
    gewonnen: [],
    verloren: [],
  };

  for (const lead of leads) {
    if (grouped[lead.stage]) {
      grouped[lead.stage].push(lead as Lead);
    }
  }

  return grouped;
}

// ============================================
// APOLLO IMPORT
// ============================================

export async function importFromApollo(
  contacts: Array<{
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    job_title?: string;
  }>,
  companyData: {
    company_name: string;
    company_domain?: string;
    company_linkedin?: string;
    company_size?: string;
    company_industry?: string;
    company_location?: string;
  },
  apolloTaskId?: string
): Promise<{ imported: number; errors: string[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { imported: 0, errors: ['Niet ingelogd'] };

  let imported = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    const { error } = await supabase.from('leads').insert({
      user_id: user.id,
      first_name: contact.first_name || null,
      last_name: contact.last_name || null,
      email: contact.email || null,
      phone: contact.phone || null,
      linkedin_url: contact.linkedin_url || null,
      job_title: contact.job_title || null,
      company_name: companyData.company_name,
      company_domain: companyData.company_domain || null,
      company_linkedin: companyData.company_linkedin || null,
      company_size: companyData.company_size || null,
      company_industry: companyData.company_industry || null,
      company_location: companyData.company_location || null,
      stage: 'nieuw',
      source: 'apollo',
      apollo_search_id: apolloTaskId || null,
    });

    if (error) {
      errors.push(`Fout bij importeren ${contact.first_name} ${contact.last_name}: ${error.message}`);
    } else {
      imported++;
    }
  }

  return { imported, errors };
}

// ============================================
// SAVED SEARCHES
// ============================================

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data as SavedSearch[];
}

export async function saveSearch(
  name: string,
  searchType: 'company' | 'contacts',
  searchParams: Record<string, any>,
  apolloTaskId?: string,
  resultCount?: number
): Promise<SavedSearch | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: user.id,
      name,
      search_type: searchType,
      search_params: searchParams,
      apollo_task_id: apolloTaskId || null,
      result_count: resultCount || 0,
    })
    .select()
    .single();

  if (error || !data) return null;

  return data as SavedSearch;
}

export async function deleteSavedSearch(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}
