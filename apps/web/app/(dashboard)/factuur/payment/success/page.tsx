'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice');

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Bedankt voor uw betaling!</h1>
            <p className="text-muted-foreground">
              Uw betaling is succesvol ontvangen. U ontvangt een bevestiging per
              e-mail zodra de betaling is verwerkt.
            </p>
          </div>

          {invoiceId && (
            <p className="text-sm text-muted-foreground">
              Referentie: <span className="font-mono">{invoiceId.slice(0, 8)}...</span>
            </p>
          )}

          <div className="pt-2">
            <Button asChild variant="outline">
              <Link href="/">Terug naar home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
