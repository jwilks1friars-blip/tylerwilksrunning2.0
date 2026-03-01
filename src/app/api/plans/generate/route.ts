import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTrainingPlan } from '@/lib/anthropic'
import { addDays, format, nextMonday } from 'date-fns'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, goal_race, goal_time, experience, weekly_miles')
    .eq('id', user.id)
    .single()

  if (!profile?.goal_race) {
    return NextResponse.json({ error: 'Set a goal race in settings first' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const raceDate = body.raceDate ?? format(addDays(new Date(), 112), 'yyyy-MM-dd') // default 16 weeks out
  const availableDays = body.availableDays ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Cancel any existing active plans
  await supabase
    .from('training_plans')
    .update({ status: 'paused' })
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Generate plan via Claude
  const plan = await generateTrainingPlan({
    athleteName: profile.full_name ?? 'Athlete',
    goalRace: profile.goal_race,
    raceDate,
    goalTime: profile.goal_time ?? 'finish strong',
    currentWeeklyMiles: profile.weekly_miles ?? 20,
    experience: profile.experience ?? 'intermediate',
    availableDays,
  })

  const startDate = format(nextMonday(new Date()), 'yyyy-MM-dd')

  // Save the plan
  const { data: savedPlan, error: planError } = await supabase
    .from('training_plans')
    .insert({
      user_id: user.id,
      goal_race: profile.goal_race,
      goal_time: profile.goal_time,
      start_date: startDate,
      race_date: raceDate,
      total_weeks: plan.totalWeeks,
      status: 'active',
    })
    .select()
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // Build workout rows from Claude's response
  const workoutRows: object[] = []
  for (const week of plan.weeks ?? []) {
    for (const workout of week.workouts ?? []) {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const dayIndex = daysOfWeek.indexOf(workout.dayOfWeek)
      if (dayIndex === -1) continue

      const weekOffset = (week.weekNumber - 1) * 7
      const scheduledDate = format(addDays(new Date(startDate), weekOffset + dayIndex), 'yyyy-MM-dd')

      workoutRows.push({
        plan_id: savedPlan.id,
        user_id: user.id,
        scheduled_date: scheduledDate,
        workout_type: workout.type,
        target_distance_miles: workout.distanceMiles ?? null,
        target_pace_desc: workout.paceTarget ?? null,
        description: workout.description ?? null,
        completed: false,
      })
    }
  }

  const { error: workoutsError } = await supabase
    .from('workouts')
    .insert(workoutRows)

  if (workoutsError) return NextResponse.json({ error: workoutsError.message }, { status: 500 })

  return NextResponse.json({ plan: savedPlan, workoutsCreated: workoutRows.length })
}
