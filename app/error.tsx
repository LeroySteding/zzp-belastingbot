'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-3xl font-bold mb-4">Er is iets misgegaan</h1>
        <p className="text-muted-foreground mb-8">
          We hebben een onverwachte fout gedetecteerd. Probeer de pagina te verversen of neem contact met ons op als het probleem aanhoudt.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            Probeer opnieuw
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Ga naar home
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
