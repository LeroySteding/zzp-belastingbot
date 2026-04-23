import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/factuur/InvoicePDF';
import { Invoice } from '@/lib/factuur/types/invoice';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const invoice: Invoice = await request.json();

    // Validate minimum required fields
    if (!invoice.invoiceNumber || !invoice.company || !invoice.client || !invoice.items) {
      return NextResponse.json(
        { error: 'Ongeldige factuurgegevens. Controleer of alle verplichte velden zijn ingevuld.' },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice }) as any
    );

    const pdfBytes = new Uint8Array(buffer);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van de PDF.' },
      { status: 500 }
    );
  }
}
