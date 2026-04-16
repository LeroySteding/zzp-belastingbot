'use server';

import { SERVICE_PROFILE } from './service-profile';
import type { ServiceProfile, IdealCustomerProfile, ServiceDefinition } from './service-profile';

// ============================================
// TYPES
// ============================================

export interface ICPProfile {
  industries: { name: string; percentage: number }[];
  companySize: { range: string; percentage: number }[];
  avgDealValue: number;
  topJobTitles: string[];
  locations: string[];
  highValueServices: { description: string; totalRevenue: number }[];
  avgInvoiceValue: number;
  suggestedSearches: SearchProfile[];
  confidence: number;
  dataPoints: {
    clientCount: number;
    invoiceCount: number;
    projectCount: number;
    leadCount: number;
  };
}

export interface SearchProfile {
  id?: string;
  name: string;
  description: string;
  targetIndustry?: string;
  targetCompanySize?: string;
  targetJobTitles: string[];
  targetLocations: string[];
  keywords: string[];
  minCompanySize?: number;
  maxCompanySize?: number;
  estimatedLeadCount?: number;
  relevantService?: string;
  apolloSearchSuggestions?: ApolloSearchSuggestion[];
}

export interface ApolloSearchSuggestion {
  type: 'company' | 'contacts';
  description: string;
  searchParams: {
    domains?: string[];
    industries?: string[];
    locations?: string[];
    jobTitles?: string[];
    companySizeRange?: { min: number; max: number };
    keywords?: string[];
  };
  exampleCompanies?: { name: string; domain: string; reason: string }[];
}

// ============================================
// SERVICE PROFILE ACCESSORS
// ============================================

export function getServiceProfile(): ServiceProfile {
  return SERVICE_PROFILE;
}

export function getICPProfiles(): IdealCustomerProfile[] {
  return SERVICE_PROFILE.idealCustomerProfiles;
}

export function getServices(): ServiceDefinition[] {
  return SERVICE_PROFILE.services;
}

export function getServiceById(serviceId: string): ServiceDefinition | undefined {
  return SERVICE_PROFILE.services.find(s => s.id === serviceId);
}

// ============================================
// ICP ANALYSIS (SERVICE-PROFILE DRIVEN)
// ============================================

/**
 * Build an ICPProfile from the hardcoded service profile.
 * No longer depends on client/invoice data from Supabase.
 */
