/**
 * Simple in-memory rate limiting for OCR endpoint
 * In production, use Redis or similar distributed cache
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  })
}, 60 * 60 * 1000)

export function checkRateLimit(
  identifier: string,
  limit: number = 20, // requests per window
  windowMs: number = 60 * 1000 // 1 minute window
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetAt) {
    // Create new entry
    const resetAt = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  // Increment count
  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}
