export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format } from 'date-fns'
import MileageChart from '@/components/dashboard/MileageChart'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 25

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const TYPE_COLORS: Record<string, string> = {
  Run: '#7fbf7f',
  VirtualRun: '#7fbf7f',
  TrailRun: '#a0c4a0',
  Walk: '#6b6560',
  Hike: '#6b6560',
  Ride: '#7090e8',
}

const RUNNING_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])
const THREE_MILES_IN_METERS = 4828

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function RunsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { page: pageStr } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10))

  // Fetch count for pagination
  const { count: totalCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)

  // Fetch paginated activities for the table
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  // Fetch all-time stats (lightweight — only needed columns)
  const { data: allActivities } = await supabase
    .from('activities')
    .select('distance, avg_pace, activity_type, started_at')
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })

  const acts = activities ?? []
  const allActs = allActivities ?? []

  // --- Personal Records ---
  const runningActs = allActs.filter(a => RUNNING_TYPES.has(a.activity_type))
  const longRunningActs = runningActs.filter(a => a.distance > THREE_MILES_IN_METERS && a.avg_pace)

  const longestRunMeters = runningActs.length > 0
    ? Math.max(...runningActs.map(a => a.distance))
    : 0

  const fastestPaceAct = longRunningActs.length > 0
    ? longRunningActs.reduce((best, a) => (!best || a.avg_pace < best.avg_pace) ? a : best, null as typeof allActs[0] | null)
    : null

  const allTimeMiles = allActs.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  // --- 6-Month Chart ---
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1)
    const monthMiles = allActs
      .filter(a => {
        const d = new Date(a.started_at)
        return d >= monthStart && d < monthEnd
      })
      .reduce((sum, a) => sum + metersToMiles(a.distance), 0)
    return {
      day: format(monthStart, 'MMM'),
      miles: Math.round(monthMiles * 10) / 10,
    }
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Runs
        </h2>
        <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
          {totalCount ?? 0} activities synced
        </p>
      </div>

      {/* Personal Records */}
      {runningActs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>Longest Run</p>
            <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
              {metersToMiles(longestRunMeters)}
              <span className="text-base font-normal ml-1" style={{ color: '#6b6560' }}>mi</span>
            </p>
            <p className="text-xs mt-2" style={{ color: '#3a3633' }}>all time</p>
          </div>

          <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>Best Pace</p>
            <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
              {fastestPaceAct
                ? mpsToMinPerMile(1 / fastestPaceAct.avg_pace)
                : '—'}
              {fastestPaceAct && (
                <span className="text-base font-normal ml-1" style={{ color: '#6b6560' }}>/mi</span>
              )}
            </p>
            <p className="text-xs mt-2" style={{ color: '#3a3633' }}>runs over 3 mi</p>
          </div>

          <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>All-Time Miles</p>
            <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
              {Math.round(allTimeMiles).toLocaleString()}
              <span className="text-base font-normal ml-1" style={{ color: '#6b6560' }}>mi</span>
            </p>
            <p className="text-xs mt-2" style={{ color: '#3a3633' }}>total logged</p>
          </div>
        </div>
      )}

      {/* 6-Month Chart */}
      <div className="p-5 mb-6" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <p className="text-xs uppercase tracking-widest mb-5" style={{ color: '#6b6560' }}>
          Mileage — Last 6 Months
        </p>
        <MileageChart data={monthlyData} />
      </div>

      {/* Empty state */}
      {!acts.length && (
        <div className="p-8 text-center" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-sm mb-1" style={{ color: '#e8e0d4' }}>No runs yet</p>
          <p className="text-xs" style={{ color: '#6b6560' }}>
            Connect Strava in Settings to start syncing your activities.
          </p>
        </div>
      )}

      {/* Activity List */}
      {!!acts.length && (
        <div className="overflow-x-auto -mx-5 md:mx-0">
          <div className="min-w-[500px] px-5 md:px-0">
            <div
              className="grid text-xs uppercase tracking-widest pb-2 mb-1 px-4"
              style={{
                color: '#6b6560',
                borderBottom: '1px solid #1e1b18',
                gridTemplateColumns: '1fr 80px 80px 70px 60px 60px',
              }}
            >
              <span>Activity</span>
              <span className="text-right">Distance</span>
              <span className="text-right">Pace</span>
              <span className="text-right">Time</span>
              <span className="text-right">HR</span>
              <span className="text-right">Elev</span>
            </div>

            <div className="space-y-px">
              {acts.map(activity => {
                const miles = metersToMiles(activity.distance)
                const pace = activity.avg_pace ? mpsToMinPerMile(1 / activity.avg_pace) : '—'
                const typeColor = TYPE_COLORS[activity.activity_type] ?? '#6b6560'

                return (
                  <div
                    key={activity.id}
                    className="grid items-center px-4 py-3.5 transition-colors hover:bg-[#141210] group"
                    style={{
                      gridTemplateColumns: '1fr 80px 80px 70px 60px 60px',
                      borderLeft: `2px solid ${typeColor}40`,
                    }}
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm truncate" style={{ color: typeColor }}>
                        {activity.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                        {format(new Date(activity.started_at), 'EEE, MMM d')}
                      </p>
                    </div>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                      {miles} <span className="text-xs" style={{ color: '#6b6560' }}>mi</span>
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                      {pace}
                      {pace !== '—' && <span className="text-xs" style={{ color: '#6b6560' }}>/mi</span>}
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                      {activity.moving_time ? formatDuration(activity.moving_time) : '—'}
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                      {activity.avg_hr ?? '—'}
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                      {activity.elevation_gain != null
                        ? `${Math.round(activity.elevation_gain * 3.281)}′`
                        : '—'}
                    </p>
                  </div>
                )
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/dashboard/runs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
