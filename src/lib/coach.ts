/**
 * Server-only helpers for identifying the coach.
 * Uses the DB `is_coach` flag so the coach UUID never needs to
 * be passed to client components.
 */
import { createClient } from '@supabase/supabase-js'

let _cachedCoachId: string | null | undefined = undefined

/**
 * Returns the coach's user ID.
 * Looks up by `is_coach = true` in profiles, with env-var fallback.
 * Result is cached in-process for the lifetime of the serverless function.
 */
export async function getCoachId(): Promise<string | null> {
  // Use env var if set (fast path, no DB hit)
  if (process.env.COACH_USER_ID) return process.env.COACH_USER_ID

  if (_cachedCoachId !== undefined) return _cachedCoachId

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_coach', true)
    .maybeSingle()

  _cachedCoachId = data?.id ?? null
  return _cachedCoachId
}
