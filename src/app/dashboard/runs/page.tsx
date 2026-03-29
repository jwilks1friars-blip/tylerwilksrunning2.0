export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format } from 'date-fns'
import MileageChart from '@/components/dashboard/MileageChart'
import LogRunModal from '@/components/dashboard/LogRunModal'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const TYPE_COLORS: Record<string, string> = {
  Run: '#7090e8',
  VirtualRun: '#7090e8',
  TrailRun: '#7fbf7f',
  Walk: '#9c9895',
  Hike: '#9c9895',
  Ride: '#e8a050',
}

const RUNNING_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])
const THREE_MILES_IN_METERS = 4828

export default async function RunsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })

  const acts = activities ?? []

  const runningActs = acts.filter(a => RUNNING_TYPES.has(a.activity_type))
  const longRunningActs = runningActs.filter(a => a.distance > THREE_MILES_IN_METERS && a.avg_pace)

  const longestRunMeters = runningActs.length > 0
    ? Math.max(...runningActs.map(a => a.distance))
    : 0

  const fastestPaceAct = longRunningActs.length > 0
    ? longRunningActs.reduce((best, a) => (!best || a.avg_pace < best.avg_pace) ? a : best, null as typeof acts[0] | null)
    : null

  const allTimeMiles = acts.reduce((sum, a) => sum + metersToMiles(a.distance), 0)

  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1)
    const monthMiles = acts
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

  const displayActivities = acts.slice(0, 100)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h2
            className="text-3xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Runs
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b6865' }}>
            {acts.length} activities synced
          </p>
        </div>
        <div className="hidden md:block"><LogRunModal /></div>
      </div>

      {/* Personal Records */}
      {runningActs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9c9895' }}>Longest Run</p>
            <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
              {metersToMiles(longestRunMeters)}
              <span className="text-base font-normal ml-1" style={{ color: '#9c9895' }}>mi</span>
            </p>
            <p className="text-xs mt-2" style={{ color: '#c8c4c0' }}>all time</p>
          </div>

          <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9c9895' }}>Best Pace</p>
            <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
              {fastestPaceAct ? mpsToMinPerMile(1 / fastestPaceAct.avg_pace) : '—'}
              {fastestPaceAct && (
                <span className="text-base font-normal ml-1" style={{ color: '#9c9895' }}>/mi</span>
              )}
            </p>
            <p className="text-xs mt-2" style={{ color: '#c8c4c0' }}>runs over 3 mi</p>
          </div>

          <div className="p-5 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9c9895' }}>All-Time Miles</p>
            <p className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
              {Math.round(allTimeMiles).toLocaleString()}
              <span className="text-base font-normal ml-1" style={{ color: '#9c9895' }}>mi</span>
            </p>
            <p className="text-xs mt-2" style={{ color: '#c8c4c0' }}>total logged</p>
          </div>
        </div>
      )}

      {/* 6-Month Chart */}
      <div className="p-5 mb-6 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
        <p className="text-sm font-semibold mb-5" style={{ color: '#1a1917' }}>
          Mileage — Last 6 Months
        </p>
        <MileageChart data={monthlyData} />
      </div>

      {/* Empty state */}
      {!acts.length && (
        <div className="p-8 text-center rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <p className="text-sm mb-1" style={{ color: '#3a3733' }}>No runs yet</p>
          <p className="text-xs" style={{ color: '#9c9895' }}>
            Connect Strava in Settings to start syncing your activities.
          </p>
        </div>
      )}

      {/* Activity List */}
      {!!displayActivities.length && (
        <div className="overflow-x-auto -mx-5 md:mx-0">
          <div className="min-w-[500px] px-5 md:px-0">
            <div
              className="grid text-xs uppercase tracking-widest pb-2 mb-1 px-4"
              style={{
                color: '#9c9895',
                borderBottom: '1px solid #ebebea',
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
              {displayActivities.map(activity => {
                const miles = metersToMiles(activity.distance)
                const pace = activity.avg_pace ? mpsToMinPerMile(1 / activity.avg_pace) : '—'
                const typeColor = TYPE_COLORS[activity.activity_type] ?? '#9c9895'

                return (
                  <div
                    key={activity.id}
                    className="grid items-center px-4 py-3.5 rounded transition-colors hover:bg-[#f5f4f2] group"
                    style={{
                      gridTemplateColumns: '1fr 80px 80px 70px 60px 60px',
                      borderLeft: `2px solid ${typeColor}60`,
                    }}
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm truncate font-medium" style={{ color: '#1a1917' }}>
                        {activity.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#9c9895' }}>
                        {format(new Date(activity.started_at), 'EEE, MMM d')}
                      </p>
                    </div>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#1a1917' }}>
                      {miles} <span className="text-xs" style={{ color: '#9c9895' }}>mi</span>
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#1a1917' }}>
                      {pace}
                      {pace !== '—' && <span className="text-xs" style={{ color: '#9c9895' }}>/mi</span>}
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#1a1917' }}>
                      {activity.moving_time ? formatDuration(activity.moving_time) : '—'}
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#1a1917' }}>
                      {activity.avg_hr ?? '—'}
                    </p>

                    <p className="text-sm text-right tabular-nums" style={{ color: '#1a1917' }}>
                      {activity.elevation_gain != null
                        ? `${Math.round(activity.elevation_gain * 3.281)}′`
                        : '—'}
                    </p>
                  </div>
                )
              })}
            </div>

            {acts.length > 100 && (
              <p className="text-xs text-center mt-4" style={{ color: '#c8c4c0' }}>
                Showing 100 of {acts.length} activities
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
