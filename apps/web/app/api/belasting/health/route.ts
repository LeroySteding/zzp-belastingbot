import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for deployment monitoring
 * Returns 200 if service is healthy, 503 if any critical service is down
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {}

  // Check 1: Supabase connection
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Simple query to check DB connectivity
    const { error } = await supabase.from('expenses').select('id').limit(1)
    
    if (error) {
      checks.database = { status: 'error', message: error.message }
    } else {
      checks.database = { status: 'ok' }
    }
  } catch (error) {
    checks.database = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Database connection failed' 
    }
  }

  // Check 2: Environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missingEnvVars = requiredEnvVars.filter(key => !process.env[key])
  
  if (missingEnvVars.length > 0) {
    checks.environment = { 
      status: 'error', 
      message: `Missing env vars: ${missingEnvVars.join(', ')}` 
    }
  } else {
    checks.environment = { status: 'ok' }
  }

  // Check 3: Google Vision API (optional)
  if (process.env.GOOGLE_VISION_API_KEY) {
    checks.ocr = { status: 'ok', message: 'API key configured' }
  } else {
    checks.ocr = { status: 'ok', message: 'API key not configured (OCR disabled)' }
  }

  // Overall status
  const allHealthy = Object.values(checks).every(check => check.status === 'ok')
  const status = allHealthy ? 200 : 503

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      checks,
    },
    { status }
  )
}
