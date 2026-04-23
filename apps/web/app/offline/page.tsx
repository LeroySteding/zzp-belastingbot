'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <WifiOff className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">Geen internetverbinding</h2>
        <p className="text-muted-foreground text-sm">
          Je bent offline. Controleer je internetverbinding en probeer het opnieuw.
        </p>
        <Button onClick={() => window.location.reload()}>
          Opnieuw proberen
        </Button>
      </div>
    </div>
  );
}
