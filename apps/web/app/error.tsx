'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Er is iets misgegaan</h2>
        <p className="text-muted-foreground text-sm">
          Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem contact op met support.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Opnieuw proberen</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Naar dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
