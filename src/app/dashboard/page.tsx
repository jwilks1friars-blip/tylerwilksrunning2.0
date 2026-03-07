export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { subDays, format, differenceInCalendarDays, startOfWeek, addDays } from 'date-fns'
import MileageChart from '@/components/dashboard/MileageChart'
import Link from 'next/link'

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  Run: '#7fbf7f',
  VirtualRun: '#7fbf7f',
  TrailRun: '#a0c4a0',
  Walk: '#6b6560',
  Hike: '#6b6560',
  Ride: '#7090e8',
}

function calcStreak(activities: Array<{ started_at: string }>): number {
  if (!activities.length) return 0
  const activeDays = new Set(activities.map(a => format(new Date(a.started_at), 'yyyy-MM-dd')))
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  // If ran today, start streak from today; otherwise start from yesterday
  let i = activeDays.has(todayStr) ? 0 : 1
  let streak = 0
  while (i <= 365) {
    const dayStr = format(subDays(today, i), 'yyyy-MM-dd')
    if (activeDays.has(dayStr)) { streak++; i++ }
    else break
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const ytdStart = new Date(now.getFullYear(), 0, 1)
  const sevenDaysAgo = subDays(now, 6)
  const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 })
  const eightWeeksAgoMonday = subDays(currentWeekMonday, 7 * 7)
  // Fetch from the earlier of ytdStart or 8 weeks ago to cover all needed data
  const fetchSince = eightWeeksAgoMonday < ytdStart ? eightWeeksAgoMonday : ytdStart

  const [
    { data: activities },
    { data: profile },
    { data: insight },
    { data: plan },
  ] = await Promise.all([
    supabase
      .from('activities')
      .select('id, distance, started_at, avg_pace, activity_type, name')
      .eq('user_id', user!.id)
      .gte('started_at', fetchSince.toISOString())
      .order('started_at', { ascending: false }),
    supabase.from('profiles').select('full_name, goal_race, goal_time, weekly_miles').eq('id', user!.id).single(),
    supabase.from('insights').select('*').eq('user_id', user!.id).eq('approved', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('training_plans').select('*').eq('user_id', user!.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const { data: workouts } = plan
    ? await supabase.from('workouts').select('id, completed, workout_type').eq('plan_id', plan.id)
    : { data: [] }

  const acts = activities ?? []

  // YTD = activities since Jan 1 of this year
  const ytdActs = acts.filter(a => new Date(a.started_at) >= ytdStart)
  const ytdMiles = ytdActs.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  // This week
  const thisWeekActs = acts.filter(a => new Date(a.started_at) >= sevenDaysAgo)
  const milesThisWeek = thisWeekActs.reduce((sum, a) => sum + metersToMiles(a.distance), 0)
  const weeklyGoal = profile?.weekly_miles ?? 0
  const weekProgress = weeklyGoal > 0 ? Math.min(100, Math.round((milesThisWeek / weeklyGoal) * 100)) : 0

  // Streak (using YTD activities)
  const streak = calcStreak(ytdActs)

  // Plan progress
  const completedWorkouts = workouts?.filter(w => w.completed && w.workout_type !== 'rest').length ?? 0
  const totalWorkouts = workouts?.filter(w => w.workout_type !== 'rest').length ?? 0

  // Race countdown
  const daysToRace = plan?.race_date
    ? Math.max(0, differenceInCalendarDays(new Date(plan.race_date), now))
    : null

  // 8-week mileage chart
  const weeklyChartData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = addDays(eightWeeksAgoMonday, i * 7)
    const weekEnd = addDays(weekStart, 7)
    const weekMiles = acts
      .filter(a => {
        const d = new Date(a.started_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((sum, a) => sum + metersToMiles(a.distance), 0)
    return {
      day: i === 7 ? 'Now' : `Wk ${i + 1}`,
      miles: Math.round(weekMiles * 10) / 10,
    }
  })

  // Recent 3 runs
  const recentRuns = acts.slice(0, 3)

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  return (
    <div>
      {/* Race Countdown Hero */}
      {plan && daysToRace !== null && (
        <div
          className="flex items-center justify-between p-6 mb-6"
          style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>
              {firstName ? `Hey ${firstName} · ` : ''}Goal Race
            </p>
            <p
              className="text-3xl font-semibold uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              {plan.goal_race ?? 'Race Day'}
            </p>
            {plan.goal_time && (
              <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
                Goal: {plan.goal_time} · {format(new Date(plan.race_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="text-right shrink-0 ml-6">
            <p
              className="text-7xl font-semibold tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              {daysToRace}
            </p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#6b6560' }}>
              {daysToRace === 1 ? 'day' : 'days'} to go
            </p>
          </div>
        </div>
      )}

      {/* Greeting (no plan) */}
      {!plan && (
        <div className="mb-6">
          <h2
            className="text-3xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            {firstName ? `Hey, ${firstName}` : 'Overview'}
          </h2>
          {profile?.goal_race && (
            <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
              Training for {profile.goal_race}{profile.goal_time && ` — goal: ${profile.goal_time}`}
            </p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

        {/* This Week */}
        <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>This Week</p>
          <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
            {milesThisWeek.toFixed(1)}
            <span className="text-base font-normal ml-1" style={{ color: '#6b6560' }}>mi</span>
          </p>
          {weeklyGoal > 0 ? (
            <>
              <div className="mt-2.5 h-0.5 rounded-full" style={{ backgroundColor: '#1e1b18' }}>
                <div
                  className="h-0.5 rounded-full"
                  style={{ width: `${weekProgress}%`, backgroundColor: '#e8e0d4' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#3a3633' }}>of {weeklyGoal} mi goal</p>
            </>
          ) : (
            <p className="text-xs mt-2" style={{ color: '#3a3633' }}>this week</p>
          )}
        </div>

        {/* YTD */}
        <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>Year to Date</p>
          <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
            {Math.round(ytdMiles)}
            <span className="text-base font-normal ml-1" style={{ color: '#6b6560' }}>mi</span>
          </p>
          <p className="text-xs mt-2" style={{ color: '#3a3633' }}>{now.getFullYear()} total</p>
        </div>

        {/* Streak */}
        <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>Streak</p>
          <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
            {streak}
            <span className="text-base font-normal ml-1" style={{ color: '#6b6560' }}>
              {streak === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="text-xs mt-2" style={{ color: '#3a3633' }}>consecutive</p>
        </div>

        {/* Plan Progress */}
        <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>Plan Progress</p>
          {totalWorkouts > 0 ? (
            <>
              <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                {Math.round((completedWorkouts / totalWorkouts) * 100)}
                <span className="text-base font-normal" style={{ color: '#6b6560' }}>%</span>
              </p>
              <p className="text-xs mt-2" style={{ color: '#3a3633' }}>{completedWorkouts}/{totalWorkouts} done</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#3a3633' }}>—</p>
              <p className="text-xs mt-2" style={{ color: '#3a3633' }}>no plan yet</p>
            </>
          )}
        </div>
      </div>

      {/* Coach's Weekly Note — prominent */}
      <div className="mb-6 p-6" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
            From Your Coach
          </p>
          {insight && (
            <p className="text-xs" style={{ color: '#3a3633' }}>
              Week of {format(new Date(insight.week_start), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        {insight ? (
          <p className="text-sm leading-8" style={{ color: '#e8e0d4', fontStyle: 'italic' }}>
            &ldquo;{insight.content}&rdquo;
          </p>
        ) : (
          <p className="text-sm leading-7" style={{ color: '#3a3633' }}>
            No note yet this week — check back soon.
          </p>
        )}
      </div>

      {/* 8-Week Mileage Chart */}
      <div className="p-5 mb-6" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <p className="text-xs uppercase tracking-widest mb-5" style={{ color: '#6b6560' }}>
          Mileage — Last 8 Weeks
        </p>
        <MileageChart data={weeklyChartData} />
      </div>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>Recent Runs</p>
            <Link
              href="/dashboard/runs"
              className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
              style={{ color: '#3a3633' }}
            >
              All runs →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentRuns.map(run => {
              const miles = metersToMiles(run.distance)
              const pace = run.avg_pace ? mpsToMinPerMile(1 / run.avg_pace) : null
              const typeColor = ACTIVITY_TYPE_COLORS[run.activity_type] ?? '#e8e0d4'
              const typeLabel = run.activity_type === 'VirtualRun' ? 'Run' : run.activity_type

              return (
                <div
                  key={run.id}
                  className="p-4"
                  style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs uppercase tracking-widest px-2 py-0.5"
                      style={{ backgroundColor: '#0a0908', color: typeColor, borderRadius: '2px', border: '1px solid #1e1b18' }}
                    >
                      {typeLabel}
                    </span>
                    <span className="text-xs" style={{ color: '#6b6560' }}>
                      {format(new Date(run.started_at), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-sm mb-2 truncate" style={{ color: '#f5f2ee' }}>{run.name}</p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-xl font-semibold tabular-nums" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                      {miles} <span className="text-xs font-normal" style={{ color: '#6b6560' }}>mi</span>
                    </span>
                    {pace && (
                      <span className="text-sm tabular-nums" style={{ color: '#6b6560' }}>
                        {pace}<span className="text-xs">/mi</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state — no activities yet */}
      {recentRuns.length === 0 && (
        <div className="p-6 text-center" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-sm mb-1" style={{ color: '#6b6560' }}>No runs synced yet</p>
          <p className="text-xs" style={{ color: '#3a3633' }}>
            Connect Strava in{' '}
            <Link href="/dashboard/settings" className="underline" style={{ color: '#6b6560' }}>
              Settings
            </Link>{' '}
            to start tracking your training.
          </p>
        </div>
      )}
    </div>
  )
}
