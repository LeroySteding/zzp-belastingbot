'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Skip check on the onboarding page itself
    if (pathname === '/onboarding') {
      setChecked(true)
      return
    }

    // Skip if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setChecked(true)
      return
    }

    async function checkOnboarding() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setChecked(true)
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // Redirect to onboarding if no profile exists or onboarding not completed
        if (!data || data.onboarding_completed === false) {
          router.push('/onboarding')
          return
        }
      } catch {
        // If check fails, don't block the user
      }
      setChecked(true)
    }

    checkOnboarding()
  }, [pathname, router])

  if (!checked) {
    return null
  }

  return <>{children}</>
}
