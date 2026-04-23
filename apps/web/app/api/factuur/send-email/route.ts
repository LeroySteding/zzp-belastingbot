import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF } from '@/components/factuur/InvoicePDF';
import { Invoice } from '@/lib/factuur/types/invoice';
import { createPaymentLink } from '@/lib/factuur/payment-actions';
import { sendEmail } from '@/lib/email/send';
import { buildInvoiceEmail } from '@/lib/email/emails';
import { getMollieSettings } from '@/lib/integrations/actions';

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
    // Respects the user's "add_payment_link_to_emails" setting
    let paymentUrl: string | null = null;
    if (process.env.MOLLIE_API_KEY && invoice.id) {
      try {
        const mollieSettings = await getMollieSettings();
        if (mollieSettings.add_payment_link_to_emails) {
          paymentUrl = await createPaymentLink(invoice.id);
        }
      } catch (e) {
        // Non-fatal: send the email without a payment link
        console.warn('Kon geen Mollie betaallink aanmaken:', e);
      }
    }

    // Calculate total for the template
    const total = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (1 + item.btwRate / 100),
      0
    );
    const totalFormatted = new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(total);

    const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Build HTML using the centralized invoice email template
    const emailTemplate = buildInvoiceEmail({
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: totalFormatted,
      dueDate: dueDateFormatted,
      senderName: invoice.company.name || undefined,
      paymentUrl: paymentUrl || undefined,
      customMessage: emailBody,
    });

    // Send email via centralized sendEmail (which auto-logs to email_logs)
    const result = await sendEmail({
      to: recipientEmail,
      subject: subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
      tags: [{ name: 'type', value: 'factuur' }],
    });

    if (!result.success) {
      console.error('Send email error:', result.error);
      return NextResponse.json(
        { error: `Email versturen mislukt: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
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
