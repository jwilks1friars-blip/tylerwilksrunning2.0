export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { subDays, format, differenceInCalendarDays, startOfWeek, addDays } from 'date-fns'
import MileageLineChart from '@/components/dashboard/MileageLineChart'
import ActivityTypeChart from '@/components/dashboard/ActivityTypeChart'
import LogRunModal from '@/components/dashboard/LogRunModal'
import Link from 'next/link'
import {
  Route,
  TrendingUp,
  Flame,
  Target,
  Timer,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react'

const ACTIVITY_COLORS: Record<string, string> = {
  Run: '#7090e8',
  VirtualRun: '#7090e8',
  TrailRun: '#7fbf7f',
  Walk: '#6b6560',
  Hike: '#a0c4a0',
  Ride: '#e8a050',
}

const CHART_COLORS = ['#7090e8', '#7fbf7f', '#e8a050', '#e87070', '#a070e8', '#70c8e8', '#6b6560']

function calcStreak(activities: Array<{ started_at: string }>): number {
  if (!activities.length) return 0
  const activeDays = new Set(activities.map(a => format(new Date(a.started_at), 'yyyy-MM-dd')))
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  let i = activeDays.has(todayStr) ? 0 : 1
  let streak = 0
  while (i <= 365) {
    const dayStr = format(subDays(today, i), 'yyyy-MM-dd')
    if (activeDays.has(dayStr)) { streak++; i++ }
    else break
  }
  return streak
}

function trendLabel(current: number, previous: number): { pct: string; up: boolean; neutral: boolean } {
  if (previous === 0 && current === 0) return { pct: '0%', up: true, neutral: true }
  if (previous === 0) return { pct: '+100%', up: true, neutral: false }
  const diff = ((current - previous) / previous) * 100
  const up = diff >= 0
  return {
    pct: `${up ? '+' : ''}${diff.toFixed(1)}%`,
    up,
    neutral: Math.abs(diff) < 0.5,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const ytdStart = new Date(now.getFullYear(), 0, 1)
  const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 })
  const lastWeekMonday = subDays(currentWeekMonday, 7)
  const twelveWeeksAgoMonday = subDays(currentWeekMonday, 7 * 11)
  const fetchSince = twelveWeeksAgoMonday < ytdStart ? twelveWeeksAgoMonday : ytdStart

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

  // YTD activities
  const ytdActs = acts.filter(a => new Date(a.started_at) >= ytdStart)
  const ytdMiles = ytdActs.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  // This week (Mon–now)
  const thisWeekActs = acts.filter(a => new Date(a.started_at) >= currentWeekMonday)
  const milesThisWeek = thisWeekActs.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  // Last week (Mon–Sun)
  const lastWeekActs = acts.filter(a => {
    const d = new Date(a.started_at)
    return d >= lastWeekMonday && d < currentWeekMonday
  })
  const milesLastWeek = lastWeekActs.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  const weeklyGoal = profile?.weekly_miles ?? 0
  const weekProgress = weeklyGoal > 0 ? Math.min(100, Math.round((milesThisWeek / weeklyGoal) * 100)) : 0

  // Streak — running activities only (not rides/walks/hikes)
  const RUNNING_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])
  const streak = calcStreak(ytdActs.filter(a => RUNNING_TYPES.has(a.activity_type)))

  // Plan progress — denominator is workouts scheduled on or before today
  const todayDateStr = format(now, 'yyyy-MM-dd')
  const completedWorkouts = workouts?.filter(w => w.completed && w.workout_type !== 'rest').length ?? 0
  const totalWorkouts = workouts?.filter(w => w.workout_type !== 'rest' && w.scheduled_date <= todayDateStr).length ?? 0
  const planPct = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : null

  // Avg pace this week vs last week
  const thisWeekPacedRuns = thisWeekActs.filter(a => a.avg_pace && metersToMiles(a.distance) >= 0.5)
  const lastWeekPacedRuns = lastWeekActs.filter(a => a.avg_pace && metersToMiles(a.distance) >= 0.5)
  const avgPaceThisWeek = thisWeekPacedRuns.length > 0
    ? thisWeekPacedRuns.reduce((sum, a) => sum + (1 / a.avg_pace!), 0) / thisWeekPacedRuns.length
    : null
  const avgPaceLastWeek = lastWeekPacedRuns.length > 0
    ? lastWeekPacedRuns.reduce((sum, a) => sum + (1 / a.avg_pace!), 0) / lastWeekPacedRuns.length
    : null

  // Race countdown
  const daysToRace = plan?.race_date
    ? Math.max(0, differenceInCalendarDays(new Date(plan.race_date), now))
    : null

  // 12-week mileage line chart
  const weeklyChartData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(twelveWeeksAgoMonday, i * 7)
    const weekEnd = addDays(weekStart, 7)
    const weekMiles = acts
      .filter(a => {
        const d = new Date(a.started_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((sum, a) => sum + metersToMiles(a.distance), 0)
    const isCurrentWeek = i === 11
    return {
      week: isCurrentWeek ? 'Now' : `Wk ${i + 1}`,
      miles: Math.round(weekMiles * 10) / 10,
      ...(weeklyGoal > 0 ? { goal: weeklyGoal } : {}),
    }
  })

  // Activity type bar chart (YTD)
  const typeTotals: Record<string, number> = {}
  ytdActs.forEach(a => {
    const t = a.activity_type === 'VirtualRun' ? 'Run' : a.activity_type
    typeTotals[t] = (typeTotals[t] ?? 0) + metersToMiles(a.distance)
  })
  const activityChartData = Object.entries(typeTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([type, miles], i) => ({
      type,
      miles: Math.round(miles * 10) / 10,
      color: ACTIVITY_COLORS[type] ?? CHART_COLORS[i % CHART_COLORS.length],
    }))

  // Trend data
  const weekTrend = trendLabel(milesThisWeek, milesLastWeek)
  const runsTrend = trendLabel(thisWeekActs.length, lastWeekActs.length)

  const firstName = profile?.full_name?.split(' ')[0] ?? null
  const recentRuns = acts.slice(0, 3)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-semibold uppercase tracking-widest leading-tight"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {firstName ? `${firstName}'s Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6865' }}>
            {plan?.goal_race
              ? `Training for ${plan.goal_race}${plan.goal_time ? ` · Goal: ${plan.goal_time}` : ''}${daysToRace !== null ? ` · ${daysToRace} days to go` : ''}`
              : profile?.goal_race
              ? `Training for ${profile.goal_race}${profile.goal_time ? ` · Goal: ${profile.goal_time}` : ''}`
              : 'Your personal running overview'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-6">
          <LogRunModal />
        </div>
      </div>

      {/* Stats Grid — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">

        {/* This Week Miles */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Route size={14} style={{ color: '#3a3733' }} />
            </div>
            <span
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: weekTrend.neutral ? '#9c9895' : weekTrend.up ? '#7fbf7f' : '#e87070' }}
            >
              {weekTrend.neutral ? null : weekTrend.up
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />}
              {weekTrend.pct}
            </span>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {milesThisWeek.toFixed(1)}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>This Week</p>
          {weeklyGoal > 0 ? (
            <>
              <div className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: '#f0eeec' }}>
                <div className="h-0.5 rounded-full" style={{ width: `${weekProgress}%`, backgroundColor: '#7090e8' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: '#9c9895' }}>{weekProgress}% of {weeklyGoal} mi</p>
            </>
          ) : (
            <p className="text-xs" style={{ color: '#9c9895' }}>miles this week</p>
          )}
        </div>

        {/* YTD Miles */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <TrendingUp size={14} style={{ color: '#3a3733' }} />
            </div>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {Math.round(ytdMiles)}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Year to Date</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>{now.getFullYear()} total miles</p>
        </div>

        {/* Total Runs */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Activity size={14} style={{ color: '#3a3733' }} />
            </div>
            <span
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: runsTrend.neutral ? '#9c9895' : runsTrend.up ? '#7fbf7f' : '#e87070' }}
            >
              {!runsTrend.neutral && (runsTrend.up
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />)}
              {runsTrend.pct}
            </span>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {ytdActs.length}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Total Runs</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>activities this year</p>
        </div>

        {/* Streak */}
        <Link
          href="/dashboard/runs"
          className="p-5 rounded-lg block transition-colors hover:border-[#d4d0cc]"
          style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Flame size={14} style={{ color: '#fc4c02' }} />
            </div>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {streak}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Day Streak</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>consecutive days</p>
        </Link>

        {/* Plan Progress */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Target size={14} style={{ color: '#3a3733' }} />
            </div>
          </div>
          {planPct !== null ? (
            <>
              <p
                className="text-2xl font-semibold tabular-nums leading-none mb-1"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
              >
                {planPct}<span className="text-base font-normal" style={{ color: '#6b6865' }}>%</span>
              </p>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Plan Progress</p>
              <p className="text-xs" style={{ color: '#9c9895' }}>{completedWorkouts}/{totalWorkouts} workouts</p>
            </>
          ) : (
            <>
              <p
                className="text-2xl font-semibold leading-none mb-1"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#9c9895' }}
              >
                —
              </p>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Plan Progress</p>
              <p className="text-xs" style={{ color: '#9c9895' }}>no active plan</p>
            </>
          )}
        </div>

        {/* Avg Pace */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Timer size={14} style={{ color: '#3a3733' }} />
            </div>
            {avgPaceThisWeek && avgPaceLastWeek && (() => {
              // Lower pace (faster) is better — invert trend logic
              const t = trendLabel(avgPaceLastWeek, avgPaceThisWeek)
              return (
                <span
                  className="flex items-center gap-0.5 text-xs font-medium"
                  style={{ color: t.neutral ? '#9c9895' : t.up ? '#7fbf7f' : '#e87070' }}
                >
                  {!t.neutral && (t.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                  {t.pct}
                </span>
              )
            })()}
          </div>
          {avgPaceThisWeek ? (
            <>
              <p
                className="text-2xl font-semibold tabular-nums leading-none mb-1"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
              >
                {mpsToMinPerMile(avgPaceThisWeek)}
              </p>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Avg Pace</p>
              <p className="text-xs" style={{ color: '#9c9895' }}>min/mi this week</p>
            </>
          ) : (
            <>
              <p
                className="text-2xl font-semibold leading-none mb-1"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#9c9895' }}
              >
                —
              </p>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Avg Pace</p>
              <p className="text-xs" style={{ color: '#9c9895' }}>no runs this week</p>
            </>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Mileage line chart (wider) */}
        <div className="lg:col-span-3 p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold" style={{ color: '#3a3733' }}>
              Mileage Performance
            </p>
            <span className="text-xs" style={{ color: '#9c9895' }}>Last 12 weeks</span>
          </div>
          <MileageLineChart data={weeklyChartData} />
        </div>

        {/* Activity type bar chart (narrower) */}
        <div className="lg:col-span-2 p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold" style={{ color: '#3a3733' }}>
              Miles by Type
            </p>
            <span className="text-xs" style={{ color: '#9c9895' }}>This year</span>
          </div>
          {activityChartData.length > 0 ? (
            <ActivityTypeChart data={activityChartData} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs" style={{ color: '#9c9895' }}>No activities yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: coach note + recent runs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Coach's weekly note */}
        <div className="lg:col-span-2 p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6865' }}>
              From Your Coach
            </p>
            {insight && (
              <p className="text-xs" style={{ color: '#9c9895' }}>
                {format(new Date(insight.week_start), 'MMM d')}
              </p>
            )}
          </div>
          {insight ? (
            <p className="text-sm leading-7" style={{ color: '#3a3733', fontStyle: 'italic' }}>
              &ldquo;{insight.content}&rdquo;
            </p>
          ) : (
            <p className="text-sm" style={{ color: '#9c9895' }}>
              No note yet this week — check back soon.
            </p>
          )}
        </div>

        {/* Recent Runs */}
        <div className="lg:col-span-3 p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6865' }}>
              Recent Runs
            </p>
            <Link
              href="/dashboard/runs"
              className="flex items-center gap-0.5 text-xs transition-colors hover:text-[#1a1917]"
              style={{ color: '#9c9895' }}
            >
              All runs <ChevronRight size={12} />
            </Link>
          </div>
          {recentRuns.length > 0 ? (
            <div className="space-y-2">
              {recentRuns.map(run => {
                const miles = metersToMiles(run.distance)
                const pace = run.avg_pace ? mpsToMinPerMile(1 / run.avg_pace) : null
                const typeColor = ACTIVITY_COLORS[run.activity_type] ?? '#e8e0d4'
                const typeLabel = run.activity_type === 'VirtualRun' ? 'Run' : run.activity_type
                return (
                  <div
                    key={run.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-md"
                    style={{ backgroundColor: '#f5f4f2', border: '1px solid #ebebea' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#3a3733' }}>{run.name}</p>
                        <p className="text-xs" style={{ color: '#9c9895' }}>{typeLabel} · {format(new Date(run.started_at), 'MMM d')}</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3 shrink-0 ml-4">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
                      >
                        {miles} <span className="text-xs font-normal" style={{ color: '#6b6865' }}>mi</span>
                      </span>
                      {pace && (
                        <span className="text-xs tabular-nums" style={{ color: '#6b6865' }}>
                          {pace}<span style={{ fontSize: '10px' }}>/mi</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-sm mb-1" style={{ color: '#6b6865' }}>No runs synced yet</p>
              <p className="text-xs" style={{ color: '#9c9895' }}>
                Connect Strava in{' '}
                <Link href="/dashboard/settings" className="underline" style={{ color: '#6b6865' }}>
                  Settings
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
