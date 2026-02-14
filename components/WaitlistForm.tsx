'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const { toast } = useToast()

  // Fetch current waitlist count
  useEffect(() => {
    fetch('/api/waitlist')
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch(() => setCount(null))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          'Je staat op de wachtlijst!',
          'We houden je op de hoogte van de lancering.'
        )
        setEmail('')
        // Update count
        if (count !== null) {
          setCount(count + 1)
        }
      } else {
        toast.error(
          'Oeps!',
          data.error || 'Er ging iets mis. Probeer het opnieuw.'
        )
      }
    } catch (error) {
      toast.error(
        'Fout',
        'Kan geen verbinding maken. Controleer je internet.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="jouw@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading} className="whitespace-nowrap">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bezig...
            </>
          ) : (
            'Meld je aan'
          )}
        </Button>
      </form>
      {count !== null && count > 0 && (
        <p className="mt-3 text-sm text-center text-muted-foreground">
          Al <span className="font-semibold text-primary">{count}</span> ZZP&apos;ers aangemeld!
        </p>
      )}
    </div>
  )
}
