import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyInsight } from '@/lib/anthropic'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { startOfWeek, endOfWeek, format, differenceInWeeks } from 'date-fns'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Only Tyler can trigger insight generation
  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, coachNotes } = await request.json()

  // Get athlete profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Get this week's activities
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', weekStart.toISOString())
    .lte('started_at', weekEnd.toISOString())
    .order('started_at', { ascending: true })

  if (!activities?.length) {
    return NextResponse.json({ error: 'No activities this week' }, { status: 400 })
  }

  const weeklyMiles = activities.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  // Get upcoming workouts
  const { data: upcomingWorkouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_date', format(new Date(), 'yyyy-MM-dd'))
    .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
    .order('scheduled_date')

  const weeksToRace = profile?.goal_race
    ? differenceInWeeks(new Date(profile.goal_race), new Date())
    : undefined

  const content = await generateWeeklyInsight({
    athleteName: profile?.full_name ?? 'Athlete',
    activities: activities.map(a => ({
      date: format(new Date(a.started_at), 'EEEE MMM d'),
      type: a.activity_type,
      distanceMiles: metersToMiles(a.distance),
      pacePerMile: a.avg_pace ? mpsToMinPerMile(1 / a.avg_pace) : '—',
      avgHR: a.avg_hr,
      name: a.name,
    })),
    weeklyMiles: Math.round(weeklyMiles * 10) / 10,
    goalRace: profile?.goal_race,
    goalTime: profile?.goal_time,
    weeksToRace,
    upcomingWorkouts: upcomingWorkouts?.map(w => ({
      date: format(new Date(w.scheduled_date), 'EEEE MMM d'),
      type: w.workout_type,
      description: w.description ?? '',
    })),
    coachNotes: coachNotes || undefined,
  })

  // Save insight (unapproved until Tyler reviews)
  const { data: insight } = await supabase
    .from('insights')
    .insert({
      user_id: userId,
      week_start: format(weekStart, 'yyyy-MM-dd'),
      content,
      data_snapshot: { activities, weeklyMiles, coachNotes: coachNotes || null },
      approved: false,
    })
    .select()
    .single()

  return NextResponse.json({ insight })
}
