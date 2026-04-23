'use server';

import createMollieClient from '@mollie/api-client';
import { createClient } from '@/lib/supabase/server';
import {
  getMollieSettings,
  type MollieSettings,
} from '@/lib/integrations/actions';

// ---------------------------------------------------------------------------
// Map internal method names to Mollie API method identifiers
// ---------------------------------------------------------------------------

const METHOD_MAP: Record<keyof MollieSettings['payment_methods'], string> = {
  ideal: 'ideal',
  creditcard: 'creditcard',
  bancontact: 'bancontact',
  sepa_direct_debit: 'directdebit',
  paypal: 'paypal',
  klarna: 'klarnapaylater',
  bank_transfer: 'banktransfer',
};

/**
 * Returns the list of Mollie method identifiers that the user has enabled
 * in their Mollie settings. If no settings are stored, all popular Dutch
 * methods are returned by default.
 */
async function getEnabledMollieMethods(): Promise<string[]> {
  const settings = await getMollieSettings();
  const enabled = Object.entries(settings.payment_methods)
    .filter(([, isEnabled]) => isEnabled)
    .map(([method]) => METHOD_MAP[method as keyof MollieSettings['payment_methods']])
    .filter(Boolean);

  return enabled.length > 0 ? enabled : ['ideal', 'creditcard', 'banktransfer'];
}

/**
 * Creates a Mollie payment link for a given invoice.
 * Returns the checkout URL the client should be redirected to, or null on failure.
 * Respects the user's configured payment methods.
 */
export async function createPaymentLink(invoiceId: string): Promise<string | null> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    console.error('MOLLIE_API_KEY is niet geconfigureerd');
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('NEXT_PUBLIC_APP_URL is niet geconfigureerd');
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch invoice from DB
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, status, user_id')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single();

  if (error || !invoice) {
    console.error('Factuur niet gevonden:', error?.message);
    return null;
  }

  const total = Number(invoice.total);
  if (!total || total <= 0) {
    console.error('Factuur heeft geen geldig bedrag');
    return null;
  }

  try {
    const mollieClient = createMollieClient({ apiKey });
    const enabledMethods = await getEnabledMollieMethods();

    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: total.toFixed(2),
      },
      description: `Factuur ${invoice.invoice_number}`,
      redirectUrl: `${appUrl}/factuur/payment/success?invoice=${invoiceId}`,
      webhookUrl: `${appUrl}/api/integrations/mollie/webhook`,
      method: enabledMethods as any,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        user_id: user.id,
      },
    });

    // Return the checkout URL where the client pays
    return payment.getCheckoutUrl() ?? null;
  } catch (err: any) {
    console.error('Mollie payment creation error:', err.message);
    return null;
  }
}

/**
 * Get the Mollie payment URL for an invoice (creates one if needed).
 * Used by the invoices list "Betaallink" button.
 */
export async function getOrCreatePaymentLink(invoiceId: string): Promise<{
  url: string | null;
  error?: string;
}> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return { url: null, error: 'Mollie is niet geconfigureerd. Voeg MOLLIE_API_KEY toe aan je omgevingsvariabelen.' };
  }

  const url = await createPaymentLink(invoiceId);
  if (!url) {
    return { url: null, error: 'Kon geen betaallink aanmaken. Controleer of de factuur een geldig bedrag heeft.' };
  }

  return { url };
}

/**
 * Check whether Mollie is configured for this environment.
 */
export async function isMollieConfigured(): Promise<boolean> {
  return !!process.env.MOLLIE_API_KEY;
}
