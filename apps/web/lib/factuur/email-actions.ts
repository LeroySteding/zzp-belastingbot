import { Invoice } from '@/lib/factuur/types/invoice';

export interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Sends an invoice email with PDF attachment via the /api/factuur/send-email route.
 * This function is designed to be called from client components.
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  recipientEmail: string,
  subject: string,
  body: string
): Promise<SendEmailResult> {
  try {
    const response = await fetch('/api/factuur/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice,
        recipientEmail,
        subject,
        emailBody: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Email versturen mislukt.',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Fout bij het versturen: ${err.message}`,
    };
  }
}
