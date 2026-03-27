export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { metersToMiles } from '@/lib/strava'
import { subDays, subWeeks, startOfWeek, addDays, format, parseISO } from 'date-fns'
import InviteAthleteForm from '@/components/coach/InviteAthleteForm'
import AthleteTable from '@/components/coach/AthleteTable'
import MileageLineChart from '@/components/dashboard/MileageLineChart'
import ActivityTypeChart from '@/components/dashboard/ActivityTypeChart'
import Link from 'next/link'
import {
  Users,
  Target,
  MessageSquare,
  FileText,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
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

function trendLabel(current: number, previous: number): { pct: string; up: boolean; neutral: boolean } {
  if (previous === 0 && current === 0) return { pct: '0%', up: true, neutral: true }
  if (previous === 0) return { pct: '+100%', up: true, neutral: false }
  const diff = ((current - previous) / previous) * 100
  const up = diff >= 0
  return { pct: `${up ? '+' : ''}${diff.toFixed(1)}%`, up, neutral: Math.abs(diff) < 0.5 }
}

export default async function CoachPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 })
  const lastWeekMonday = subDays(currentWeekMonday, 7)
  const sevenDaysAgo = subDays(now, 7).toISOString()
  const fourteenDaysAgo = subDays(now, 14).toISOString()
  const twelveWeeksAgoMonday = subDays(currentWeekMonday, 7 * 11)

  // Fetch athletes + counts in parallel
  const [
    { data: athletes },
    { count: activePlansCount },
    { count: unreadCount },
    { count: postsCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, plan_tier, created_at')
      .neq('id', process.env.COACH_USER_ID)
      .order('created_at', { ascending: false }),
    supabase
      .from('training_plans')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', process.env.COACH_USER_ID)
      .is('read_at', null),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true }),
  ])

  const athleteIds = athletes?.map(a => a.id) ?? []

  // Fetch activities (need athleteIds first)
  const [
    { data: allActivities },
    { data: thisWeekActivities },
    { data: lastWeekActivities },
  ] = await Promise.all([
    athleteIds.length > 0
      ? supabase
          .from('activities')
          .select('user_id, distance, started_at, activity_type')
          .in('user_id', athleteIds)
          .gte('started_at', twelveWeeksAgoMonday.toISOString())
      : { data: [] },
    athleteIds.length > 0
      ? supabase
          .from('activities')
          .select('user_id, distance, started_at')
          .in('user_id', athleteIds)
          .gte('started_at', currentWeekMonday.toISOString())
      : { data: [] },
    athleteIds.length > 0
      ? supabase
          .from('activities')
          .select('user_id, distance, started_at')
          .in('user_id', athleteIds)
          .gte('started_at', lastWeekMonday.toISOString())
          .lt('started_at', currentWeekMonday.toISOString())
      : { data: [] },
  ])

  // Athlete table data (last 7 days)
  const weeklyMilesMap: Record<string, number> = {}
  const lastRunMap: Record<string, string> = {}
  for (const activity of thisWeekActivities ?? []) {
    weeklyMilesMap[activity.user_id] =
      (weeklyMilesMap[activity.user_id] ?? 0) + metersToMiles(activity.distance)
    if (!lastRunMap[activity.user_id] || activity.started_at > lastRunMap[activity.user_id]) {
      lastRunMap[activity.user_id] = activity.started_at
    }
  }

  // Stats
  const totalAthletes = athletes?.length ?? 0
  const teamMilesThisWeek = (thisWeekActivities ?? []).reduce(
    (sum, a) => sum + metersToMiles(a.distance), 0
  )
  const teamMilesLastWeek = (lastWeekActivities ?? []).reduce(
    (sum, a) => sum + metersToMiles(a.distance), 0
  )
  const activeThisWeek = new Set((thisWeekActivities ?? []).map(a => a.user_id)).size
  const activeLastWeek = new Set((lastWeekActivities ?? []).map(a => a.user_id)).size

  const milesTrend = trendLabel(teamMilesThisWeek, teamMilesLastWeek)
  const activeTrend = trendLabel(activeThisWeek, activeLastWeek)

  // 12-week team mileage line chart
  const weeklyChartData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(twelveWeeksAgoMonday, i * 7)
    const weekEnd = addDays(weekStart, 7)
    const weekMiles = (allActivities ?? [])
      .filter(a => {
        const d = new Date(a.started_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((sum, a) => sum + metersToMiles(a.distance), 0)
    return {
      week: i === 11 ? 'Now' : `Wk ${i + 1}`,
      miles: Math.round(weekMiles * 10) / 10,
    }
  })

  // Activity type breakdown (all 12 weeks)
  const typeTotals: Record<string, number> = {}
  for (const a of allActivities ?? []) {
    const t = a.activity_type === 'VirtualRun' ? 'Run' : (a.activity_type ?? 'Run')
    typeTotals[t] = (typeTotals[t] ?? 0) + metersToMiles(a.distance)
  }
  const activityChartData = Object.entries(typeTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([type, miles], i) => ({
      type,
      miles: Math.round(miles * 10) / 10,
      color: ACTIVITY_COLORS[type] ?? CHART_COLORS[i % CHART_COLORS.length],
    }))

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-semibold uppercase tracking-widest leading-tight"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Coaching Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6865' }}>
            {totalAthletes} athlete{totalAthletes !== 1 ? 's' : ''} · overview
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-6">
          <Link href="/coach/blog/new">
            <button
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#f0eeec', color: '#3a3733', border: '1px solid #e8e7e5', borderRadius: '4px' }}
            >
              <Plus size={13} />
              New Post
            </button>
          </Link>
          <InviteAthleteForm />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">

        {/* Total Athletes */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Users size={14} style={{ color: '#3a3733' }} />
            </div>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {totalAthletes}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Athletes</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>total registered</p>
        </div>

        {/* Active Plans */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Target size={14} style={{ color: '#3a3733' }} />
            </div>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {activePlansCount ?? 0}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Active Plans</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>training plans</p>
        </div>

        {/* Unread Messages */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: (unreadCount ?? 0) > 0 ? '#fff3ee' : '#f0eeec' }}>
              <MessageSquare size={14} style={{ color: (unreadCount ?? 0) > 0 ? '#fc4c02' : '#3a3733' }} />
            </div>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: (unreadCount ?? 0) > 0 ? '#fc4c02' : '#1a1917' }}
          >
            {unreadCount ?? 0}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Unread</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>
            <Link href="/coach/messages" className="hover:underline">messages →</Link>
          </p>
        </div>

        {/* Blog Posts */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <FileText size={14} style={{ color: '#3a3733' }} />
            </div>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {postsCount ?? 0}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Blog Posts</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>
            <Link href="/coach/blog" className="hover:underline">manage →</Link>
          </p>
        </div>

        {/* Team Miles This Week */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <TrendingUp size={14} style={{ color: '#3a3733' }} />
            </div>
            <span
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: milesTrend.neutral ? '#9c9895' : milesTrend.up ? '#7fbf7f' : '#e87070' }}
            >
              {!milesTrend.neutral && (milesTrend.up
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />)}
              {milesTrend.pct}
            </span>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {teamMilesThisWeek.toFixed(1)}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Team Miles</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>this week</p>
        </div>

        {/* Active This Week */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#f0eeec' }}>
              <Activity size={14} style={{ color: '#3a3733' }} />
            </div>
            <span
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: activeTrend.neutral ? '#9c9895' : activeTrend.up ? '#7fbf7f' : '#e87070' }}
            >
              {!activeTrend.neutral && (activeTrend.up
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />)}
              {activeTrend.pct}
            </span>
          </div>
          <p
            className="text-2xl font-semibold tabular-nums leading-none mb-1"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            {activeThisWeek}
          </p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#3a3733' }}>Active</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>athletes this week</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3 p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold" style={{ color: '#3a3733' }}>Team Mileage</p>
            <span className="text-xs" style={{ color: '#9c9895' }}>Last 12 weeks</span>
          </div>
          <MileageLineChart data={weeklyChartData} />
        </div>

        <div className="lg:col-span-2 p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold" style={{ color: '#3a3733' }}>Miles by Type</p>
            <span className="text-xs" style={{ color: '#9c9895' }}>Last 12 weeks</span>
          </div>
          {activityChartData.length > 0 ? (
            <ActivityTypeChart data={activityChartData} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs" style={{ color: '#9c9895' }}>No activity data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Athlete table */}
      <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6865' }}>
            Athletes
          </p>
          <Link
            href="/coach/athletes"
            className="flex items-center gap-0.5 text-xs transition-colors hover:text-[#1a1917]"
            style={{ color: '#9c9895' }}
          >
            All athletes <ChevronRight size={12} />
          </Link>
        </div>

        {!athletes?.length ? (
          <p className="text-sm py-6 text-center" style={{ color: '#9c9895' }}>
            No athletes yet. Invite your first athlete to get started.
          </p>
        ) : (
          <AthleteTable
            athletes={athletes.map(athlete => ({
              id: athlete.id,
              full_name: athlete.full_name,
              email: athlete.email,
              plan_tier: athlete.plan_tier,
              miles: weeklyMilesMap[athlete.id] ?? 0,
              lastRun: lastRunMap[athlete.id] ?? null,
            }))}
          />
        )}
      </div>
    </div>
  )
}
