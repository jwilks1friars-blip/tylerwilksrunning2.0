import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateTrainingPlan } from '@/lib/anthropic'
import { addDays, format, nextMonday } from 'date-fns'
import { requireCoach, rateLimit, validateBody } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 5, 60_000)
  if (limited) return limited

  const auth = await requireCoach()
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const validationError = validateBody(body, {
    athleteId: { type: 'string', required: true },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { athleteId, raceDate, goalRace, goalTime, startDate } = body

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
