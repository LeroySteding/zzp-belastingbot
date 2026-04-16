// ============================================
// Apollo.io REST API Client
// ============================================
// Search & Enrichment APIs for lead prospecting.
// Requires env var APOLLO_API_KEY.

const APOLLO_API_URL = 'https://api.apollo.io/api/v1';

// ============================================
// TYPES
// ============================================

export interface ApolloPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  title: string | null;
  headline: string | null;
  linkedin_url: string | null;
  email: string | null;
  organization_name: string | null;
  organization_id: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  departments: string[];
  seniority: string | null;
  photo_url: string | null;
}

export interface ApolloOrganization {
  id: string;
  name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  primary_domain: string | null;
  industry: string | null;
  estimated_num_employees: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  short_description: string | null;
  logo_url: string | null;
  keywords: string[];
  founded_year: number | null;
}

export interface ApolloSearchResult {
  people: ApolloPerson[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface ApolloCompanyResult {
  organizations: ApolloOrganization[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface ApolloApiError {
  message: string;
  status?: number;
}

// ============================================
// HELPERS
// ============================================

function getApiKey(): string | null {
  return process.env.APOLLO_API_KEY || null;
}

export function isApolloConfigured(): boolean {
  return !!getApiKey();
}

async function apolloFetch<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('APOLLO_API_KEY is niet geconfigureerd');
  }

  const response = await fetch(`${APOLLO_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({ api_key: apiKey, ...body }),
  });

  if (!response.ok) {
    let errorMessage = `Apollo API fout: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ============================================
// PEOPLE SEARCH
// ============================================

export async function searchPeople(params: {
  domains?: string[];
  titles?: string[];
  locations?: string[];
  employeeRanges?: string[];
  keywords?: string[];
  page?: number;
  perPage?: number;
}): Promise<ApolloSearchResult> {
  const body: Record<string, unknown> = {
    page: params.page || 1,
    per_page: params.perPage || 25,
  };

  if (params.domains && params.domains.length > 0) {
    body.q_organization_domains_list = params.domains;
  }
  if (params.titles && params.titles.length > 0) {
    body.person_titles = params.titles;
  }
  if (params.locations && params.locations.length > 0) {
    body.person_locations = params.locations;
  }
  if (params.employeeRanges && params.employeeRanges.length > 0) {
    body.organization_num_employees_ranges = params.employeeRanges;
  }
  if (params.keywords && params.keywords.length > 0) {
    body.q_keywords = params.keywords.join(' ');
  }

  const result = await apolloFetch<{
    people: ApolloPerson[];
    pagination: {
      page: number;
      per_page: number;
      total_entries: number;
      total_pages: number;
    };
  }>('/mixed_people/search', body);

  return {
    people: result.people || [],
    pagination: result.pagination || {
      page: params.page || 1,
      per_page: params.perPage || 25,
      total_entries: 0,
      total_pages: 0,
    },
  };
}

// ============================================
// COMPANY / ORGANIZATION SEARCH
// ============================================

export async function searchCompanies(params: {
  keywords?: string[];
  locations?: string[];
  employeeRanges?: string[];
  industries?: string[];
  page?: number;
  perPage?: number;
}): Promise<ApolloCompanyResult> {
  const body: Record<string, unknown> = {
    page: params.page || 1,
    per_page: params.perPage || 25,
  };

  if (params.keywords && params.keywords.length > 0) {
    body.q_organization_keyword_tags = params.keywords;
  }
  if (params.locations && params.locations.length > 0) {
    body.organization_locations = params.locations;
  }
  if (params.employeeRanges && params.employeeRanges.length > 0) {
    body.organization_num_employees_ranges = params.employeeRanges;
  }
  if (params.industries && params.industries.length > 0) {
    body.organization_industry_tag_ids = params.industries;
  }

  const result = await apolloFetch<{
    organizations: ApolloOrganization[];
    pagination: {
      page: number;
      per_page: number;
      total_entries: number;
      total_pages: number;
    };
  }>('/mixed_companies/search', body);

  return {
    organizations: result.organizations || [],
    pagination: result.pagination || {
      page: params.page || 1,
      per_page: params.perPage || 25,
      total_entries: 0,
      total_pages: 0,
    },
  };
}

// ============================================
// PEOPLE ENRICHMENT
// ============================================

export async function enrichPerson(params: {
  linkedinUrl?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}): Promise<ApolloPerson | null> {
  const body: Record<string, unknown> = {};

  if (params.linkedinUrl) {
    body.linkedin_url = params.linkedinUrl;
  }
  if (params.email) {
    body.email = params.email;
  }
  if (params.firstName) {
    body.first_name = params.firstName;
  }
  if (params.lastName) {
    body.last_name = params.lastName;
  }
  if (params.organizationName) {
    body.organization_name = params.organizationName;
  }

  // Must provide at least one identifier
  if (Object.keys(body).length === 0) {
    return null;
  }

  try {
    const result = await apolloFetch<{ person: ApolloPerson | null }>(
      '/people/match',
      body
    );
    return result.person || null;
  } catch {
    return null;
  }
}
