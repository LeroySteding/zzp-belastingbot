'use server';

import { createClient } from '@/lib/supabase/server';

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
  confidence: number; // 0-100, based on data availability
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
}

// ============================================
// INDUSTRY KEYWORDS MAPPING
// ============================================

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Marketing & Communicatie': ['marketing', 'communicatie', 'reclame', 'advertising', 'branding', 'media', 'pr', 'content'],
  'IT & Software': ['software', 'it', 'tech', 'digital', 'web', 'app', 'saas', 'cloud', 'data', 'cyber'],
  'E-commerce': ['ecommerce', 'e-commerce', 'webshop', 'online', 'retail', 'shop'],
  'Financieel': ['finance', 'bank', 'verzekering', 'accountant', 'boekhouding', 'financieel', 'fintech'],
  'Gezondheidszorg': ['health', 'zorg', 'medisch', 'kliniek', 'apotheek', 'fysiotherapie'],
  'Onderwijs': ['school', 'onderwijs', 'training', 'opleiding', 'coaching', 'academy'],
  'Bouw & Vastgoed': ['bouw', 'vastgoed', 'makelaardij', 'architectuur', 'constructie', 'immobilien'],
  'Horeca': ['restaurant', 'hotel', 'catering', 'horeca', 'café', 'bar'],
  'Creatief & Design': ['design', 'creative', 'studio', 'fotografie', 'video', 'grafisch', 'kunst'],
  'Juridisch': ['advocaat', 'juridisch', 'notaris', 'legal', 'recht'],
  'Consultancy': ['consultancy', 'advies', 'consulting', 'bureau', 'agency'],
  'Productie & Industrie': ['productie', 'fabriek', 'manufacturing', 'industrie', 'logistiek'],
};

const SERVICE_KEYWORDS: Record<string, string[]> = {
  'Webontwikkeling': ['website', 'web', 'frontend', 'backend', 'react', 'next', 'wordpress', 'webshop'],
  'App ontwikkeling': ['app', 'mobile', 'ios', 'android', 'react native', 'flutter'],
  'Design & UX': ['design', 'ux', 'ui', 'branding', 'huisstijl', 'logo', 'grafisch'],
  'Marketing': ['marketing', 'seo', 'social media', 'campagne', 'content', 'advertising'],
  'Consulting': ['advies', 'strategie', 'consulting', 'analyse', 'optimalisatie'],
  'Boekhouding & Administratie': ['boekhouding', 'administratie', 'btw', 'belasting', 'jaarrekening'],
  'Copywriting': ['tekst', 'copy', 'content', 'blog', 'artikel', 'redactie'],
  'Fotografie & Video': ['fotografie', 'video', 'film', 'productie', 'editing'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function classifyIndustry(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return industry;
      }
    }
  }
  return null;
}

function classifyService(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return service;
      }
    }
  }
  return null;
}

function extractCompanySizeRange(size: string | null): string {
  if (!size) return 'Onbekend';
  const lower = size.toLowerCase();
  if (lower.includes('1-10') || lower.includes('micro') || lower.includes('zzp') || lower.includes('solo')) return '1-10';
  if (lower.includes('11-50') || lower.includes('klein') || lower.includes('small')) return '11-50';
  if (lower.includes('51-200') || lower.includes('middelgroot') || lower.includes('medium')) return '51-200';
  if (lower.includes('201-500') || lower.includes('groot') || lower.includes('large')) return '201-500';
  if (lower.includes('500+') || lower.includes('enterprise') || lower.includes('corporate')) return '500+';
  // Try to parse a number
  const num = parseInt(size);
  if (!isNaN(num)) {
    if (num <= 10) return '1-10';
    if (num <= 50) return '11-50';
    if (num <= 200) return '51-200';
    if (num <= 500) return '201-500';
    return '500+';
  }
  return 'Onbekend';
}

// ============================================
// MAIN ANALYSIS
// ============================================

