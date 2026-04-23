import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDFTemplate } from '@/lib/factuur/pdf/invoice-template';
import { OffertePDFTemplate } from '@/lib/factuur/pdf/offerte-template';
import type { OfferteForPDF } from '@/lib/factuur/pdf/offerte-template';
import { Invoice } from '@/lib/factuur/types/invoice';
import { createClient } from '@/lib/supabase/server';
import { getCompanyInfo } from '@/lib/factuur/actions';
import React from 'react';

// ============================================
// GET: Authenticated PDF download via query params
// Usage: /api/factuur/pdf?id=<uuid>&type=invoice|offerte
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'invoice';

    if (!id) {
      return NextResponse.json(
        { error: 'Parameter "id" is verplicht.' },
        { status: 400 }
      );
    }

    if (type !== 'invoice' && type !== 'offerte') {
      return NextResponse.json(
        { error: 'Parameter "type" moet "invoice" of "offerte" zijn.' },
        { status: 400 }
      );
    }

    // Authenticate the user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Niet ingelogd. Log in om PDFs te downloaden.' },
        { status: 401 }
      );
    }

    // Fetch company info
    const companyInfo = await getCompanyInfo();

    let buffer: Buffer;
    let filename: string;

    if (type === 'invoice') {
      // Fetch invoice with items, verifying ownership
      const { data: inv, error } = await supabase
        .from('invoices')
        .select(
          `
          *,
          clients (id, name, address, email, kvk, btw_number),
          invoice_items (id, description, quantity, unit_price, btw_rate, sort_order)
        `
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !inv) {
        return NextResponse.json(
          { error: 'Factuur niet gevonden of geen toegang.' },
          { status: 404 }
        );
      }

      const invoice: Invoice = {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        date: inv.date,
        dueDate: inv.due_date,
        status: inv.status,
        clientId: inv.client_id || undefined,
        notes: inv.notes || undefined,
        recurring: inv.recurring_frequency || undefined,
        template: inv.template || 'modern',
        company: companyInfo || {
          name: '',
          address: '',
          kvk: '',
          btwNumber: '',
          iban: '',
        },
        client: inv.clients
          ? {
              name: inv.clients.name,
              address: inv.clients.address || '',
              email: inv.clients.email || '',
              kvk: inv.clients.kvk || undefined,
              btwNumber: inv.clients.btw_number || undefined,
            }
          : { name: '', address: '' },
        items: (inv.invoice_items || [])
          .sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          )
          .map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            btwRate: item.btw_rate as 0 | 9 | 21,
          })),
      };

      buffer = await renderToBuffer(
        React.createElement(InvoicePDFTemplate, { invoice }) as any
      );
      filename = `factuur-${invoice.invoiceNumber}.pdf`;
    } else {
      // Fetch offerte with items, verifying ownership
      const { data: off, error } = await supabase
        .from('offertes')
        .select(
          `
          *,
          clients (id, name, address, email, kvk, btw_number),
          offerte_items (id, description, quantity, unit_price, btw_rate, sort_order)
        `
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !off) {
        return NextResponse.json(
          { error: 'Offerte niet gevonden of geen toegang.' },
          { status: 404 }
        );
      }

      const offerte: OfferteForPDF = {
        id: off.id,
        offerteNumber: off.offerte_number,
        date: off.date,
        validUntil: off.valid_until,
        status: off.status,
        company: companyInfo || {
          name: '',
          address: '',
          kvk: '',
          btwNumber: '',
          iban: '',
        },
        client: off.clients
          ? {
              name: off.clients.name,
              address: off.clients.address || '',
              email: off.clients.email || '',
              kvk: off.clients.kvk || undefined,
              btwNumber: off.clients.btw_number || undefined,
            }
          : { name: '', address: '' },
        items: (off.offerte_items || [])
          .sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          )
          .map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            btwRate: item.btw_rate as 0 | 9 | 21,
          })),
        notes: off.notes || undefined,
      };

      buffer = await renderToBuffer(
        React.createElement(OffertePDFTemplate, { offerte }) as any
      );
      filename = `offerte-${offerte.offerteNumber}.pdf`;
    }

    const pdfBytes = new Uint8Array(buffer);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
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

// ============================================
// POST: Legacy endpoint for backward compatibility
// Used by existing code that sends invoice data directly
// ============================================

export async function POST(request: NextRequest) {
  try {
    const invoice: Invoice = await request.json();

    // Validate minimum required fields
    if (
      !invoice.invoiceNumber ||
      !invoice.company ||
      !invoice.client ||
      !invoice.items
    ) {
      return NextResponse.json(
        {
          error:
            'Ongeldige factuurgegevens. Controleer of alle verplichte velden zijn ingevuld.',
        },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(
      React.createElement(InvoicePDFTemplate, { invoice }) as any
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
