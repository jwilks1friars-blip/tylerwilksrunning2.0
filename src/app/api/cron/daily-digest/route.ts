import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format, subDays, startOfWeek, startOfDay, endOfDay } from 'date-fns'
import { postToSlack } from '@/lib/slack'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SLACK_WEBHOOK_COACH) {
    return NextResponse.json({ skipped: 'no webhook configured' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const yesterday = subDays(now, 1)
  const weekMonday = startOfWeek(now, { weekStartsOn: 1 })

  const [
    { count: unreadCount },
    { data: athletes },
    { data: yesterdayActivities },
    { data: weekActivities },
  ] = await Promise.all([
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', process.env.COACH_USER_ID)
      .is('read_at', null),
    supabase
      .from('profiles')
      .select('id, full_name')
      .neq('id', process.env.COACH_USER_ID)
      .neq('plan_tier', 'none'),
    supabase
      .from('activities')
      .select('user_id, distance, avg_pace, activity_type')
      .gte('started_at', startOfDay(yesterday).toISOString())
      .lte('started_at', endOfDay(yesterday).toISOString()),
    supabase
      .from('activities')
      .select('user_id, distance')
      .gte('started_at', weekMonday.toISOString()),
  ])

  const profileMap = Object.fromEntries((athletes ?? []).map(a => [a.id, a.full_name]))

  // Team miles this week
  const teamMilesThisWeek = (weekActivities ?? []).reduce(
    (sum, a) => sum + metersToMiles(a.distance),
    0
  )

  // Yesterday's run lines
  const athleteIdsWithRuns = new Set((yesterdayActivities ?? []).map(a => a.user_id))
  const runLines = (yesterdayActivities ?? [])
    .filter(a => ['Run', 'TrailRun', 'VirtualRun'].includes(a.activity_type))
    .map(a => {
      const name = profileMap[a.user_id] ?? 'Unknown'
      const miles = metersToMiles(a.distance).toFixed(1)
      const pace = a.avg_pace ? mpsToMinPerMile(1 / a.avg_pace) : null
      return `• ${name} — ${miles} mi${pace ? ` @ ${pace}/mi` : ''}`
    })

  // Athletes with no activity yesterday
  const inactiveLines = (athletes ?? [])
    .filter(a => !athleteIdsWithRuns.has(a.id))
    .map(a => `• ${a.full_name} — no activity`)

  const dateLabel = format(yesterday, 'EEEE, MMM d')
  const lines = [
    `*Good morning — here's your team update* :sun_with_face:`,
    `*Unread messages:* ${unreadCount ?? 0}`,
    `*Team miles this week:* ${teamMilesThisWeek.toFixed(1)} mi`,
    ``,
    `*${dateLabel}:*`,
    ...(runLines.length > 0 ? runLines : ['• No runs logged']),
    ...(inactiveLines.length > 0 ? inactiveLines : []),
    ``,
    `<https://tylerwilksrunning.vercel.app/coach|Open coach dashboard>`,
  ]

  await postToSlack(process.env.SLACK_WEBHOOK_COACH, lines.join('\n'))

  return NextResponse.json({ ok: true })
}
