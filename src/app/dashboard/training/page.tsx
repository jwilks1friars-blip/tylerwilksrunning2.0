export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { differenceInCalendarDays, differenceInWeeks, format, startOfWeek, addDays, parseISO } from 'date-fns'
import WorkoutCalendar from '@/components/dashboard/WorkoutCalendar'
import Link from 'next/link'

const INTENSITY_ORDER: Record<string, number> = {
  race: 5, intervals: 4, tempo: 3, long: 2, easy: 1, recovery: 0, rest: -1,
}

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: plan }, { data: insight }] = await Promise.all([
    supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('insights')
      .select('content, week_start')
      .eq('user_id', user!.id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const { data: workouts } = plan
    ? await supabase
        .from('workouts')
        .select('id, scheduled_date, workout_type, target_distance_miles, target_pace_desc, description, completed')
        .eq('plan_id', plan.id)
        .order('scheduled_date', { ascending: true })
    : { data: [] }

  const now = new Date()

  const weeksToRace = plan?.race_date
    ? Math.max(0, differenceInWeeks(new Date(plan.race_date), now))
    : null
  const daysToRace = plan?.race_date
    ? Math.max(0, differenceInCalendarDays(new Date(plan.race_date), now))
    : null
  const completedWorkouts = workouts?.filter(w => w.completed && w.workout_type !== 'rest').length ?? 0
  const totalWorkouts = workouts?.filter(w => w.workout_type !== 'rest').length ?? 0
  const planProgress = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

  // This week's workouts
  const thisWeekMonday = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekSunday = addDays(thisWeekMonday, 6)
  const thisWeekWorkouts = workouts?.filter(w => {
    const d = parseISO(w.scheduled_date)
    return d >= thisWeekMonday && d <= thisWeekSunday
  }) ?? []

  const thisWeekPlannedMiles = thisWeekWorkouts
    .filter(w => w.workout_type !== 'rest' && w.target_distance_miles)
    .reduce((sum, w) => sum + (w.target_distance_miles ?? 0), 0)

  const keyWorkout = thisWeekWorkouts
    .filter(w => w.workout_type !== 'rest')
    .sort((a, b) => (INTENSITY_ORDER[b.workout_type] ?? 0) - (INTENSITY_ORDER[a.workout_type] ?? 0))[0]

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Training Plan
        </h2>
        {plan && (
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            {plan.goal_race}
            {plan.goal_time && ` — ${plan.goal_time}`}
            {plan.race_date && ` · ${format(new Date(plan.race_date), 'MMM d, yyyy')}`}
          </p>
        )}
      </div>

      {!plan && (
        <div className="max-w-lg">
          <div className="p-8 mb-8" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <p
              className="text-xl font-semibold uppercase tracking-widest mb-3"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              No active plan yet
            </p>
            <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
              Your coach will set up your training plan. Check back soon.
            </p>
          </div>
        </div>
      )}

      {plan && (
        <>
          {/* Plan Progress */}
          <div className="p-5 mb-4" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>Workouts Done</p>
                  <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                    {completedWorkouts}
                    <span className="text-base font-normal" style={{ color: '#6b6560' }}>/{totalWorkouts}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>Weeks Left</p>
                  <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                    {weeksToRace ?? '—'}
                  </p>
                </div>
                {daysToRace != null && daysToRace <= 14 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>Race Day</p>
                    <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#fc4c02' }}>
                      {daysToRace}d
                    </p>
                  </div>
                )}
              </div>
              <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                {planProgress}<span className="text-lg font-normal" style={{ color: '#6b6560' }}>%</span>
              </p>
            </div>
            <div className="h-0.5 rounded-full" style={{ backgroundColor: '#1e1b18' }}>
              <div
                className="h-0.5 rounded-full"
                style={{ width: `${planProgress}%`, backgroundColor: '#e8e0d4' }}
              />
            </div>
          </div>

          {/* This Week Focus */}
          {(thisWeekWorkouts.length > 0 || insight) && (
            <div className="p-5 mb-6" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>This Week</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {thisWeekPlannedMiles > 0 && (
                    <p className="text-sm mb-1" style={{ color: '#f5f2ee' }}>
                      <span className="font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '1.1rem' }}>
                        {thisWeekPlannedMiles.toFixed(0)} mi
                      </span>
                      <span style={{ color: '#6b6560' }}> planned</span>
                    </p>
                  )}
                  {keyWorkout && (
                    <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                      Key session:{' '}
                      <span style={{ color: '#e8e0d4' }}>
                        {keyWorkout.workout_type.charAt(0).toUpperCase() + keyWorkout.workout_type.slice(1)} run
                        {keyWorkout.target_distance_miles ? ` · ${keyWorkout.target_distance_miles} mi` : ''}
                        {' · '}{format(parseISO(keyWorkout.scheduled_date), 'EEEE')}
                      </span>
                    </p>
                  )}
                  {thisWeekWorkouts.length === 0 && (
                    <p className="text-sm" style={{ color: '#3a3633' }}>No workouts scheduled this week</p>
                  )}
                </div>
                {insight && (
                  <Link
                    href="/dashboard"
                    className="text-xs uppercase tracking-widest shrink-0 transition-colors hover:text-[#f5f2ee]"
                    style={{ color: '#3a3633' }}
                  >
                    Coach note →
                  </Link>
                )}
              </div>
              {insight && (
                <p
                  className="text-xs mt-3 pt-3 leading-5 line-clamp-2"
                  style={{ color: '#6b6560', borderTop: '1px solid #1e1b18' }}
                >
                  &ldquo;{insight.content}&rdquo;
                </p>
              )}
            </div>
          )}

          {workouts && (
            <WorkoutCalendar
              workouts={workouts}
              planStartDate={plan.start_date}
              planEndDate={plan.race_date}
              totalWeeks={plan.total_weeks}
            />
          )}
        </>
      )}
    </div>
  )
}
