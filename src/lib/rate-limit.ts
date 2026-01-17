import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key of Object.keys(store)) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}, 5 * 60 * 1000)

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit by IP address (for public/auth endpoints)
 */
export function rateLimit(
  request: NextRequest,
  options: { limit: number; windowMs: number }
): NextResponse | null {
  const ip = getClientIp(request)
  const key = `ip:${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  if (!store[key] || store[key].resetTime < now) {
    store[key] = { count: 1, resetTime: now + options.windowMs }
    return null
  }

  store[key].count++

  if (store[key].count > options.limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) }
      }
    )
  }

  return null
}

/**
 * Rate limit by user ID (for authenticated endpoints)
 */
export function rateLimitByUser(
  userId: string,
  endpoint: string,
  options: { limit: number; windowMs: number }
): NextResponse | null {
  const key = `user:${userId}:${endpoint}`
  const now = Date.now()

  if (!store[key] || store[key].resetTime < now) {
    store[key] = { count: 1, resetTime: now + options.windowMs }
    return null
  }

  store[key].count++

  if (store[key].count > options.limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please slow down.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) }
      }
    )
  }

  return null
}
