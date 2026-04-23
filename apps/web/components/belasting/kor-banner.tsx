'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Info, X } from 'lucide-react'
import { KORStatus, getKORBenefits, getKORRequirements } from '@/lib/belasting/kor-check'

interface KORBannerProps {
  korStatus: KORStatus
  onDismiss?: () => void
}

export function KORBanner({ korStatus, onDismiss }: KORBannerProps) {
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!korStatus.eligible || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <>
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 flex items-center justify-between">
          <span>Je komt mogelijk in aanmerking voor de KOR!</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-blue-800 mt-2">
          <p className="mb-2">{korStatus.recommendation}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="bg-card hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              Meer informatie
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kleineondernemersregeling (KOR)</DialogTitle>
            <DialogDescription>
              De KOR is een regeling voor kleine ondernemingen met een lage omzet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Jouw situatie</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geschatte jaaromzet:</span>
                  <span className="font-medium">€ {korStatus.currentRevenue.toLocaleString('nl-NL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KOR-grens:</span>
                  <span className="font-medium">€ {korStatus.threshold.toLocaleString('nl-NL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ruimte tot grens:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">€ {korStatus.remainingCapacity.toLocaleString('nl-NL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage gebruikt:</span>
                  <span className="font-medium">{korStatus.percentageUsed}%</span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-semibold mb-2">Voordelen van de KOR</h3>
              <ul className="space-y-1 text-sm">
                {getKORBenefits().map((benefit, idx) => (
                  <li key={idx} className="text-foreground/80">{benefit}</li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="font-semibold mb-2">Voorwaarden</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                {getKORRequirements().map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                <strong>Let op:</strong> Dit is een inschatting op basis van je uitgaven. 
                Raadpleeg altijd een belastingadviseur voordat je de KOR aanvraagt.
                De schatting is gebaseerd op de aanname dat je omzet ongeveer 1,5x je uitgaven is.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Sluiten
              </Button>
              <Button asChild>
                <a 
                  href="https://www.belastingdienst.nl/wps/wcm/connect/nl/ondernemers/content/hulp-bij-kleine-onderneming-kleineondernemersregeling-kor"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Naar Belastingdienst
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
