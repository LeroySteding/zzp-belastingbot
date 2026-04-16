'use server';

import { createClient } from '@/lib/supabase/server';
import { analyzeICP, generateSearchProfiles } from './icp-analyzer';
import type { SearchProfile } from './icp-analyzer';

// ============================================
// TYPES
// ============================================

export interface StoredSearchProfile {
  id: string;
  user_id: string;
  name: string;
  description: string;
  target_industry: string | null;
  target_company_size: string | null;
  target_job_titles: string[];
  target_locations: string[];
  keywords: string[];
  min_company_size: number | null;
  max_company_size: number | null;
  estimated_lead_count: number | null;
  is_ai_suggested: boolean;
  created_at: string;
  updated_at: string;
}

export type SearchProfileInput = {
  name: string;
  description: string;
  target_industry?: string;
  target_company_size?: string;
  target_job_titles: string[];
  target_locations: string[];
  keywords: string[];
  min_company_size?: number;
  max_company_size?: number;
  estimated_lead_count?: number;
  is_ai_suggested?: boolean;
};

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getSearchProfiles(): Promise<StoredSearchProfile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('search_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data as StoredSearchProfile[];
}

export async function createSearchProfile(input: SearchProfileInput): Promise<StoredSearchProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('search_profiles')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      target_industry: input.target_industry || null,
      target_company_size: input.target_company_size || null,
      target_job_titles: input.target_job_titles || [],
      target_locations: input.target_locations || [],
      keywords: input.keywords || [],
      min_company_size: input.min_company_size || null,
      max_company_size: input.max_company_size || null,
      estimated_lead_count: input.estimated_lead_count || null,
      is_ai_suggested: input.is_ai_suggested || false,
    })
    .select()
    .single();

  if (error || !data) return null;

  return data as StoredSearchProfile;
}

export async function updateSearchProfile(
  id: string,
  updates: Partial<SearchProfileInput>
): Promise<StoredSearchProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.target_industry !== undefined) updateData.target_industry = updates.target_industry;
  if (updates.target_company_size !== undefined) updateData.target_company_size = updates.target_company_size;
  if (updates.target_job_titles !== undefined) updateData.target_job_titles = updates.target_job_titles;
  if (updates.target_locations !== undefined) updateData.target_locations = updates.target_locations;
  if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
  if (updates.min_company_size !== undefined) updateData.min_company_size = updates.min_company_size;
  if (updates.max_company_size !== undefined) updateData.max_company_size = updates.max_company_size;
  if (updates.estimated_lead_count !== undefined) updateData.estimated_lead_count = updates.estimated_lead_count;

  const { data, error } = await supabase
    .from('search_profiles')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  return data as StoredSearchProfile;
}

export async function deleteSearchProfile(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('search_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function getSearchProfileSuggestions(): Promise<SearchProfile[]> {
  const icp = await analyzeICP();
  return generateSearchProfiles(icp);
}

export async function saveAISuggestedProfile(suggestion: SearchProfile): Promise<StoredSearchProfile | null> {
  return createSearchProfile({
    name: suggestion.name,
    description: suggestion.description,
    target_industry: suggestion.targetIndustry,
    target_company_size: suggestion.targetCompanySize,
    target_job_titles: suggestion.targetJobTitles,
    target_locations: suggestion.targetLocations,
    keywords: suggestion.keywords,
    min_company_size: suggestion.minCompanySize,
    max_company_size: suggestion.maxCompanySize,
    estimated_lead_count: suggestion.estimatedLeadCount,
    is_ai_suggested: true,
  });
}
