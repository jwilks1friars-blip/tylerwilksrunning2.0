import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { addDays, format, startOfWeek, nextMonday } from 'date-fns'

const TYPE_LABELS: Record<string, string> = {
  easy: 'Easy Run',
  tempo: 'Tempo',
  intervals: 'Intervals',
  long: 'Long Run',
  recovery: 'Recovery',
  rest: 'Rest',
  race: 'Race Day',
}

const TYPE_COLORS: Record<string, string> = {
  easy: '#7fbf7f',
  tempo: '#e8a050',
  intervals: '#e87070',
  long: '#7090e8',
  recovery: '#a0c4a0',
  rest: '#c8c4c0',
  race: '#fc4c02',
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Next week Mon–Sun
  const nextWeekMonday = nextMonday(new Date())
  const nextWeekSunday = addDays(nextWeekMonday, 6)
  const weekLabel = `${format(nextWeekMonday, 'MMM d')} – ${format(nextWeekSunday, 'MMM d, yyyy')}`

  // All athletes with active plans
  const { data: plans } = await supabase
    .from('training_plans')
    .select('id, user_id, goal_race, goal_time, race_date, total_weeks, start_date')
    .eq('status', 'active')

  if (!plans?.length) return NextResponse.json({ sent: 0 })

  const athleteIds = plans.map(p => p.user_id)

  const [{ data: profiles }, { data: workouts }, { data: insights }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', athleteIds),
    supabase
      .from('workouts')
      .select('id, plan_id, user_id, scheduled_date, workout_type, target_distance_miles, target_pace_desc, description')
      .in('user_id', athleteIds)
      .gte('scheduled_date', format(nextWeekMonday, 'yyyy-MM-dd'))
      .lte('scheduled_date', format(nextWeekSunday, 'yyyy-MM-dd'))
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('insights')
      .select('user_id, content')
      .in('user_id', athleteIds)
      .eq('approved', true)
      .order('created_at', { ascending: false }),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const insightMap: Record<string, string> = {}
  for (const insight of insights ?? []) {
    if (!insightMap[insight.user_id]) insightMap[insight.user_id] = insight.content
  }

  let sent = 0

  for (const plan of plans) {
    const profile = profileMap[plan.user_id]
    if (!profile?.email) continue

    const athleteWorkouts = (workouts ?? []).filter(w => w.user_id === plan.user_id)
    const totalMiles = athleteWorkouts
      .filter(w => w.workout_type !== 'rest' && w.target_distance_miles)
      .reduce((sum, w) => sum + (w.target_distance_miles ?? 0), 0)

    const weeksToRace = plan.race_date
      ? Math.max(0, Math.ceil((new Date(plan.race_date).getTime() - nextWeekMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      : null

    const firstName = profile.full_name?.split(' ')[0] ?? 'Athlete'
    const coachNote = insightMap[plan.user_id]

    // Build workout rows HTML
    const workoutRows = athleteWorkouts.length > 0
      ? athleteWorkouts.map(w => {
          const color = TYPE_COLORS[w.workout_type] ?? '#9c9895'
          const label = TYPE_LABELS[w.workout_type] ?? w.workout_type
          const dayName = format(new Date(w.scheduled_date), 'EEEE')
          const details = [
            w.target_distance_miles ? `${w.target_distance_miles} mi` : null,
            w.target_pace_desc ?? null,
          ].filter(Boolean).join(' · ')
          return `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0eeec;width:90px;color:#9c9895;font-size:13px;">${dayName}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f0eeec;">
                <span style="display:inline-block;background:${color}22;color:${color};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;border-radius:3px;">${label}</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #f0eeec;color:#1a1917;font-size:13px;">${details}</td>
            </tr>`
        }).join('')
      : `<tr><td colspan="3" style="padding:16px 0;color:#9c9895;font-size:13px;">No workouts scheduled for this week.</td></tr>`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #ebebea;border-radius:6px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:1px solid #ebebea;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9c9895;">Tyler Wilks Running</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1a1917;">Your Week Ahead</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#6b6865;">${weekLabel}${weeksToRace !== null ? ` · ${weeksToRace} week${weeksToRace !== 1 ? 's' : ''} to ${plan.goal_race ?? 'race day'}` : ''}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 24px;font-size:15px;color:#1a1917;">Hey ${firstName},</p>

      ${totalMiles > 0 ? `<p style="margin:0 0 24px;font-size:14px;color:#6b6865;">This week you have <strong style="color:#1a1917;">${totalMiles.toFixed(0)} miles</strong> planned. Here's your schedule:</p>` : '<p style="margin:0 0 24px;font-size:14px;color:#6b6865;">Here\'s your schedule for the week:</p>'}

      <table style="width:100%;border-collapse:collapse;">
        ${workoutRows}
      </table>

      ${coachNote ? `
      <div style="margin-top:28px;padding:16px 20px;background:#f9f8f7;border-left:3px solid #1a1917;border-radius:0 4px 4px 0;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9c9895;">From your coach</p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#3a3733;font-style:italic;">"${coachNote}"</p>
      </div>` : ''}

      <div style="margin-top:32px;">
        <a href="${process.env.APP_URL}/dashboard/training" style="display:inline-block;background:#1a1917;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:12px 24px;border-radius:4px;">View Full Schedule →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #ebebea;background:#fafaf9;">
      <p style="margin:0;font-size:12px;color:#c8c4c0;">Tyler Wilks Running · You're receiving this because you have an active training plan.</p>
    </div>
  </div>
</body>
</html>`

    await resend.emails.send({
      from: 'coach@tylerwilksrunning.com',
      to: profile.email,
      subject: `Your week ahead — ${weekLabel}`,
      html,
    })

    sent++
  }

  return NextResponse.json({ sent, week: weekLabel })
}
