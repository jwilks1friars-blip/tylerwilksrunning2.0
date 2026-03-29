import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mapGarminActivityType } from '@/lib/garmin'
import { generateActivityInsight } from '@/lib/anthropic'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format } from 'date-fns'

// Garmin pushes activity summaries here via Health API webhook
export async function POST(request: NextRequest) {
  // Verify Garmin webhook token
  const token = request.headers.get('x-garmin-token')
  if (token !== process.env.GARMIN_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const activities = body?.activityDetails ?? body?.activities ?? []

  if (!activities.length) return NextResponse.json({ received: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const activity of activities) {
    const garminUserId = activity.userId ?? activity.garminUserId
    if (!garminUserId) continue

    // Find which user this Garmin account belongs to
    const { data: connection } = await supabase
      .from('garmin_connections')
      .select('user_id')
      .eq('garmin_user_id', String(garminUserId))
      .single()

    if (!connection) continue

    const summary = activity.summary ?? activity
    const activityType = mapGarminActivityType(summary.activityType ?? 'RUNNING')
    const distanceMeters = summary.distanceInMeters ?? 0
    const durationSecs = summary.durationInSeconds ?? 0
    const avgSpeedMps = distanceMeters > 0 && durationSecs > 0
      ? distanceMeters / durationSecs
      : undefined
    const startedAt = new Date((summary.startTimeInSeconds ?? 0) * 1000).toISOString()

    const { data: saved } = await supabase.from('activities').upsert({
      user_id: connection.user_id,
      strava_id: summary.activityId, // reuse strava_id column as unique external id
      name: summary.activityName ?? activityType,
      distance: distanceMeters,
      elapsed_time: durationSecs,
      moving_time: durationSecs,
      avg_pace: avgSpeedMps ? 1 / avgSpeedMps : null,
      avg_hr: summary.averageHeartRateInBeatsPerMinute ?? null,
      max_hr: summary.maxHeartRateInBeatsPerMinute ?? null,
      elevation_gain: summary.totalElevationGainInMeters ?? null,
      cadence: summary.averageRunCadenceInStepsPerMinute ?? null,
      activity_type: activityType,
      started_at: startedAt,
      source: 'garmin',
      raw_data: summary,
    }, { onConflict: 'strava_id' }).select().single()

    // Auto-generate AI insight for run types
    const runTypes = ['Run', 'TrailRun', 'VirtualRun']
    if (saved && runTypes.includes(activityType)) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, goal_race, goal_time')
          .eq('id', connection.user_id)
          .single()

        const insight = await generateActivityInsight({
          athleteName: profile?.full_name ?? 'Athlete',
          activityName: saved.name,
          activityType,
          distanceMiles: metersToMiles(distanceMeters),
          pacePerMile: avgSpeedMps ? mpsToMinPerMile(avgSpeedMps) : '—',
          avgHR: saved.avg_hr ?? undefined,
          elevationGain: saved.elevation_gain ?? undefined,
          date: format(new Date(startedAt), 'EEEE MMM d'),
          goalRace: profile?.goal_race ?? undefined,
          goalTime: profile?.goal_time ?? undefined,
        })

        await supabase.from('activity_insights').upsert({
          activity_id: saved.id,
          user_id: connection.user_id,
          content: insight,
        }, { onConflict: 'activity_id' })
      } catch {
        // Insight generation is non-blocking
      }
    }
  }

  return NextResponse.json({ received: true })
}
