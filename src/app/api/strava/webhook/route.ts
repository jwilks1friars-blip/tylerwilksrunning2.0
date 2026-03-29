import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStravaActivity, metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { postToSlack } from '@/lib/slack'
import { autoCompleteWorkout } from '@/lib/autoCompleteWorkout'
import { generateActivityInsight } from '@/lib/anthropic'
import { format } from 'date-fns'

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

  // Find which user this Strava athlete belongs to
  const { data: connection } = await supabase
    .from('strava_connections')
    .select('user_id, access_token')
    .eq('strava_athlete_id', body.owner_id)
    .single()

  if (!connection) return NextResponse.json({ received: true })

  // Fetch full activity details from Strava
  const activity = await getStravaActivity(connection.access_token, body.object_id)

  // Save to database
  await supabase.from('activities').upsert({
    user_id: connection.user_id,
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
  })

  // Auto-generate AI insight for run activities
  const runTypes = ['Run', 'TrailRun', 'VirtualRun']
  if (runTypes.includes(activity.type)) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, goal_race, goal_time')
        .eq('id', connection.user_id)
        .single()

      const { data: savedActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('strava_id', activity.id)
        .single()

      if (savedActivity) {
        const insight = await generateActivityInsight({
          athleteName: profile?.full_name ?? 'Athlete',
          activityName: activity.name,
          activityType: activity.type,
          distanceMiles: metersToMiles(activity.distance),
          pacePerMile: activity.average_speed ? mpsToMinPerMile(activity.average_speed) : '—',
          avgHR: activity.average_heartrate ?? undefined,
          elevationGain: activity.total_elevation_gain ?? undefined,
          date: format(new Date(activity.start_date), 'EEEE MMM d'),
          goalRace: profile?.goal_race ?? undefined,
          goalTime: profile?.goal_time ?? undefined,
        })

        await supabase.from('activity_insights').upsert({
          activity_id: savedActivity.id,
          user_id: connection.user_id,
          content: insight,
        }, { onConflict: 'activity_id' })
      }
    } catch {
      // Non-blocking
    }
  }

  // Notify coach via Slack for run activities
  if (process.env.SLACK_WEBHOOK_COACH && runTypes.includes(activity.type)) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', connection.user_id)
        .single()

      const miles = metersToMiles(activity.distance).toFixed(1)
      const pace = activity.average_speed ? mpsToMinPerMile(activity.average_speed) : null
      const paceStr = pace ? ` @ ${pace}/mi` : ''
      const athleteId = profile?.id ?? connection.user_id

      await postToSlack(
        process.env.SLACK_WEBHOOK_COACH,
        [
          `🏃 *${profile?.full_name ?? 'Athlete'}* — ${miles} mi${paceStr}`,
          `<https://tylerwilksrunning.vercel.app/coach/athletes/${athleteId}|View athlete>`,
        ].join('\n')
      )
    } catch {
      // Slack failure shouldn't block the webhook response
    }
  }

  // Auto-complete matching scheduled workout
  await autoCompleteWorkout(connection.user_id, activity.start_date, supabase)

  return NextResponse.json({ received: true })
}
