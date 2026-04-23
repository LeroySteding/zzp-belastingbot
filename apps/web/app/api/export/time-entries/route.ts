import { exportTimeEntriesCSV } from '@/lib/export/actions';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const csv = await exportTimeEntriesCSV();
  if (!csv) return NextResponse.json({ error: 'Geen data' }, { status: 404 });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="uren-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
