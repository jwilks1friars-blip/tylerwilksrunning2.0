export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { differenceInCalendarDays, differenceInWeeks, format, startOfWeek, addDays, parseISO, subWeeks } from 'date-fns'
import { metersToMiles } from '@/lib/strava'
import WorkoutCalendar from '@/components/dashboard/WorkoutCalendar'
import TrainingLoadChart from '@/components/dashboard/TrainingLoadChart'
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
        .select('id, scheduled_date, workout_type, target_distance_miles, target_pace_desc, description, completed, target_rpe, hr_zone_target, race_prep')
        .eq('plan_id', plan.id)
        .order('scheduled_date', { ascending: true })
    : { data: [] }

  const now = new Date()

  // Fetch actual mileage by week for training load chart (8 weeks)
  const twelveWeeksAgo = addDays(startOfWeek(now, { weekStartsOn: 1 }), -7 * 7)
  const { data: activities } = await supabase
    .from('activities')
    .select('distance, started_at')
    .eq('user_id', user!.id)
    .gte('started_at', twelveWeeksAgo.toISOString())

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

  // Training load chart: planned vs actual over 8 weeks
  const acts = activities ?? []
  const trainingLoadData = Array.from({ length: 8 }, (_, i) => {
    const weekMonday = addDays(subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 7 - i), 0)
    const weekSunday = addDays(weekMonday, 6)
    const planned = workouts
      ?.filter(w => {
        const d = parseISO(w.scheduled_date)
        return d >= weekMonday && d <= weekSunday && w.workout_type !== 'rest'
      })
      .reduce((sum, w) => sum + (w.target_distance_miles ?? 0), 0) ?? 0
    const actual = acts
      .filter(a => {
        const d = new Date(a.started_at)
        return d >= weekMonday && d <= weekSunday
      })
      .reduce((sum, a) => sum + metersToMiles(a.distance), 0)
    return {
      week: i === 7 ? 'Now' : `W${i + 1}`,
      planned: Math.round(planned * 10) / 10,
      actual: Math.round(actual * 10) / 10,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
        >
          Training Plan
        </h2>
        {plan && (
          <p className="text-sm mt-1" style={{ color: '#9c9895' }}>
            {plan.goal_race}
            {plan.goal_time && ` — ${plan.goal_time}`}
            {plan.race_date && ` · ${format(new Date(plan.race_date), 'MMM d, yyyy')}`}
          </p>
        )}
      </div>

      {!plan && (
        <div className="max-w-lg">
          <div className="p-8 mb-8" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
            <p
              className="text-xl font-semibold uppercase tracking-widest mb-3"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
            >
              No active plan yet
            </p>
            <p className="text-sm leading-7" style={{ color: '#9c9895' }}>
              Your coach will set up your training plan. Check back soon.
            </p>
          </div>
        </div>
      )}

      {plan && (
        <>
          {/* Plan Progress */}
          <div className="p-5 mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>Workouts Done</p>
                  <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                    {completedWorkouts}
                    <span className="text-base font-normal" style={{ color: '#9c9895' }}>/{totalWorkouts}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>Weeks Left</p>
                  <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                    {weeksToRace ?? '—'}
                  </p>
                </div>
                {daysToRace != null && daysToRace <= 14 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>Race Day</p>
                    <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#fc4c02' }}>
                      {daysToRace}d
                    </p>
                  </div>
                )}
              </div>
              <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                {planProgress}<span className="text-lg font-normal" style={{ color: '#9c9895' }}>%</span>
              </p>
            </div>
            <div className="h-0.5 rounded-full" style={{ backgroundColor: '#ebebea' }}>
              <div
                className="h-0.5 rounded-full"
                style={{ width: `${planProgress}%`, backgroundColor: '#1a1917' }}
              />
            </div>
          </div>

          {/* This Week Focus */}
          {(thisWeekWorkouts.length > 0 || insight) && (
            <div className="p-5 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9c9895' }}>This Week</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {thisWeekPlannedMiles > 0 && (
                    <p className="text-sm mb-1" style={{ color: '#1a1917' }}>
                      <span className="font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '1.1rem' }}>
                        {thisWeekPlannedMiles.toFixed(0)} mi
                      </span>
                      <span style={{ color: '#9c9895' }}> planned</span>
                    </p>
                  )}
                  {keyWorkout && (
                    <p className="text-xs mt-1" style={{ color: '#9c9895' }}>
                      Key session:{' '}
                      <span style={{ color: '#6b6865' }}>
                        {keyWorkout.workout_type.charAt(0).toUpperCase() + keyWorkout.workout_type.slice(1)} run
                        {keyWorkout.target_distance_miles ? ` · ${keyWorkout.target_distance_miles} mi` : ''}
                        {' · '}{format(parseISO(keyWorkout.scheduled_date), 'EEEE')}
                      </span>
                    </p>
                  )}
                  {thisWeekWorkouts.length === 0 && (
                    <p className="text-sm" style={{ color: '#c8c4c0' }}>No workouts scheduled this week</p>
                  )}
                </div>
                {insight && (
                  <Link
                    href="/dashboard"
                    className="text-xs uppercase tracking-widest shrink-0 transition-colors hover:text-[#1a1917]"
                    style={{ color: '#9c9895' }}
                  >
                    Coach note →
                  </Link>
                )}
              </div>
              {insight && (
                <p
                  className="text-xs mt-3 pt-3 leading-5 line-clamp-2"
                  style={{ color: '#9c9895', borderTop: '1px solid #ebebea' }}
                >
                  &ldquo;{insight.content}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Training Load Chart */}
          {trainingLoadData.some(d => d.planned > 0 || d.actual > 0) && (
            <div className="p-5 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
                  Planned vs Actual
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#e8e4e0' }} />
                    <span className="text-xs" style={{ color: '#9c9895' }}>Planned</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#7090e8' }} />
                    <span className="text-xs" style={{ color: '#9c9895' }}>Actual</span>
                  </div>
                </div>
              </div>
              <TrainingLoadChart data={trainingLoadData} />
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