export async function analyzeICP(): Promise<ICPProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return emptyProfile();
  }

  // Fetch all relevant data in parallel
  const [
    { data: clients },
    { data: invoices },
    { data: invoiceItems },
    { data: projects },
    { data: leads },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id),
    supabase.from('invoices').select('*').eq('user_id', user.id),
    supabase.from('invoice_items').select('*, invoices!inner(user_id)').eq('invoices.user_id', user.id),
    supabase.from('projects').select('*').eq('user_id', user.id),
    supabase.from('leads').select('*').eq('user_id', user.id),
  ]);

  const clientList = clients || [];
  const invoiceList = invoices || [];
  const itemList = invoiceItems || [];
  const projectList = projects || [];
  const leadList = leads || [];

  // Calculate confidence based on data availability
  let confidence = 0;
  if (clientList.length >= 1) confidence += 20;
  if (clientList.length >= 5) confidence += 10;
  if (invoiceList.length >= 1) confidence += 20;
  if (invoiceList.length >= 5) confidence += 10;
  if (projectList.length >= 1) confidence += 15;
  if (leadList.length >= 3) confidence += 10;
  if (itemList.length >= 3) confidence += 15;
  confidence = Math.min(confidence, 100);

  // --- Analyze industries ---
  const industryCounts: Record<string, number> = {};
  const allTexts: string[] = [];

  for (const client of clientList) {
    const searchText = [client.name, client.notes, client.email].filter(Boolean).join(' ');
    allTexts.push(searchText);
    const industry = classifyIndustry(searchText);
    if (industry) {
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    }
  }

  // Also check leads for industry data
  for (const lead of leadList) {
    if (lead.company_industry) {
      const industry = classifyIndustry(lead.company_industry) || lead.company_industry;
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    }
  }

  const totalIndustryCounted = Object.values(industryCounts).reduce((a, b) => a + b, 0) || 1;
  const industries = Object.entries(industryCounts)
    .map(([name, count]) => ({ name, percentage: Math.round((count / totalIndustryCounted) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // --- Analyze company sizes ---
  const sizeCounts: Record<string, number> = {};

  for (const lead of leadList) {
    const range = extractCompanySizeRange(lead.company_size);
    if (range !== 'Onbekend') {
      sizeCounts[range] = (sizeCounts[range] || 0) + 1;
    }
  }

  // If no lead data, assume ZZP clients target small businesses
  if (Object.keys(sizeCounts).length === 0 && clientList.length > 0) {
    sizeCounts['1-10'] = Math.ceil(clientList.length * 0.4);
    sizeCounts['11-50'] = Math.ceil(clientList.length * 0.35);
    sizeCounts['51-200'] = Math.ceil(clientList.length * 0.25);
  }

  const totalSizeCounted = Object.values(sizeCounts).reduce((a, b) => a + b, 0) || 1;
  const companySize = Object.entries(sizeCounts)
    .map(([range, count]) => ({ range, percentage: Math.round((count / totalSizeCounted) * 100) }))
    .sort((a, b) => b.percentage - a.percentage);

  // --- Analyze invoices ---
  const invoiceAmounts = invoiceList
    .map((inv: any) => Number(inv.total_amount || inv.amount || 0))
    .filter((a: number) => a > 0);
  const avgInvoiceValue = invoiceAmounts.length > 0
    ? Math.round(invoiceAmounts.reduce((a: number, b: number) => a + b, 0) / invoiceAmounts.length)
    : 0;

  // Analyze invoice items for services
  const serviceRevenue: Record<string, number> = {};
  for (const item of itemList) {
    const desc = item.description || '';
    const amount = Number(item.amount || item.total || 0);
    const service = classifyService(desc) || desc.substring(0, 50);
    if (service) {
      serviceRevenue[service] = (serviceRevenue[service] || 0) + amount;
    }
  }

  const highValueServices = Object.entries(serviceRevenue)
    .map(([description, totalRevenue]) => ({ description, totalRevenue }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // --- Analyze deal values ---
  const dealValues = [
    ...invoiceAmounts,
    ...leadList.filter((l: any) => l.value).map((l: any) => Number(l.value)),
  ];
  const avgDealValue = dealValues.length > 0
    ? Math.round(dealValues.reduce((a, b) => a + b, 0) / dealValues.length)
    : 2500; // Default for ZZP

  // --- Analyze job titles ---
  const titleCounts: Record<string, number> = {};
  for (const lead of leadList) {
    if (lead.job_title) {
      const title = lead.job_title.toLowerCase().trim();
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    }
  }

  // Add common ZZP target titles if no data
  const topJobTitles = Object.entries(titleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title]) => title);

  if (topJobTitles.length === 0) {
    topJobTitles.push('eigenaar', 'directeur', 'manager', 'cto', 'marketing manager');
  }

  // --- Analyze locations ---
  const locationCounts: Record<string, number> = {};

  for (const client of clientList) {
    if (client.address) {
      // Try to extract city from address
      const parts = (client.address as string).split(',').map((s: string) => s.trim());
      const city = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      if (city && city.length > 1) {
        locationCounts[city] = (locationCounts[city] || 0) + 1;
      }
    }
  }

  for (const lead of leadList) {
    if (lead.company_location) {
      locationCounts[lead.company_location] = (locationCounts[lead.company_location] || 0) + 1;
    }
  }

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([loc]) => loc);

  if (locations.length === 0) {
    locations.push('Nederland');
  }

  // Build the profile
  const profile: ICPProfile = {
    industries,
    companySize,
    avgDealValue,
    topJobTitles,
    locations,
    highValueServices,
    avgInvoiceValue,
    suggestedSearches: [],
    confidence,
    dataPoints: {
      clientCount: clientList.length,
      invoiceCount: invoiceList.length,
      projectCount: projectList.length,
      leadCount: leadList.length,
    },
  };

  // Generate search suggestions
  profile.suggestedSearches = generateSearchProfiles(profile);

  return profile;
}

// ============================================
// SEARCH PROFILE GENERATION
// ============================================

export function generateSearchProfiles(icp: ICPProfile): SearchProfile[] {
  const profiles: SearchProfile[] = [];

  // Profile 1: Based on top industry
  if (icp.industries.length > 0) {
    const topIndustry = icp.industries[0];
    const industryKeywords = INDUSTRY_KEYWORDS[topIndustry.name] || [topIndustry.name.toLowerCase()];
    profiles.push({
      name: `${topIndustry.name} bedrijven`,
      description: `Bedrijven in ${topIndustry.name.toLowerCase()} - je meest voorkomende klanttype (${topIndustry.percentage}% van klanten)`,
      targetIndustry: topIndustry.name,
      targetCompanySize: icp.companySize.length > 0 ? icp.companySize[0].range : '11-50',
      targetJobTitles: icp.topJobTitles.slice(0, 3),
      targetLocations: icp.locations.slice(0, 2),
      keywords: industryKeywords.slice(0, 4),
      minCompanySize: 5,
      maxCompanySize: 200,
      estimatedLeadCount: 50,
    });
  }

  // Profile 2: Based on top service
  if (icp.highValueServices.length > 0) {
    const topService = icp.highValueServices[0];
    profiles.push({
      name: `Bedrijven die ${topService.description.toLowerCase()} nodig hebben`,
      description: `Je meest winstgevende dienst: ${topService.description} (${new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(topService.totalRevenue)} omzet)`,
      targetIndustry: undefined,
      targetCompanySize: '11-50',
      targetJobTitles: ['eigenaar', 'directeur', 'manager'],
      targetLocations: icp.locations.slice(0, 2),
      keywords: [topService.description.toLowerCase(), 'groei', 'verbetering'],
      minCompanySize: 1,
      maxCompanySize: 100,
      estimatedLeadCount: 75,
    });
  }

  // Profile 3: Location-based
  if (icp.locations.length > 0 && icp.locations[0] !== 'Nederland') {
    profiles.push({
      name: `Lokale bedrijven in ${icp.locations[0]}`,
      description: `Focus op bedrijven in je directe omgeving voor persoonlijk contact`,
      targetIndustry: icp.industries.length > 0 ? icp.industries[0].name : undefined,
      targetCompanySize: '1-50',
      targetJobTitles: ['eigenaar', 'directeur'],
      targetLocations: [icp.locations[0]],
      keywords: ['mkb', 'ondernemer', icp.locations[0].toLowerCase()],
      minCompanySize: 1,
      maxCompanySize: 50,
      estimatedLeadCount: 30,
    });
  }

  // Profile 4: High-value targets
  if (icp.avgDealValue > 0) {
    profiles.push({
      name: 'Grote opdrachten',
      description: `Bedrijven met budget voor projecten boven ${new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(icp.avgDealValue * 1.5)}`,
      targetIndustry: undefined,
      targetCompanySize: '51-200',
      targetJobTitles: ['cto', 'cmo', 'directeur', 'head of'],
      targetLocations: icp.locations,
      keywords: ['groei', 'scale-up', 'investering', 'transformatie'],
      minCompanySize: 50,
      maxCompanySize: 500,
      estimatedLeadCount: 25,
    });
  }

  // Profile 5: Second industry if available
  if (icp.industries.length > 1) {
    const secondIndustry = icp.industries[1];
    const industryKeywords = INDUSTRY_KEYWORDS[secondIndustry.name] || [secondIndustry.name.toLowerCase()];
    profiles.push({
      name: `${secondIndustry.name} sector`,
      description: `Je op-een-na grootste klantgroep (${secondIndustry.percentage}% van klanten)`,
      targetIndustry: secondIndustry.name,
      targetCompanySize: icp.companySize.length > 0 ? icp.companySize[0].range : '11-50',
      targetJobTitles: icp.topJobTitles.slice(0, 3),
      targetLocations: icp.locations,
      keywords: industryKeywords.slice(0, 3),
      minCompanySize: 5,
      maxCompanySize: 200,
      estimatedLeadCount: 40,
    });
  }

  // Always provide at least one generic profile
  if (profiles.length === 0) {
    profiles.push({
      name: 'MKB bedrijven in je regio',
      description: 'Start met het zoeken naar kleine en middelgrote bedrijven in je omgeving',
      targetIndustry: undefined,
      targetCompanySize: '11-50',
      targetJobTitles: ['eigenaar', 'directeur', 'manager'],
      targetLocations: icp.locations.length > 0 ? icp.locations : ['Nederland'],
      keywords: ['mkb', 'ondernemer', 'groei'],
      minCompanySize: 5,
      maxCompanySize: 100,
      estimatedLeadCount: 100,
    });
  }

  return profiles;
}

function emptyProfile(): ICPProfile {
  return {
    industries: [],
    companySize: [],
    avgDealValue: 0,
    topJobTitles: ['eigenaar', 'directeur', 'manager'],
    locations: ['Nederland'],
    highValueServices: [],
    avgInvoiceValue: 0,
    suggestedSearches: [
      {
        name: 'MKB bedrijven in Nederland',
        description: 'Voeg eerst klanten en facturen toe om gepersonaliseerde suggesties te krijgen',
        targetJobTitles: ['eigenaar', 'directeur'],
        targetLocations: ['Nederland'],
        keywords: ['mkb', 'ondernemer'],
        estimatedLeadCount: 100,
      },
    ],
    confidence: 0,
    dataPoints: {
      clientCount: 0,
      invoiceCount: 0,
      projectCount: 0,
      leadCount: 0,
    },
  };
}
