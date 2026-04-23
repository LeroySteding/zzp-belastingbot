import createMollieClient, { SequenceType } from '@mollie/api-client';

export type PlanId = 'free' | 'pro' | 'business';

export const PLANS: Record<PlanId, {
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: { invoices: number; projects: number; team: number };
}> = {
  free: {
    name: 'Gratis',
    price: 0,
    description: 'Perfect om te starten',
    features: [
      '3 facturen per maand',
      '1 project',
      'Basis boekhouding',
      'BTW berekening',
    ],
    limits: { invoices: 3, projects: 1, team: 0 },
  },
  pro: {
    name: 'Pro',
    price: 1900, // cents
    description: 'Voor actieve ZZP\'ers',
    features: [
      'Onbeperkt facturen',
      '10 projecten',
      'Alle modules',
      'PDF export & email',
      'Bank import',
      'OCR bon scanner',
      'Recurring facturen',
    ],
    limits: { invoices: -1, projects: 10, team: 0 },
  },
  business: {
    name: 'Business',
    price: 3900, // cents
    description: 'Alles wat je nodig hebt',
    features: [
      'Alles van Pro',
      'Onbeperkt projecten',
      'Team toegang (5 leden)',
      'Klantportaal',
      'Lead pipeline & CRM',
      'Contracten module',
      'Bank koppelingen (PSD2)',
      'Prioriteit support',
    ],
    limits: { invoices: -1, projects: -1, team: 5 },
  },
};

export function getPlanByAmount(amount: number): PlanId | null {
  if (amount === 1900) return 'pro';
  if (amount === 3900) return 'business';
  return null;
}
