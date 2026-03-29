import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGarminActivities, mapGarminActivityType } from '@/lib/garmin'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { generateActivityInsight } from '@/lib/anthropic'
import { format, subDays } from 'date-fns'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: connection } = await supabase
    .from('garmin_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!connection) return NextResponse.json({ error: 'No Garmin connection' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, goal_race, goal_time')
    .eq('id', user.id)
    .single()

  // Pull 90 days of activities
  const since = Math.floor(subDays(new Date(), 90).getTime() / 1000)
  const activities = await getGarminActivities(
    connection.access_token,
    connection.access_token_secret,
    since
  )

  let imported = 0
  const runTypes = ['Run', 'TrailRun', 'VirtualRun']

  for (const a of activities) {
    const activityType = mapGarminActivityType(a.activityType)
    const avgSpeedMps = a.distanceInMeters > 0 && a.durationInSeconds > 0
      ? a.distanceInMeters / a.durationInSeconds
      : undefined
    const startedAt = new Date(a.startTimeInSeconds * 1000).toISOString()

    const { data: saved } = await supabase.from('activities').upsert({
      user_id: user.id,
      strava_id: a.activityId,
      name: a.activityName ?? activityType,
      distance: a.distanceInMeters,
      elapsed_time: a.durationInSeconds,
      moving_time: a.durationInSeconds,
      avg_pace: avgSpeedMps ? 1 / avgSpeedMps : null,
      avg_hr: a.averageHeartRateInBeatsPerMinute ?? null,
      max_hr: a.maxHeartRateInBeatsPerMinute ?? null,
      elevation_gain: a.totalElevationGainInMeters ?? null,
      cadence: a.averageRunCadenceInStepsPerMinute ?? null,
      activity_type: activityType,
      started_at: startedAt,
      source: 'garmin',
      raw_data: a,
    }, { onConflict: 'strava_id' }).select().single()

    if (saved && runTypes.includes(activityType)) {
      const insight = await generateActivityInsight({
        athleteName: profile?.full_name ?? 'Athlete',
        activityName: saved.name,
        activityType,
        distanceMiles: metersToMiles(a.distanceInMeters),
        pacePerMile: avgSpeedMps ? mpsToMinPerMile(avgSpeedMps) : '—',
        avgHR: a.averageHeartRateInBeatsPerMinute ?? undefined,
        elevationGain: a.totalElevationGainInMeters ?? undefined,
        date: format(new Date(startedAt), 'EEEE MMM d'),
        goalRace: profile?.goal_race ?? undefined,
        goalTime: profile?.goal_time ?? undefined,
      }).catch(() => null)

      if (insight) {
        await supabase.from('activity_insights').upsert({
          activity_id: saved.id,
          user_id: user.id,
          content: insight,
        }, { onConflict: 'activity_id' })
      }
    }
    imported++
  }

  return NextResponse.json({ imported })
}
