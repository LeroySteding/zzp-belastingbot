import { NextRequest, NextResponse } from 'next/server';
import { getOverdueInvoices, sendAllReminders } from '@/lib/factuur/reminder-actions';

// GET: List overdue invoices
export async function GET() {
  try {
    const overdueInvoices = await getOverdueInvoices();
    return NextResponse.json({
      count: overdueInvoices.length,
      invoices: overdueInvoices,
    });
  } catch (err: any) {
    console.error('Error fetching overdue invoices:', err);
    return NextResponse.json(
      { error: `Fout bij ophalen verlopen facturen: ${err.message}` },
      { status: 500 }
    );
  }
}

// POST: Send reminder emails for all overdue invoices
export async function POST(request: NextRequest) {
  try {
    const result = await sendAllReminders();

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (err: any) {
    console.error('Error sending reminders:', err);
    return NextResponse.json(
      { error: `Fout bij versturen herinneringen: ${err.message}` },
      { status: 500 }
    );
  }
}
