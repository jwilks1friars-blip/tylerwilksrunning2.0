import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format } from 'date-fns'
import { rateLimit, requireAuth } from '@/lib/api-helpers'

/**
 * GET /api/export?format=csv|json
 *
 * Exports the authenticated athlete's activities as CSV or JSON.
 * Rate-limited to 5 exports per minute.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 5, 60_000)
  if (limited) return limited

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  const fmt = request.nextUrl.searchParams.get('format') ?? 'csv'
  if (!['csv', 'json'].includes(fmt)) {
    return NextResponse.json({ error: 'format must be csv or json' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch all data in parallel
  const [{ data: activities }, { data: raceResults }, { data: profile }] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('race_results')
      .select('*')
      .eq('user_id', user.id)
      .order('race_date', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name, email, goal_race, goal_time, experience, weekly_miles')
      .eq('id', user.id)
      .single(),
  ])

  const now = format(new Date(), 'yyyy-MM-dd')
  const name = (profile?.full_name ?? 'athlete').toLowerCase().replace(/\s+/g, '-')

  if (fmt === 'json') {
    const payload = {
      exported_at: new Date().toISOString(),
      profile,
      activities: (activities ?? []).map(mapActivity),
      race_results: raceResults ?? [],
    }
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${name}-export-${now}.json"`,
      },
    })
  }

  // CSV format
  const rows: string[] = []

  // Activities sheet
  rows.push('=== ACTIVITIES ===')
  rows.push('Date,Name,Type,Distance (mi),Pace (/mi),Moving Time,Avg HR,Max HR,Elevation (ft)')
  for (const a of activities ?? []) {
    const m = mapActivity(a)
    rows.push([
      m.date,
      `"${m.name.replace(/"/g, '""')}"`,
      m.type,
      m.distance_miles,
      m.pace,
      m.moving_time_sec,
      m.avg_hr ?? '',
      m.max_hr ?? '',
      m.elevation_ft ?? '',
    ].join(','))
  }

  rows.push('')
  rows.push('=== RACE RESULTS ===')
  rows.push('Date,Race,Distance,Finish Time,Goal Time,Overall Place,Age Group Place,Notes')
  for (const r of raceResults ?? []) {
    rows.push([
      r.race_date,
      `"${r.race_name.replace(/"/g, '""')}"`,
      r.distance,
      r.finish_time,
      r.goal_time ?? '',
      r.place_overall ?? '',
      r.place_age_group ?? '',
      `"${(r.notes ?? '').replace(/"/g, '""')}"`,
    ].join(','))
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${name}-export-${now}.csv"`,
    },
  })
}

function mapActivity(a: Record<string, unknown>) {
  return {
    date: format(new Date(a.started_at as string), 'yyyy-MM-dd'),
    name: (a.name as string) ?? '',
    type: (a.activity_type as string) ?? '',
    distance_miles: metersToMiles(a.distance as number),
    pace: a.avg_pace ? mpsToMinPerMile(1 / (a.avg_pace as number)) : '',
    moving_time_sec: a.moving_time ?? '',
    avg_hr: a.avg_hr ?? null,
    max_hr: a.max_hr ?? null,
    elevation_ft: a.elevation_gain != null
      ? Math.round((a.elevation_gain as number) * 3.281)
      : null,
  }
}
