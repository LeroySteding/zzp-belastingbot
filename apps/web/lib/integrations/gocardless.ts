'use server';

/**
 * GoCardless API client voor SEPA Automatische Incasso
 *
 * GoCardless biedt SEPA Direct Debit betalingen -- ideaal voor
 * terugkerende factuurbetalingen. Dit is de betalings-API, niet
 * de bank account data API (welke is gesloten).
 *
 * Docs: https://developer.gocardless.com/
 */

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Configuratie
// ---------------------------------------------------------------------------

const GOCARDLESS_BASE_URL =
  process.env.GOCARDLESS_ENVIRONMENT === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';

function getAccessToken(): string {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  if (!token) {
    throw new Error('GOCARDLESS_ACCESS_TOKEN is niet geconfigureerd');
  }
  return token;
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function gocardlessRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${GOCARDLESS_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      errorData?.error?.errors?.[0]?.message ||
      `GoCardless API fout: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoCardlessCustomer {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  created_at: string;
}

export interface GoCardlessMandate {
  id: string;
  status: 'pending_customer_approval' | 'pending_submission' | 'submitted' | 'active' | 'failed' | 'cancelled' | 'expired';
  reference: string;
  scheme: string;
  next_possible_charge_date: string;
  created_at: string;
  links: {
    customer: string;
    creditor: string;
  };
}

export interface GoCardlessPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending_customer_approval' | 'pending_submission' | 'submitted' | 'confirmed' | 'paid_out' | 'cancelled' | 'customer_approval_denied' | 'failed' | 'charged_back';
  description: string;
  reference: string;
  charge_date: string;
  created_at: string;
  metadata: Record<string, string>;
  links: {
    mandate: string;
    creditor: string;
  };
}

export interface GoCardlessSubscription {
  id: string;
  amount: number;
  currency: string;
  status: 'pending_customer_approval' | 'customer_approval_denied' | 'active' | 'finished' | 'cancelled' | 'paused';
  name: string;
  interval_unit: 'weekly' | 'monthly' | 'yearly';
  interval: number;
  day_of_month: number;
  created_at: string;
  links: {
    mandate: string;
  };
}

export interface GoCardlessRedirectFlow {
  id: string;
  description: string;
  session_token: string;
  redirect_url: string;
  confirmation_url: string;
  created_at: string;
  links: {
    creditor: string;
    customer?: string;
    mandate?: string;
  };
}

// ---------------------------------------------------------------------------
// Klant aanmaken
// ---------------------------------------------------------------------------

/**
 * Maak een klant aan in GoCardless.
 */
export async function createGoCardlessCustomer(
  name: string,
  email: string
): Promise<GoCardlessCustomer> {
  const nameParts = name.trim().split(/\s+/);
  const givenName = nameParts[0] || name;
  const familyName = nameParts.slice(1).join(' ') || name;

  const response = await gocardlessRequest<{ customers: GoCardlessCustomer }>(
    'POST',
    '/customers',
    {
      customers: {
        email,
        given_name: givenName,
        family_name: familyName,
      },
    }
  );

  return response.customers;
}

// ---------------------------------------------------------------------------
// Mandaat (bankauthorisatie voor automatische incasso)
// ---------------------------------------------------------------------------

/**
 * Maak een redirect flow aan voor het autoriseren van automatische incasso.
 * De klant wordt doorgestuurd naar een pagina waar ze hun bankrekening
 * autoriseren voor SEPA Direct Debit.
 */
export async function createMandate(
  description: string,
  sessionToken: string,
  successRedirectUrl: string
): Promise<GoCardlessRedirectFlow> {
  const response = await gocardlessRequest<{
    redirect_flows: GoCardlessRedirectFlow;
  }>('POST', '/redirect_flows', {
    redirect_flows: {
      description,
      session_token: sessionToken,
      success_redirect_url: successRedirectUrl,
      scheme: 'sepa_core',
    },
  });

  return response.redirect_flows;
}

/**
 * Voltooi de redirect flow nadat de klant toestemming heeft gegeven.
 * Retourneert de aangemaakte mandaat- en klantgegevens.
 */
export async function completeRedirectFlow(
  redirectFlowId: string,
  sessionToken: string
): Promise<GoCardlessRedirectFlow> {
  const response = await gocardlessRequest<{
    redirect_flows: GoCardlessRedirectFlow;
  }>('POST', `/redirect_flows/${redirectFlowId}/actions/complete`, {
    data: {
      session_token: sessionToken,
    },
  });

  return response.redirect_flows;
}

// ---------------------------------------------------------------------------
// Eenmalige betaling
// ---------------------------------------------------------------------------

/**
 * Maak een eenmalige betaling aan via een bestaand mandaat.
 *
 * @param mandateId - ID van het actieve mandaat
 * @param amount - Bedrag in centen
 * @param description - Omschrijving voor de betaling
 * @param invoiceId - Factuur-ID voor metadata
 */
export async function createPayment(
  mandateId: string,
  amount: number,
  description: string,
  invoiceId: string
): Promise<GoCardlessPayment> {
  const response = await gocardlessRequest<{
    payments: GoCardlessPayment;
  }>('POST', '/payments', {
    payments: {
      amount,
      currency: 'EUR',
      description,
      metadata: {
        invoice_id: invoiceId,
      },
      links: {
        mandate: mandateId,
      },
    },
  });

  return response.payments;
}

// ---------------------------------------------------------------------------
// Terugkerende betaling (abonnement)
// ---------------------------------------------------------------------------

/**
 * Maak een terugkerend abonnement aan via een bestaand mandaat.
 *
 * @param mandateId - ID van het actieve mandaat
 * @param amount - Bedrag in centen per termijn
 * @param intervalUnit - 'monthly' of 'quarterly'
 * @param description - Omschrijving voor het abonnement
 */
export async function createSubscription(
  mandateId: string,
  amount: number,
  intervalUnit: 'monthly' | 'quarterly',
  description: string
): Promise<GoCardlessSubscription> {
  // GoCardless gebruikt 'monthly' en 'yearly', niet 'quarterly'
  // Voor driemaandelijks: interval=3, interval_unit='monthly'
  const interval = intervalUnit === 'quarterly' ? 3 : 1;
  const unit = intervalUnit === 'quarterly' ? 'monthly' : intervalUnit;

  const response = await gocardlessRequest<{
    subscriptions: GoCardlessSubscription;
  }>('POST', '/subscriptions', {
    subscriptions: {
      amount,
      currency: 'EUR',
      name: description,
      interval_unit: unit,
      interval,
      links: {
        mandate: mandateId,
      },
    },
  });

  return response.subscriptions;
}

/**
 * Annuleer een bestaand abonnement.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<GoCardlessSubscription> {
  const response = await gocardlessRequest<{
    subscriptions: GoCardlessSubscription;
  }>('POST', `/subscriptions/${subscriptionId}/actions/cancel`, {});

  return response.subscriptions;
}

// ---------------------------------------------------------------------------
// Betalingsstatus
// ---------------------------------------------------------------------------

/**
 * Haal de status op van een specifieke betaling.
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<GoCardlessPayment> {
  const response = await gocardlessRequest<{
    payments: GoCardlessPayment;
  }>('GET', `/payments/${paymentId}`);

  return response.payments;
}

// ---------------------------------------------------------------------------
// Mandaten ophalen
// ---------------------------------------------------------------------------

/**
 * Haal alle mandaten op voor een specifieke klant.
 */
export async function getCustomerMandates(
  customerId: string
): Promise<GoCardlessMandate[]> {
  const response = await gocardlessRequest<{
    mandates: GoCardlessMandate[];
  }>('GET', `/mandates?customer=${customerId}`);

  return response.mandates;
}

// ---------------------------------------------------------------------------
// Webhook verificatie
// ---------------------------------------------------------------------------

/**
 * Verifieer de GoCardless webhook signature.
 *
 * GoCardless stuurt een HMAC-SHA256 signature in de Webhook-Signature header.
 * Deze moet overeenkomen met de body gehashed met het webhook secret.
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('GOCARDLESS_WEBHOOK_SECRET is niet geconfigureerd');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSignature === signature;
}

// ---------------------------------------------------------------------------
// Webhook verwerken
// ---------------------------------------------------------------------------

export interface GoCardlessEvent {
  id: string;
  action: string;
  resource_type: 'payments' | 'mandates' | 'subscriptions' | 'payouts' | 'refunds';
  created_at: string;
  links: Record<string, string>;
  details: {
    cause: string;
    description: string;
    origin: string;
    scheme?: string;
    reason_code?: string;
  };
}

/**
 * Verwerk een GoCardless webhook event.
 *
 * Bij een succesvolle betaling wordt de gekoppelde factuur
 * automatisch als betaald gemarkeerd.
 */
export async function processWebhookEvent(
  event: GoCardlessEvent
): Promise<void> {
  if (event.resource_type !== 'payments') return;

  const paymentId = event.links.payment;
  if (!paymentId) return;

  if (event.action === 'confirmed' || event.action === 'paid_out') {
    // Betaling succesvol: haal betalingsgegevens op
    const payment = await getPaymentStatus(paymentId);
    const invoiceId = payment.metadata?.invoice_id;

    if (invoiceId) {
      // Markeer de factuur als betaald
      const supabase = await createClient();
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_source: 'gocardless',
          payment_reference: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    }
  }

  if (event.action === 'failed' || event.action === 'cancelled') {
    // Betaling mislukt: log voor notificatie
    const payment = await getPaymentStatus(paymentId);
    const invoiceId = payment.metadata?.invoice_id;

    if (invoiceId) {
      const supabase = await createClient();
      await supabase
        .from('invoices')
        .update({
          payment_status_detail: `GoCardless: ${event.details.description}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    }
  }
}

// ---------------------------------------------------------------------------
// Configuratiestatus
// ---------------------------------------------------------------------------

/**
 * Controleer of GoCardless is geconfigureerd.
 */
export async function getGoCardlessStatus(): Promise<{
  configured: boolean;
  environment: 'sandbox' | 'live';
}> {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  return {
    configured: !!token,
    environment: (process.env.GOCARDLESS_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
  };
}
