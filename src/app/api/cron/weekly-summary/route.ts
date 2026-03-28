import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { metersToMiles } from '@/lib/strava'
import { format, subDays, startOfWeek, endOfWeek, differenceInWeeks } from 'date-fns'
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
  // Last week Mon–Sun
  const lastWeekMonday = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7)
  const lastWeekSunday = endOfWeek(lastWeekMonday, { weekStartsOn: 1 })
  const weekLabel = `${format(lastWeekMonday, 'MMM d')}–${format(lastWeekSunday, 'MMM d')}`

  // All athletes with active plans
  const { data: plans } = await supabase
    .from('training_plans')
    .select('user_id, goal_race, race_date')
    .eq('status', 'active')

  if (!plans?.length) {
    return NextResponse.json({ sent: false, reason: 'no active plans' })
  }

  const athleteIds = plans.map(p => p.user_id)

  const [{ data: profiles }, { data: lastWeekActivities }, { data: lastWeekWorkouts }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', athleteIds),
      supabase
        .from('activities')
        .select('user_id, distance')
        .in('user_id', athleteIds)
        .gte('started_at', lastWeekMonday.toISOString())
        .lte('started_at', lastWeekSunday.toISOString()),
      supabase
        .from('workouts')
        .select('user_id, target_distance_miles, workout_type')
        .in('user_id', athleteIds)
        .gte('scheduled_date', format(lastWeekMonday, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(lastWeekSunday, 'yyyy-MM-dd')),
    ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))
  const planMap = Object.fromEntries(plans.map(p => [p.user_id, p]))

  // Miles logged per athlete last week
  const milesMap: Record<string, number> = {}
  for (const a of lastWeekActivities ?? []) {
    milesMap[a.user_id] = (milesMap[a.user_id] ?? 0) + metersToMiles(a.distance)
  }

  // Target miles per athlete last week (sum of non-rest workouts)
  const targetMap: Record<string, number> = {}
  for (const w of lastWeekWorkouts ?? []) {
    if (w.workout_type !== 'rest' && w.target_distance_miles) {
      targetMap[w.user_id] = (targetMap[w.user_id] ?? 0) + w.target_distance_miles
    }
  }

  const alerts: string[] = []
  const athleteLines: string[] = []

  for (const athleteId of athleteIds) {
    const name = profileMap[athleteId] ?? 'Unknown'
    const actual = milesMap[athleteId] ?? 0
    const target = targetMap[athleteId] ?? 0
    const plan = planMap[athleteId]

    const weeksToRace = plan.race_date
      ? differenceInWeeks(new Date(plan.race_date), now)
      : null

    const raceStr = weeksToRace !== null
      ? `${plan.goal_race ?? 'Race'} (${weeksToRace}w)`
      : '—'

    const noRunsFlag = actual === 0 ? ' ⚠️' : ''
    const actualStr = actual.toFixed(1)
    const targetStr = target > 0 ? `${target.toFixed(0)} mi` : '—'

    athleteLines.push(`• *${name}* — ${actualStr} mi / ${targetStr} planned  |  ${raceStr}${noRunsFlag}`)

    if (weeksToRace !== null && weeksToRace <= 1) {
      alerts.push(`🏁 *${name}* — RACE WEEK (${plan.goal_race ?? 'Race'} ${format(new Date(plan.race_date!), 'MMM d')})`)
    } else if (weeksToRace === 2) {
      alerts.push(`⬇️ *${name}* — Taper week (2 weeks to ${plan.goal_race ?? 'race'})`)
    }

    if (actual === 0) {
      alerts.push(`⚠️ *${name}* — no runs logged last week`)
    }
  }

  const lines = [
    `*Weekly Team Summary — ${weekLabel}* :bar_chart:`,
    ``,
    ...athleteLines,
  ]

  if (alerts.length > 0) {
    lines.push(``, `*Alerts:*`, ...alerts)
  }

  lines.push(``, `<https://tylerwilksrunning.vercel.app/coach|Open coach dashboard>`)

  await postToSlack(process.env.SLACK_WEBHOOK_COACH, lines.join('\n'))

  return NextResponse.json({ ok: true, athletes: athleteIds.length })
}
