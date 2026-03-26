import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStravaActivity } from '@/lib/strava'
import { getValidStravaTokenByAthleteId } from '@/lib/strava-auth'

// Strava calls GET to verify the webhook endpoint
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Strava calls POST when an activity is created/updated
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Only handle new activity creation
  if (body.object_type !== 'activity' || body.aspect_type !== 'create') {
    return NextResponse.json({ received: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find which user this Strava athlete belongs to, refreshing token if needed
  const result = await getValidStravaTokenByAthleteId(body.owner_id, supabase)
  if (!result) return NextResponse.json({ received: true })

  const { accessToken, userId } = result

  // Fetch full activity details from Strava
  const activity = await getStravaActivity(accessToken, body.object_id)

  // Save to database
  await supabase.from('activities').upsert({
    user_id: userId,
    strava_id: activity.id,
    name: activity.name,
    distance: activity.distance,
    elapsed_time: activity.elapsed_time,
    moving_time: activity.moving_time,
    avg_pace: activity.average_speed ? 1 / activity.average_speed : null,
    avg_hr: activity.average_heartrate,
    max_hr: activity.max_heartrate,
    elevation_gain: activity.total_elevation_gain,
    activity_type: activity.type,
    started_at: activity.start_date,
    raw_data: activity,
  }, { onConflict: 'strava_id' })

  // Update last_synced_at timestamp
  await supabase
    .from('strava_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('strava_athlete_id', body.owner_id)

  return NextResponse.json({ received: true })
}
