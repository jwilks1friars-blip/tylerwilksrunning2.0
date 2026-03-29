import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCorosActivities, refreshCorosToken, mapCorosActivityType, corosPaceToMps } from '@/lib/coros'
import { generateActivityInsight } from '@/lib/anthropic'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format, addSeconds, isBefore } from 'date-fns'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: connection } = await supabase
    .from('coros_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!connection) return NextResponse.json({ error: 'No Coros connection' }, { status: 400 })

  // Refresh token if expired
  let accessToken = connection.access_token
  if (connection.token_expires_at && isBefore(new Date(connection.token_expires_at), new Date())) {
    const refreshed = await refreshCorosToken(connection.refresh_token)
    accessToken = refreshed.access_token
    await supabase.from('coros_connections').update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? connection.refresh_token,
      token_expires_at: addSeconds(new Date(), refreshed.expires_in ?? 3600).toISOString(),
    }).eq('user_id', user.id)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, goal_race, goal_time')
    .eq('id', user.id)
    .single()

  const activities = await getCorosActivities(accessToken, 1, 50)
  const runTypes = ['Run', 'TrailRun', 'VirtualRun']
  let imported = 0

  for (const a of activities) {
    const activityType = mapCorosActivityType(a.type)
    const avgSpeedMps = corosPaceToMps(a.avgPace)
    const startedAt = new Date(a.startTime * 1000).toISOString()

    // Use labelId as the unique external ID (stored in strava_id column)
    const { data: saved } = await supabase.from('activities').upsert({
      user_id: user.id,
      strava_id: a.labelId,
      name: a.name ?? activityType,
      distance: a.distance,
      elapsed_time: a.totalTime,
      moving_time: a.totalTime,
      avg_pace: avgSpeedMps ? 1 / avgSpeedMps : null,
      avg_hr: a.avgHr ?? null,
      max_hr: a.maxHr ?? null,
      elevation_gain: a.elevationGain ?? null,
      cadence: a.cadence ?? null,
      activity_type: activityType,
      started_at: startedAt,
      source: 'coros',
      raw_data: a,
    }, { onConflict: 'strava_id' }).select().single()

    if (saved && runTypes.includes(activityType)) {
      const insight = await generateActivityInsight({
        athleteName: profile?.full_name ?? 'Athlete',
        activityName: saved.name,
        activityType,
        distanceMiles: metersToMiles(a.distance),
        pacePerMile: avgSpeedMps ? mpsToMinPerMile(avgSpeedMps) : '—',
        avgHR: a.avgHr ?? undefined,
        elevationGain: a.elevationGain ?? undefined,
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
