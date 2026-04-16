// ============================================
// OUTREACH TEMPLATES - STEDING.DEV
// ============================================
// Service-specific outreach templates for Leroy Steding's consultancy.
// All templates are in professional Dutch and use {placeholder} variables.

export interface OutreachTemplate {
  id: string;
  name: string;
  category: 'eerste_contact' | 'linkedin' | 'followup' | 'offerte';
  relevantService?: string; // links to SERVICE_PROFILE.services[].id
  subject?: string;
  body: string;
  variables: string[];
}

export const OUTREACH_TEMPLATES: Record<string, OutreachTemplate> = {
  // ============================================
  // EERSTE CONTACT - per dienst
  // ============================================

  eerste_contact_ai: {
    id: 'eerste_contact_ai',
    name: 'Eerste contact - AI Automatisering',
    category: 'eerste_contact',
    relevantService: 'ai-agents',
    subject: 'AI-automatisering voor {companyName}',
    body: `Beste {firstName},

Ik zag dat {companyName} actief is in {industry}. Veel bedrijven in deze sector besteden nog 20+ uur per week aan handmatige processen die met AI-agents geautomatiseerd kunnen worden.

Bij Steding.dev bouw ik autonome AI-agents die repetitieve taken overnemen -- van data-verwerking tot klantenservice. Binnen 2 weken lever ik een werkend prototype dat laat zien wat er mogelijk is.

Zou u volgende week tijd hebben voor een kort gesprek van 15 minuten?

Met vriendelijke groet,
Leroy Steding
Steding.dev | AI-Consultancy & Custom Software`,
    variables: ['firstName', 'companyName', 'industry'],
  },

  eerste_contact_apps: {
    id: 'eerste_contact_apps',
    name: 'Eerste contact - Custom Software & Apps',
    category: 'eerste_contact',
    relevantService: 'custom-software',
    subject: 'Custom software voor {companyName}',
    body: `Beste {firstName},

Ik volg {companyName} al een tijdje en zag dat jullie {signal}. Dat doet me denken aan een soortgelijk project dat ik recent heb opgeleverd -- een volledig op maat gebouwd platform in Next.js & React.

Als senior full-stack developer met 12+ jaar ervaring bouw ik van MVP tot enterprise-level software. Mijn aanpak: een werkend prototype in 2 weken, volledige MVP in 4-6 weken. Geen bureau-overhead -- je werkt direct met mij.

Ik zou graag vrijblijvend sparren over hoe ik {companyName} kan helpen. Heeft u komende week 15 minuten?

Met vriendelijke groet,
Leroy Steding
Steding.dev | AI-Consultancy & Custom Software`,
    variables: ['firstName', 'companyName', 'signal'],
  },

  eerste_contact_consultancy: {
    id: 'eerste_contact_consultancy',
    name: 'Eerste contact - Technisch Consultancy',
    category: 'eerste_contact',
    relevantService: 'consultancy',
    subject: 'Technisch advies voor {companyName}',
    body: `Beste {firstName},

Als {jobTitle} bij {companyName} kent u vast het dilemma: welke technologie kies je, hoe voorkom je technische schuld, en hoe integreer je AI op een slimme manier?

Ik help bedrijven als technisch consultant met AI-strategie, architectuur reviews en tech stack advies. Met mijn achtergrond als senior developer bij o.a. SURF (whitelabel platform voor het onderwijs) breng ik hands-on ervaring mee -- geen PowerPoints maar concrete adviezen die je team direct kan toepassen.

Zou het interessant zijn om een keer te sparren over de technische richting van {companyName}? Een eerste gesprek van 30 minuten is altijd vrijblijvend.

Met vriendelijke groet,
Leroy Steding
Steding.dev | AI-Consultancy & Custom Software`,
    variables: ['firstName', 'companyName', 'jobTitle'],
  },

  // ============================================
  // LINKEDIN
  // ============================================

  linkedin_connectie: {
    id: 'linkedin_connectie',
    name: 'LinkedIn connectieverzoek',
    category: 'linkedin',
    body: `Hoi {firstName},

Ik zag dat je als {jobTitle} bij {companyName} werkt -- interessant bedrijf! Ik ben Leroy Steding, ik bouw AI-agents en custom software voor bedrijven in {industry}.

Lijkt me goed om te connecten. Wie weet kunnen we ooit iets voor elkaar betekenen!

Groet,
Leroy`,
    variables: ['firstName', 'companyName', 'jobTitle', 'industry'],
  },

  linkedin_followup: {
    id: 'linkedin_followup',
    name: 'LinkedIn bericht na connectie',
    category: 'linkedin',
    body: `Hoi {firstName},

Bedankt voor de connectie! Ik ben benieuwd: hoe gaan jullie bij {companyName} om met {painPoint}?

Ik merk dat veel bedrijven in {industry} hiermee worstelen. Recent heb ik voor een vergelijkbaar bedrijf een oplossing gebouwd die {benefit}.

Mocht je er een keer over willen sparren, dan plan ik graag een kort gesprek in. Geen verplichtingen.

Groet,
Leroy`,
    variables: ['firstName', 'companyName', 'painPoint', 'industry', 'benefit'],
  },

  // ============================================
  // FOLLOW-UPS
  // ============================================

  followup_geen_reactie: {
    id: 'followup_geen_reactie',
    name: 'Follow-up na geen reactie',
    category: 'followup',
    subject: 'Re: {originalSubject}',
    body: `Beste {firstName},

Ik begrijp dat het druk is. Ik wilde kort even opvolgen op mijn vorige bericht.

Ter inspiratie: recent heb ik voor een bedrijf in {industry} een AI-oplossing gebouwd die hun handmatige processen met 60% heeft verminderd. Het prototype stond er binnen 2 weken.

Als dit relevant is voor {companyName}, dan praat ik u graag bij in een kort gesprek van 15 minuten. Zo niet, geen probleem -- ik wens u een productieve week.

Met vriendelijke groet,
Leroy Steding
Steding.dev | AI-Consultancy & Custom Software`,
    variables: ['firstName', 'companyName', 'industry', 'originalSubject'],
  },

  followup_na_gesprek: {
    id: 'followup_na_gesprek',
    name: 'Follow-up na gesprek',
    category: 'followup',
    subject: 'Bedankt voor het gesprek - {companyName} x Steding.dev',
    body: `Beste {firstName},

Bedankt voor het prettige gesprek van {meetingDay}. Het was goed om meer te horen over de plannen van {companyName} op het gebied van {topic}.

Zoals besproken heb ik nagedacht over de mogelijkheden. Kort samengevat:

- {samenvatting_punt_1}
- {samenvatting_punt_2}
- {samenvatting_punt_3}

De volgende stap zou zijn om {nextStep}. Ik kan hier volgende week op {suggestedDay} tijd voor vrijmaken.

Laat je me weten of dit je uitkomt?

Met vriendelijke groet,
Leroy Steding
Steding.dev | AI-Consultancy & Custom Software`,
    variables: [
      'firstName', 'companyName', 'meetingDay', 'topic',
      'samenvatting_punt_1', 'samenvatting_punt_2', 'samenvatting_punt_3',
      'nextStep', 'suggestedDay',
    ],
  },

  // ============================================
  // OFFERTE
  // ============================================

  offerte_begeleidend: {
    id: 'offerte_begeleidend',
    name: 'Offerte begeleidend schrijven',
    category: 'offerte',
    subject: 'Offerte Steding.dev voor {companyName} - {projectName}',
    body: `Beste {firstName},

Hierbij stuur ik de offerte voor de besproken werkzaamheden bij {companyName}. Hieronder een kort overzicht:

Project: {projectName}
Dienst: {serviceName}
Geschatte investering: {dealValue}
Doorlooptijd: {timeline}

Mijn aanpak in het kort:
- Prototype binnen 2 weken zodat u direct resultaat ziet
- Wekelijkse updates en transparante communicatie
- U bent eigenaar van alle code -- geen vendor lock-in
- Oplevering inclusief documentatie en overdracht

In de bijlage vindt u een gedetailleerde beschrijving van de aanpak, deliverables en planning.

Ik ben ervan overtuigd dat we samen een sterk resultaat kunnen neerzetten. Heeft u vragen of wilt u iets bespreken? Ik ben bereikbaar via e-mail of telefoon.

Met vriendelijke groet,
Leroy Steding
Steding.dev | AI-Consultancy & Custom Software
leroy@steding.dev`,
    variables: [
      'firstName', 'companyName', 'projectName', 'serviceName',
      'dealValue', 'timeline',
    ],
  },
};

// ============================================
// HELPER: Get templates by category
// ============================================

export function getTemplatesByCategory(category: OutreachTemplate['category']): OutreachTemplate[] {
  return Object.values(OUTREACH_TEMPLATES).filter(t => t.category === category);
}

// ============================================
// HELPER: Get templates for a service
// ============================================

export function getTemplatesForService(serviceId: string): OutreachTemplate[] {
  return Object.values(OUTREACH_TEMPLATES).filter(
    t => t.relevantService === serviceId || !t.relevantService
  );
}

// ============================================
// HELPER: Fill template variables
// ============================================

export function fillTemplate(
  template: OutreachTemplate,
  variables: Record<string, string>
): { subject?: string; body: string } {
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
  };
}
