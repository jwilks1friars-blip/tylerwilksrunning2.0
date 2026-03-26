/**
 * Shared API-route helpers:
 *  - requireCoach:  verifies the caller is the authenticated coach
 *  - rateLimit:     simple in-memory sliding-window rate limiter
 *  - validate:      lightweight request body validation
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Coach guard ────────────────────────────────────────────────────────────

/**
 * Verifies the currently authenticated user is the coach.
 * Returns the user object on success, or a 401 NextResponse on failure.
 *
 * Usage:
 *   const result = await requireCoach()
 *   if (result instanceof NextResponse) return result
 *   const { user } = result
 */
export async function requireCoach(): Promise<
  { user: { id: string } } | NextResponse
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Support both env-var check AND is_coach DB flag for flexibility
  const isEnvCoach = user.id === process.env.COACH_USER_ID
  if (isEnvCoach) {
    return { user: { id: user.id } }
  }

  // Fallback: check is_coach flag in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_coach')
    .eq('id', user.id)
    .single()

  if (!profile?.is_coach) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { user: { id: user.id } }
}

/**
 * Verifies the caller is any authenticated user.
 * Returns the user on success or a 401 NextResponse.
 */
export async function requireAuth(): Promise<
  { user: { id: string } } | NextResponse
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { user: { id: user.id } }
}

// ─── Rate limiter ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * @param key       Unique key (e.g. IP + route)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds (default 60 000 = 1 min)
 *
 * Returns a 429 NextResponse when the limit is exceeded, otherwise null.
 */
export function rateLimit(
  request: NextRequest,
  limit: number,
  windowMs = 60_000
): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  const entry = rateLimitMap.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    return null
  }

  entry.count++
  if (entry.count > limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.windowStart + windowMs - now) / 1000)),
        },
      }
    )
  }

  return null
}

// ─── Input validation ────────────────────────────────────────────────────────

type FieldSpec =
  | { type: 'string'; required?: boolean; minLength?: number; maxLength?: number }
  | { type: 'number'; required?: boolean; min?: number; max?: number }
  | { type: 'boolean'; required?: boolean }
  | { type: 'date'; required?: boolean }

/**
 * Validates an object against a schema spec.
 * Returns null if valid, or an error message string.
 *
 * Example:
 *   const err = validateBody(body, {
 *     title:   { type: 'string', required: true, maxLength: 200 },
 *     published: { type: 'boolean' },
 *   })
 *   if (err) return NextResponse.json({ error: err }, { status: 400 })
 */
export function validateBody(
  body: Record<string, unknown>,
  schema: Record<string, FieldSpec>
): string | null {
  for (const [field, spec] of Object.entries(schema)) {
    const val = body[field]

    if (spec.required && (val === undefined || val === null || val === '')) {
      return `"${field}" is required`
    }

    if (val === undefined || val === null) continue

    if (spec.type === 'string') {
      if (typeof val !== 'string') return `"${field}" must be a string`
      if (spec.minLength && val.length < spec.minLength)
        return `"${field}" must be at least ${spec.minLength} characters`
      if (spec.maxLength && val.length > spec.maxLength)
        return `"${field}" must be at most ${spec.maxLength} characters`
    }

    if (spec.type === 'number') {
      if (typeof val !== 'number' || isNaN(val)) return `"${field}" must be a number`
      if (spec.min !== undefined && val < spec.min)
        return `"${field}" must be at least ${spec.min}`
      if (spec.max !== undefined && val > spec.max)
        return `"${field}" must be at most ${spec.max}`
    }

    if (spec.type === 'boolean' && typeof val !== 'boolean') {
      return `"${field}" must be a boolean`
    }

    if (spec.type === 'date') {
      if (typeof val !== 'string' || isNaN(Date.parse(val)))
        return `"${field}" must be a valid date string`
    }
  }

  return null
}
