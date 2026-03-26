import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireCoach, validateBody } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const auth = await requireCoach()
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const validationError = validateBody(body, {
    athleteId: { type: 'string', required: true },
    startDate: { type: 'date', required: true },
    raceDate: { type: 'date', required: true },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { athleteId, goalRace, goalTime, startDate, raceDate } = body

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { differenceInWeeks } = await import('date-fns')
  const totalWeeks = Math.max(1, differenceInWeeks(new Date(raceDate), new Date(startDate)))

  // Pause existing active plans
  await admin
    .from('training_plans')
    .update({ status: 'paused' })
    .eq('user_id', athleteId)
    .eq('status', 'active')

  const { data: plan, error } = await admin
    .from('training_plans')
    .insert({
      user_id: athleteId,
      goal_race: goalRace || null,
      goal_time: goalTime || null,
      start_date: startDate,
      race_date: raceDate,
      total_weeks: totalWeeks,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ plan })
}
