import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF } from '@/components/factuur/InvoicePDF';
import { Invoice } from '@/lib/factuur/types/invoice';
import { createPaymentLink } from '@/lib/factuur/payment-actions';

/**
 * Build an HTML email body. When Mollie is configured and a payment link is
 * available, a prominent "Nu Betalen" button is added below the message text.
 */
function buildEmailHtml(
  textBody: string,
  paymentUrl: string | null,
): string {
  const escapedBody = textBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const paymentBlock = paymentUrl
    ? `
      <div style="margin-top:24px;margin-bottom:24px;text-align:center;">
        <a href="${paymentUrl}"
           style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;
                  text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
          Nu Betalen
        </a>
        <p style="margin-top:8px;font-size:12px;color:#6b7280;">
          Klik op de knop hierboven om deze factuur veilig online te betalen via iDEAL, creditcard of een andere methode.
        </p>
      </div>`
    : '';

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <p>${escapedBody}</p>
      ${paymentBlock}
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice, recipientEmail, subject, emailBody } = body as {
      invoice: Invoice;
      recipientEmail: string;
      subject: string;
      emailBody: string;
    };

    // Validate required fields
    if (!invoice || !recipientEmail || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Ontbrekende velden: invoice, recipientEmail, subject en emailBody zijn verplicht.' },
        { status: 400 }
      );
    }

    if (!recipientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Ongeldig email adres.' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'RESEND_API_KEY is niet geconfigureerd. Voeg de RESEND_API_KEY toe aan je omgevingsvariabelen om emails te kunnen versturen.',
        },
        { status: 500 }
      );
    }

    // Generate the PDF buffer using the shared InvoicePDF component
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice }) as any
    );

    // Try to create a Mollie payment link (will return null if Mollie is not configured)
    let paymentUrl: string | null = null;
    if (process.env.MOLLIE_API_KEY && invoice.id) {
      try {
        paymentUrl = await createPaymentLink(invoice.id);
      } catch (e) {
        // Non-fatal: send the email without a payment link
        console.warn('Kon geen Mollie betaallink aanmaken:', e);
      }
    }

    // Send email via Resend
    const resend = new Resend(apiKey);

    const fromAddress =
      process.env.RESEND_FROM_EMAIL || 'Facturen <onboarding@resend.dev>';

    const htmlBody = buildEmailHtml(emailBody, paymentUrl);

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: subject,
      text: emailBody,
      html: htmlBody,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: `Email versturen mislukt: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      paymentUrl,
    });
  } catch (err: any) {
    console.error('Send email error:', err);
    return NextResponse.json(
      { error: `Er is een onverwachte fout opgetreden: ${err.message}` },
      { status: 500 }
    );
  }
}
