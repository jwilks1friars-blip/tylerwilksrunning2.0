import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateTrainingPlan } from '@/lib/anthropic'
import { addDays, format, nextMonday } from 'date-fns'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { athleteId, raceDate, goalRace, goalTime, startDate } = await request.json()

  if (!athleteId) return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, goal_race, goal_time, experience, weekly_miles')
    .eq('id', athleteId)
    .single()

  const resolvedRaceDate = raceDate ?? format(addDays(new Date(), 112), 'yyyy-MM-dd')
  const resolvedGoalRace = goalRace ?? profile?.goal_race ?? 'Goal Race'
  const resolvedGoalTime = goalTime ?? profile?.goal_time ?? 'finish strong'
  const resolvedStartDate = startDate ?? format(nextMonday(new Date()), 'yyyy-MM-dd')

  // Pause existing active plans
  await admin
    .from('training_plans')
    .update({ status: 'paused' })
    .eq('user_id', athleteId)
    .eq('status', 'active')

  const plan = await generateTrainingPlan({
    athleteName: profile?.full_name ?? 'Athlete',
    goalRace: resolvedGoalRace,
    raceDate: resolvedRaceDate,
    goalTime: resolvedGoalTime,
    currentWeeklyMiles: profile?.weekly_miles ?? 20,
    experience: profile?.experience ?? 'intermediate',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })

  const { data: savedPlan, error: planError } = await admin
    .from('training_plans')
    .insert({
      user_id: athleteId,
      goal_race: resolvedGoalRace,
      goal_time: resolvedGoalTime,
      start_date: resolvedStartDate,
      race_date: resolvedRaceDate,
      total_weeks: plan.totalWeeks,
      status: 'active',
    })
    .select()
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const workoutRows: object[] = []

  for (const week of plan.weeks ?? []) {
    for (const workout of week.workouts ?? []) {
      const dayIndex = daysOfWeek.indexOf(workout.dayOfWeek)
      if (dayIndex === -1) continue
      const weekOffset = (week.weekNumber - 1) * 7
      const scheduledDate = format(addDays(new Date(resolvedStartDate), weekOffset + dayIndex), 'yyyy-MM-dd')
      workoutRows.push({
        plan_id: savedPlan.id,
        user_id: athleteId,
        scheduled_date: scheduledDate,
        workout_type: workout.type,
        target_distance_miles: workout.distanceMiles ?? null,
        target_pace_desc: workout.paceTarget ?? null,
        description: workout.description ?? null,
        completed: false,
      })
    }
  }

  await admin.from('workouts').insert(workoutRows)

  return NextResponse.json({ plan: savedPlan, workoutsCreated: workoutRows.length })
}
