import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getAllStravaActivities } from '@/lib/strava'
import { getValidStravaToken } from '@/lib/strava-auth'

// Allow up to 5 minutes for a full history backfill
export const maxDuration = 300

export async function POST() {
  const serverClient = await createServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get a valid (auto-refreshed if expired) access token
  const accessToken = await getValidStravaToken(user.id, supabase)
  if (!accessToken) return NextResponse.json({ error: 'No Strava connection' }, { status: 400 })

  const synced = await syncAllActivities(user.id, accessToken, supabase)

  // Track last sync time
  await supabase
    .from('strava_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({ synced })
}

// Shared utility — also called directly from the OAuth callback
export async function syncAllActivities(
  userId: string,
  accessToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<number> {
  const activities = await getAllStravaActivities(accessToken)

  let synced = 0
  const BATCH = 50
  for (let i = 0; i < activities.length; i += BATCH) {
    const batch = activities.slice(i, i + BATCH) as Record<string, unknown>[]
    const rows = batch.map((a) => ({
      user_id: userId,
      strava_id: a.id,
      name: a.name,
      distance: a.distance,
      elapsed_time: a.elapsed_time,
      moving_time: a.moving_time,
      avg_pace: a.average_speed ? 1 / (a.average_speed as number) : null,
      avg_hr: a.average_heartrate ?? null,
      max_hr: a.max_heartrate ?? null,
      elevation_gain: a.total_elevation_gain ?? null,
      activity_type: a.type,
      started_at: a.start_date,
      raw_data: a,
    }))
    await supabase.from('activities').upsert(rows, { onConflict: 'strava_id' })
    synced += rows.length
  }
  return synced
}
