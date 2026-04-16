import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF } from '@/components/factuur/InvoicePDF';
import { Invoice } from '@/lib/factuur/types/invoice';

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

    // Send email via Resend
    const resend = new Resend(apiKey);

    const fromAddress =
      process.env.RESEND_FROM_EMAIL || 'Facturen <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: subject,
      text: emailBody,
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
    });
  } catch (err: any) {
    console.error('Send email error:', err);
    return NextResponse.json(
      { error: `Er is een onverwachte fout opgetreden: ${err.message}` },
      { status: 500 }
    );
  }
}
