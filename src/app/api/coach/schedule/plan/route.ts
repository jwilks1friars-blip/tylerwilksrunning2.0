import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { athleteId, goalRace, goalTime, startDate, raceDate } = await request.json()

  if (!athleteId || !startDate || !raceDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

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
