// ============================================
// STEDING.DEV SERVICE PROFILE
// ============================================
// Hardcoded service profile that drives ICP analysis and search suggestions.
// This replaces client-data-driven analysis with a predefined service offering.

export interface ServiceDefinition {
  id: string;
  name: string;
  keywords: string[];
  targetPainPoints: string[];
  avgProjectValue: number;
}

export interface IdealCustomerProfile {
  name: string;
  description: string;
  companySize: string;
  industries: string[];
  jobTitles: string[];
  locations: string[];
  signals: string[];
  relevantService: string;
}

export interface ServiceProfile {
  company: string;
  owner: string;
  tagline: string;
  location: string;
  services: ServiceDefinition[];
  idealCustomerProfiles: IdealCustomerProfile[];
}

export const SERVICE_PROFILE: ServiceProfile = {
  company: 'Steding.dev',
  owner: 'Leroy Steding',
  tagline: 'AI-Consultancy & Custom Software',
  location: 'Zaandam, Nederland',

  services: [
    {
      id: 'ai-agents',
      name: 'AI-agents & Automatisering',
      keywords: ['AI', 'automation', 'agents', 'workflow', 'data pipeline', 'RPA', 'chatbot'],
      targetPainPoints: ['handmatige processen', 'repetitieve taken', 'data silo\'s'],
      avgProjectValue: 15000,
    },
    {
      id: 'ai-apps',
      name: 'AI-apps & Platformen',
      keywords: ['LLM', 'RAG', 'dashboard', 'analytics', 'GPT', 'Claude', 'AI platform'],
      targetPainPoints: ['geen AI expertise', 'verouderde software', 'geen data inzicht'],
      avgProjectValue: 25000,
    },
    {
      id: 'custom-software',
      name: 'Custom Software',
      keywords: ['web app', 'platform', 'MVP', 'SaaS', 'Next.js', 'React', 'API'],
      targetPainPoints: ['legacy systemen', 'geen schaalbare software', 'trage time-to-market'],
      avgProjectValue: 20000,
    },
    {
      id: 'consultancy',
      name: 'Technisch Consultancy',
      keywords: ['architectuur', 'AI strategie', 'tech stack', 'code review', 'coaching'],
      targetPainPoints: ['verkeerde tech keuzes', 'technische schuld', 'geen CTO'],
      avgProjectValue: 8000,
    },
  ],

  idealCustomerProfiles: [
    {
      name: 'Scale-ups met AI behoefte',
      description: 'Groeiende tech bedrijven die AI willen integreren maar geen in-house expertise hebben',
      companySize: '20-200 medewerkers',
      industries: ['Technology', 'SaaS', 'FinTech', 'HealthTech'],
      jobTitles: ['CTO', 'VP Engineering', 'Head of Product', 'Technical Director', 'CEO'],
      locations: ['Netherlands', 'Amsterdam', 'Rotterdam', 'Utrecht'],
      signals: ['Recent funding', 'Hiring developers', 'AI initiatives mentioned'],
      relevantService: 'ai-agents',
    },
    {
      name: 'MKB met automatiseringsbehoefte',
      description: 'Middelgrote bedrijven die handmatige processen willen automatiseren',
      companySize: '50-500 medewerkers',
      industries: ['Manufacturing', 'Logistics', 'Financial Services', 'Healthcare', 'Legal'],
      jobTitles: ['COO', 'Operations Director', 'Process Manager', 'Managing Director', 'CEO'],
      locations: ['Netherlands'],
      signals: ['Growing headcount', 'Process optimization', 'Digital transformation'],
      relevantService: 'ai-agents',
    },
    {
      name: 'Digitale bureaus die capaciteit zoeken',
      description: 'Agencies die een senior developer nodig hebben voor complexe klantprojecten',
      companySize: '10-100 medewerkers',
      industries: ['Marketing', 'Advertising', 'Digital Agency', 'Creative Agency'],
      jobTitles: ['Technical Director', 'CTO', 'Head of Development', 'Managing Partner'],
      locations: ['Netherlands', 'Amsterdam'],
      signals: ['Growing team', 'Complex projects', 'Need senior talent'],
      relevantService: 'custom-software',
    },
    {
      name: 'E-commerce bedrijven',
      description: 'Online retailers die custom development of Shopify expertise nodig hebben',
      companySize: '10-200 medewerkers',
      industries: ['E-commerce', 'Retail', 'Fashion', 'Consumer Goods'],
      jobTitles: ['E-commerce Manager', 'CTO', 'Head of Digital', 'CEO'],
      locations: ['Netherlands'],
      signals: ['Shopify', 'Custom platform', 'Growing online sales'],
      relevantService: 'custom-software',
    },
    {
      name: 'Startups die een MVP nodig hebben',
      description: 'Vroege-fase startups die snel een werkend product willen bouwen',
      companySize: '1-20 medewerkers',
      industries: ['Technology', 'SaaS', 'AI/ML', 'Marketplace'],
      jobTitles: ['CEO', 'Founder', 'Co-founder', 'CPO'],
      locations: ['Netherlands', 'Amsterdam', 'Berlin', 'London'],
      signals: ['Seed funding', 'Pre-seed', 'Looking for technical co-founder'],
      relevantService: 'custom-software',
    },
  ],
};