export async function analyzeICP(): Promise<ICPProfile> {
  const profile = SERVICE_PROFILE;

  // Aggregate industries from all ICPs
  const industryCounts: Record<string, number> = {};
  for (const icp of profile.idealCustomerProfiles) {
    for (const industry of icp.industries) {
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    }
  }
  const totalIndustryCounted = Object.values(industryCounts).reduce((a, b) => a + b, 0) || 1;
  const industries = Object.entries(industryCounts)
    .map(([name, count]) => ({ name, percentage: Math.round((count / totalIndustryCounted) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);

  // Aggregate company sizes from all ICPs
  const sizeRanges = profile.idealCustomerProfiles.map(icp => icp.companySize);
  const sizeCounts: Record<string, number> = {};
  for (const range of sizeRanges) {
    sizeCounts[range] = (sizeCounts[range] || 0) + 1;
  }
  const totalSizeCounted = Object.values(sizeCounts).reduce((a, b) => a + b, 0) || 1;
  const companySize = Object.entries(sizeCounts)
    .map(([range, count]) => ({ range, percentage: Math.round((count / totalSizeCounted) * 100) }))
    .sort((a, b) => b.percentage - a.percentage);

  // Aggregate job titles
  const titleSet = new Set<string>();
  for (const icp of profile.idealCustomerProfiles) {
    for (const title of icp.jobTitles) {
      titleSet.add(title);
    }
  }
  const topJobTitles = Array.from(titleSet).slice(0, 10);

  // Aggregate locations
  const locationSet = new Set<string>();
  for (const icp of profile.idealCustomerProfiles) {
    for (const loc of icp.locations) {
      locationSet.add(loc);
    }
  }
  const locations = Array.from(locationSet);

  // Calculate average deal value from services
  const avgDealValue = Math.round(
    profile.services.reduce((sum, s) => sum + s.avgProjectValue, 0) / profile.services.length
  );

  // Build high-value services list
  const highValueServices = profile.services
    .map(s => ({ description: s.name, totalRevenue: s.avgProjectValue }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const icpProfile: ICPProfile = {
    industries,
    companySize,
    avgDealValue,
    topJobTitles,
    locations,
    highValueServices,
    avgInvoiceValue: avgDealValue,
    suggestedSearches: [],
    confidence: 95, // High confidence: driven by explicit service profile
    dataPoints: {
      clientCount: 0,
      invoiceCount: 0,
      projectCount: 0,
      leadCount: 0,
    },
  };

  // Generate search profiles from the service profile ICPs
  icpProfile.suggestedSearches = generateSearchSuggestions();

  return icpProfile;
}

// ============================================
// SEARCH SUGGESTIONS (SERVICE-PROFILE DRIVEN)
// ============================================

/**
 * Generate concrete Apollo search suggestions based on each ICP.
 * Includes example Dutch companies/domains and contact filters.
 */
export function generateSearchSuggestions(): SearchProfile[] {
  const profiles: SearchProfile[] = [];

  for (const icp of SERVICE_PROFILE.idealCustomerProfiles) {
    const service = SERVICE_PROFILE.services.find(s => s.id === icp.relevantService);
    const sizeRange = parseSizeRange(icp.companySize);

    // Generate 2-3 Apollo search suggestions per ICP
    const apolloSuggestions: ApolloSearchSuggestion[] = [];

    // Suggestion 1: Industry + location search
    apolloSuggestions.push({
      type: 'company',
      description: `Zoek ${icp.industries.slice(0, 2).join(' & ')} bedrijven in ${icp.locations[0]}`,
      searchParams: {
        industries: icp.industries,
        locations: icp.locations,
        companySizeRange: sizeRange,
        keywords: service?.keywords.slice(0, 3) || [],
      },
      exampleCompanies: getExampleCompanies(icp.name),
    });

    // Suggestion 2: Contact search by job title
    apolloSuggestions.push({
      type: 'contacts',
      description: `Vind ${icp.jobTitles.slice(0, 2).join(' / ')} bij ${icp.industries[0]} bedrijven`,
      searchParams: {
        jobTitles: icp.jobTitles,
        industries: icp.industries,
        locations: icp.locations,
        companySizeRange: sizeRange,
      },
    });

    // Suggestion 3: Signal-based search (if relevant)
    if (icp.signals.length > 0) {
      apolloSuggestions.push({
        type: 'company',
        description: `Bedrijven met signaal: ${icp.signals[0]}`,
        searchParams: {
          keywords: [...icp.signals, ...(service?.keywords.slice(0, 2) || [])],
          locations: icp.locations,
          companySizeRange: sizeRange,
        },
      });
    }

    profiles.push({
      name: icp.name,
      description: icp.description,
      targetIndustry: icp.industries[0],
      targetCompanySize: icp.companySize,
      targetJobTitles: icp.jobTitles,
      targetLocations: icp.locations,
      keywords: service?.keywords || [],
      minCompanySize: sizeRange.min,
      maxCompanySize: sizeRange.max,
      estimatedLeadCount: estimateLeadCount(icp),
      relevantService: icp.relevantService,
      apolloSearchSuggestions: apolloSuggestions,
    });
  }

  return profiles;
}

/**
 * Legacy compatibility: generateSearchProfiles wraps generateSearchSuggestions.
 */
export function generateSearchProfiles(_icp?: ICPProfile): SearchProfile[] {
  return generateSearchSuggestions();
}

// ============================================
// HELPERS
// ============================================

function parseSizeRange(companySize: string): { min: number; max: number } {
  const match = companySize.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
  }
  if (companySize.includes('500+')) {
    return { min: 500, max: 10000 };
  }
  return { min: 10, max: 200 };
}

function estimateLeadCount(icp: IdealCustomerProfile): number {
  // Rough estimates based on ICP scope
  const industryFactor = icp.industries.length * 15;
  const locationFactor = icp.locations.includes('Netherlands') ? 2 : icp.locations.length;
  return Math.min(industryFactor * locationFactor, 200);
}

function getExampleCompanies(icpName: string): { name: string; domain: string; reason: string }[] {
  const examples: Record<string, { name: string; domain: string; reason: string }[]> = {
    'Scale-ups met AI behoefte': [
      { name: 'Miro', domain: 'miro.com', reason: 'Groeiende SaaS scale-up, actief in AI integratie' },
      { name: 'Adyen', domain: 'adyen.com', reason: 'FinTech scale-up met complexe data pipelines' },
      { name: 'Messagebird (Bird)', domain: 'bird.com', reason: 'Communicatie-platform, AI chatbot kansen' },
    ],
    'MKB met automatiseringsbehoefte': [
      { name: 'Bol.com', domain: 'bol.com', reason: 'Groot platform met veel operationele processen' },
      { name: 'PostNL', domain: 'postnl.nl', reason: 'Logistiek bedrijf, automatisering van processen' },
      { name: 'DPG Media', domain: 'dpgmedia.nl', reason: 'Mediabedrijf met digitale transformatie' },
    ],
    'Digitale bureaus die capaciteit zoeken': [
      { name: 'Dept Agency', domain: 'deptagency.com', reason: 'Groot digitaal bureau, complex werk' },
      { name: 'MediaMonks', domain: 'mediamonks.com', reason: 'Creatief tech bureau, zoekt senior devs' },
      { name: 'Fabrique', domain: 'fabrique.nl', reason: 'Design & development bureau uit Utrecht' },
    ],
    'E-commerce bedrijven': [
      { name: 'Coolblue', domain: 'coolblue.nl', reason: 'Grote e-commerce speler, eigen tech team' },
      { name: 'Wehkamp', domain: 'wehkamp.nl', reason: 'E-commerce platform, Shopify + custom' },
      { name: 'Rituals', domain: 'rituals.com', reason: 'Premium retail merk met digitale groei' },
    ],
    'Startups die een MVP nodig hebben': [
      { name: 'Startup Amsterdam', domain: 'startupamsterdam.org', reason: 'Hub voor vroege-fase startups' },
      { name: 'UtrechtInc', domain: 'utrechtinc.nl', reason: 'Incubator met startups die MVPs bouwen' },
      { name: 'Rockstart', domain: 'rockstart.com', reason: 'Accelerator met AI/tech startups' },
    ],
  };

  return examples[icpName] || [];
}
