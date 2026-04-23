'use server';

import { createClient } from '@/lib/supabase/server';
import type { Lead } from './actions';

// ============================================
// TYPES
// ============================================

export type OutreachTemplateType = 'eerste_contact' | 'linkedin' | 'followup' | 'offerte';

export interface OutreachMessage {
  subject?: string;
  body: string;
  templateType: OutreachTemplateType;
  leadId: string;
}

export interface OutreachTemplate {
  id: OutreachTemplateType;
  name: string;
  description: string;
  subject?: string;
  body: string;
  variables: string[];
}

// ============================================
// TEMPLATES
// ============================================

const TEMPLATES: Record<OutreachTemplateType, OutreachTemplate> = {
  eerste_contact: {
    id: 'eerste_contact',
    name: 'Eerste contact e-mail',
    description: 'Introductie-e-mail voor een koud contact',
    subject: 'Samenwerking {companyName} - {userService}',
    body: `Beste {firstName},

Ik zag dat {companyName} actief is in {industry}. Als {userRole} bij {userCompany} help ik bedrijven zoals {companyName} met {userService}.

{relevantPitch}

Zou u komende week tijd hebben voor een kort kennismakingsgesprek van 15 minuten? Dan kan ik u vertellen hoe ik andere bedrijven in {industry} heb geholpen.

Met vriendelijke groet,

{userName}
{userCompany}
{userEmail}`,
    variables: ['firstName', 'companyName', 'industry', 'userRole', 'userCompany', 'userService', 'relevantPitch', 'userName', 'userEmail'],
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn connectieverzoek',
    description: 'Kort bericht voor een LinkedIn connectieverzoek',
    body: `Hoi {firstName},

Ik zag je profiel en vond het interessant dat je bij {companyName} werkt als {jobTitle}. Ik ben {userName}, {userRole} bij {userCompany}.

Ik werk veel met bedrijven in {industry} en zou het leuk vinden om te connecten. Wie weet kunnen we in de toekomst iets voor elkaar betekenen!

Groet,
{userName}`,
    variables: ['firstName', 'companyName', 'jobTitle', 'industry', 'userName', 'userRole', 'userCompany'],
  },
  followup: {
    id: 'followup',
    name: 'Follow-up na meeting',
    description: 'Bedankbericht na een kennismakingsgesprek',
    subject: 'Bedankt voor het gesprek - {companyName} x {userCompany}',
    body: `Beste {firstName},

Bedankt voor het prettige gesprek van afgelopen week. Het was goed om meer te horen over de plannen van {companyName}.

Zoals besproken stuur ik hierbij een kort overzicht van hoe ik {companyName} kan helpen:

{userService}

De volgende stap zou zijn om {nextStep}. Ik kan hier volgende week op {suggestedDay} tijd voor vrijmaken.

Laat je het me weten als dit je uitkomt?

Met vriendelijke groet,

{userName}
{userCompany}
{userEmail}`,
    variables: ['firstName', 'companyName', 'userService', 'nextStep', 'suggestedDay', 'userName', 'userCompany', 'userEmail'],
  },
  offerte: {
    id: 'offerte',
    name: 'Offerte begeleidend schrijven',
    description: 'Begeleidend bericht bij het versturen van een offerte',
    subject: 'Offerte {userCompany} voor {companyName}',
    body: `Beste {firstName},

Hierbij stuur ik de offerte voor de besproken werkzaamheden bij {companyName}. Hieronder een kort overzicht:

Project: {projectDescription}
Geschatte waarde: {dealValue}
Geschatte doorlooptijd: {timeline}

In de offerte vindt u een gedetailleerde beschrijving van de aanpak, de deliverables en de planning.

Ik ben ervan overtuigd dat we samen een mooi resultaat kunnen bereiken. Mocht u vragen hebben of willen sparren over de aanpak, dan hoor ik dat graag.

Ik kijk uit naar uw reactie.

Met vriendelijke groet,

{userName}
{userCompany}
{userEmail}`,
    variables: ['firstName', 'companyName', 'projectDescription', 'dealValue', 'timeline', 'userName', 'userCompany', 'userEmail'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRelevantPitch(industry: string | null): string {
  const pitches: Record<string, string> = {
    'marketing': 'Van het verbeteren van online zichtbaarheid tot het automatiseren van processen, ik zorg dat technologie werkt voor uw marketingdoelen.',
    'it': 'Met mijn ervaring in software-ontwikkeling kan ik helpen om uw technische processen te stroomlijnen en schaalbaarder te maken.',
    'e-commerce': 'Ik help webshops om sneller te laden, beter te converteren en soepeler te draaien achter de schermen.',
    'financieel': 'Van data-analyse tot proces-automatisering, ik help financiele organisaties om efficienter te werken.',
    'gezondheidszorg': 'Ik begrijp de specifieke uitdagingen in de zorg en help bij het digitaliseren en optimaliseren van werkprocessen.',
    'default': 'Ik help bedrijven om hun processen te verbeteren en meer uit hun technologie te halen.',
  };

  if (industry) {
    const lower = industry.toLowerCase();
    for (const [key, pitch] of Object.entries(pitches)) {
      if (lower.includes(key)) return pitch;
    }
  }

  return pitches.default;
}

function getDayName(): string {
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const today = new Date().getDay();
  // Suggest next Tuesday or Thursday
  const nextBizDay = today <= 2 ? 2 : today <= 4 ? 4 : 2;
  return days[nextBizDay];
}

// ============================================
// MAIN FUNCTIONS
// ============================================

export async function getOutreachTemplates(): Promise<OutreachTemplate[]> {
  return Object.values(TEMPLATES);
}

export async function generateOutreachMessage(
  leadId: string,
  templateType: OutreachTemplateType,
  customVars?: Record<string, string>
): Promise<OutreachMessage | null> {
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

  // Get user profile data (name, company info from their most common invoice data)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's company info from invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .order('created_at', { ascending: false });

  // Get user's services from invoice items
  const { data: recentItems } = await supabase
    .from('invoice_items')
    .select('description, invoices!inner(user_id)')
    .eq('invoices.user_id', user.id)
    .limit(5)
    .order('created_at', { ascending: false });

  const template = TEMPLATES[templateType];
  if (!template) return null;

  // Build variable values
  const userName = userProfile?.full_name || userProfile?.name || user.email?.split('@')[0] || 'Uw naam';
  const userEmail = user.email || 'uw@email.nl';
  const userCompany = userProfile?.company_name || userProfile?.business_name || 'Uw Bedrijf';
  const userRole = userProfile?.role || userProfile?.job_title || 'freelancer';
  const services = recentItems?.map((item: any) => item.description).filter(Boolean) || [];
  const userService = services.length > 0
    ? services.slice(0, 2).join(' en ')
    : 'professionele dienstverlening';

  const variables: Record<string, string> = {
    firstName: lead.first_name || 'heer/mevrouw',
    lastName: lead.last_name || '',
    companyName: lead.company_name || 'uw bedrijf',
    jobTitle: lead.job_title || 'uw functie',
    industry: lead.company_industry || 'uw branche',
    userName,
    userEmail,
    userCompany,
    userRole,
    userService,
    relevantPitch: getRelevantPitch(lead.company_industry),
    dealValue: lead.value
      ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(lead.value)
      : 'nader te bepalen',
    projectDescription: lead.notes || 'de besproken werkzaamheden',
    nextStep: 'een concrete projectplanning op te stellen',
    suggestedDay: getDayName(),
    timeline: '4-6 weken',
    ...customVars,
  };

  // Apply variables to template
  let body = template.body;
  let subject = template.subject || '';

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    body = body.replace(regex, value);
    subject = subject.replace(regex, value);
  }

  return {
    subject: subject || undefined,
    body,
    templateType,
    leadId,
  };
}

export async function generateBulkOutreach(
  leadIds: string[],
  templateType: OutreachTemplateType
): Promise<OutreachMessage[]> {
  const messages: OutreachMessage[] = [];

  for (const leadId of leadIds) {
    const message = await generateOutreachMessage(leadId, templateType);
    if (message) {
      messages.push(message);
    }
  }

  return messages;
}
