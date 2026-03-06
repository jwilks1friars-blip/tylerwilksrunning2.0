export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { differenceInWeeks, format } from 'date-fns'
import WorkoutCalendar from '@/components/dashboard/WorkoutCalendar'

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: plan }, { data: profile }] = await Promise.all([
    supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('goal_race, goal_time')
      .eq('id', user!.id)
      .single(),
  ])

  // Fetch all workouts for this plan
  const { data: workouts } = plan
    ? await supabase
        .from('workouts')
        .select('id, scheduled_date, workout_type, target_distance_miles, target_pace_desc, description, completed')
        .eq('plan_id', plan.id)
        .order('scheduled_date', { ascending: true })
    : { data: [] }

  const weeksToRace = plan?.race_date
    ? differenceInWeeks(new Date(plan.race_date), new Date())
    : null

  const completedWorkouts = workouts?.filter(w => w.completed && w.workout_type !== 'rest').length ?? 0
  const totalWorkouts = workouts?.filter(w => w.workout_type !== 'rest').length ?? 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
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

        {plan && (
          <div className="flex gap-4 text-right shrink-0">
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>Weeks Left</p>
              <p
                className="text-2xl font-semibold mt-1"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {weeksToRace != null ? Math.max(0, weeksToRace) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>Completed</p>
              <p
                className="text-2xl font-semibold mt-1"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {completedWorkouts}<span className="text-base" style={{ color: '#6b6560' }}>/{totalWorkouts}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* No plan state */}
      {!plan && (
        <div className="max-w-lg">
          <div
            className="p-8 mb-8"
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
          >
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

      {/* Calendar */}
      {plan && workouts && (
        <WorkoutCalendar
          workouts={workouts}
          planStartDate={plan.start_date}
          planEndDate={plan.race_date}
          totalWeeks={plan.total_weeks}
        />
      )}
    </div>
  )
}
