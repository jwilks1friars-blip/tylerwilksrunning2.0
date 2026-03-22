import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getAllStravaActivities, refreshStravaToken } from '@/lib/strava'

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

  // Get the user's Strava connection
  const { data: connection } = await supabase
    .from('strava_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', user.id)
    .single()

  if (!connection) return NextResponse.json({ error: 'No Strava connection' }, { status: 400 })

  // Refresh token if expired
  let accessToken = connection.access_token
  if (new Date(connection.token_expires_at) <= new Date()) {
    const refreshed = await refreshStravaToken(connection.refresh_token)
    accessToken = refreshed.access_token
    await supabase.from('strava_connections').update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    }).eq('user_id', user.id)
  }

  const synced = await syncAllActivities(user.id, accessToken, supabase)
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
