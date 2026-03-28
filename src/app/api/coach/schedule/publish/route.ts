import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { format, addDays } from 'date-fns'

const TYPE_LABELS: Record<string, string> = {
  easy: 'Easy Run', tempo: 'Tempo', intervals: 'Intervals',
  long: 'Long Run', recovery: 'Recovery', rest: 'Rest', race: 'Race Day',
}
const TYPE_COLORS: Record<string, string> = {
  easy: '#7fbf7f', tempo: '#e8a050', intervals: '#e87070',
  long: '#7090e8', recovery: '#a0c4a0', rest: '#c8c4c0', race: '#fc4c02',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planId, athleteId } = await request.json()
  if (!planId || !athleteId) {
    return NextResponse.json({ error: 'Missing planId or athleteId' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Pause any currently active plans for this athlete
  await admin
    .from('training_plans')
    .update({ status: 'paused' })
    .eq('user_id', athleteId)
    .eq('status', 'active')

  const { data: plan, error } = await admin
    .from('training_plans')
    .update({ status: 'active' })
    .eq('id', planId)
    .eq('user_id', athleteId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send plan email to athlete (best-effort, don't fail publish if email fails)
  try {
    const [{ data: profile }, { data: workouts }] = await Promise.all([
      admin.from('profiles').select('full_name, email').eq('id', athleteId).single(),
      admin.from('workouts')
        .select('scheduled_date, workout_type, target_distance_miles, target_pace_desc, description')
        .eq('plan_id', planId)
        .order('scheduled_date', { ascending: true }),
    ])

    if (profile?.email && workouts?.length) {
      const firstName = profile.full_name?.split(' ')[0] ?? 'Athlete'
      const planStart = format(new Date(plan.start_date), 'MMM d, yyyy')
      const planEnd = format(new Date(plan.race_date), 'MMM d, yyyy')
      const totalWeeks = plan.total_weeks

      // Group workouts by week
      const weekStart = new Date(plan.start_date)
      const weeks: Array<{ label: string; workouts: typeof workouts }> = []
      for (let w = 0; w < totalWeeks; w++) {
        const wStart = addDays(weekStart, w * 7)
        const wEnd = addDays(wStart, 6)
        const wLabel = `Week ${w + 1} — ${format(wStart, 'MMM d')}`
        const wWorkouts = workouts.filter(wo => {
          const d = new Date(wo.scheduled_date)
          return d >= wStart && d <= wEnd
        })
        if (wWorkouts.length) weeks.push({ label: wLabel, workouts: wWorkouts })
      }

      const weeksHtml = weeks.map(({ label, workouts: wos }) => `
        <div style="margin-bottom:28px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9c9895;">${label}</p>
          <table style="width:100%;border-collapse:collapse;">
            ${wos.map(wo => {
              const color = TYPE_COLORS[wo.workout_type] ?? '#9c9895'
              const label = TYPE_LABELS[wo.workout_type] ?? wo.workout_type
              const day = format(new Date(wo.scheduled_date), 'EEE MMM d')
              const details = [
                wo.target_distance_miles ? `${wo.target_distance_miles} mi` : null,
                wo.target_pace_desc ?? null,
              ].filter(Boolean).join(' · ')
              return `
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid #f0eeec;width:100px;font-size:12px;color:#9c9895;">${day}</td>
                <td style="padding:9px 10px;border-bottom:1px solid #f0eeec;width:110px;">
                  <span style="display:inline-block;background:${color}22;color:${color};font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 7px;border-radius:3px;">${label}</span>
                </td>
                <td style="padding:9px 0;border-bottom:1px solid #f0eeec;">
                  <span style="font-size:13px;color:#1a1917;">${details}</span>
                  ${wo.description ? `<br><span style="font-size:12px;color:#9c9895;line-height:1.5;">${wo.description}</span>` : ''}
                </td>
              </tr>`
            }).join('')}
          </table>
        </div>`).join('')

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #ebebea;border-radius:6px;overflow:hidden;">

    <div style="padding:28px 32px;border-bottom:1px solid #ebebea;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9c9895;">Tyler Wilks Running</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1a1917;">Your Training Plan is Ready</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#6b6865;">
        ${plan.goal_race ?? 'Goal Race'}${plan.goal_time ? ` · ${plan.goal_time}` : ''}<br>
        ${planStart} → ${planEnd} · ${totalWeeks} weeks
      </p>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 24px;font-size:15px;color:#1a1917;">Hey ${firstName},</p>
      <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#6b6865;">
        Your training plan for <strong style="color:#1a1917;">${plan.goal_race ?? 'your goal race'}</strong> has been published. Here's your full schedule — refer back to this anytime, and check your dashboard each week for your current workouts.
      </p>

      ${weeksHtml}

      <div style="margin-top:32px;">
        <a href="${process.env.APP_URL}/dashboard/training" style="display:inline-block;background:#1a1917;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:12px 24px;border-radius:4px;">View Your Dashboard →</a>
      </div>
    </div>

    <div style="padding:20px 32px;border-top:1px solid #ebebea;background:#fafaf9;">
      <p style="margin:0;font-size:12px;color:#c8c4c0;">Tyler Wilks Running · You'll also receive weekly plan emails every Sunday evening.</p>
    </div>
  </div>
</body>
</html>`

      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'coach@tylerwilksrunning.com',
        to: profile.email,
        subject: `Your ${plan.goal_race ?? 'training'} plan is ready — ${totalWeeks} weeks to ${planEnd}`,
        html,
      })
    }
  } catch (emailErr) {
    console.error('Publish email failed (non-fatal):', emailErr)
  }

  return NextResponse.json({ plan })
}
