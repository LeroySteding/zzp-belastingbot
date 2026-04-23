'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-lg font-semibold">Er is iets misgegaan</h2>
        <p className="text-muted-foreground text-sm">
          Deze pagina kon niet worden geladen. Probeer het opnieuw.
        </p>
        <Button onClick={reset}>Opnieuw proberen</Button>
      </div>
    </div>
  );
}
