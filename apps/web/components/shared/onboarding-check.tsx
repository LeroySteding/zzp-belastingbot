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

        // Check if onboarding is complete - try full query, fallback if columns missing
        let isComplete = false
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, company_name')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          isComplete = data.onboarding_completed === true || !!data.company_name
        } else if (error?.message?.includes('column')) {
          // onboarding_completed column doesn't exist yet, check company_name only
          const { data: fallback } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('id', user.id)
            .single()
          isComplete = !!fallback?.company_name
        }

        if (!isComplete) {
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
