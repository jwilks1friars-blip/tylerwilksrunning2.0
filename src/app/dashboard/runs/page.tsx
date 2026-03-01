import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { format } from 'date-fns'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const TYPE_COLORS: Record<string, string> = {
  Run: '#e8e0d4',
  VirtualRun: '#e8e0d4',
  TrailRun: '#a0c4a0',
  Walk: '#6b6560',
  Hike: '#6b6560',
  Ride: '#a0b4c4',
}

export default async function RunsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2
            className="text-3xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Runs
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            {activities?.length ?? 0} activities synced
          </p>
        </div>
      </div>

      {/* Empty state */}
      {!activities?.length && (
        <div
          className="p-8 text-center"
          style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
        >
          <p className="text-sm mb-1" style={{ color: '#e8e0d4' }}>No runs yet</p>
          <p className="text-xs" style={{ color: '#6b6560' }}>
            Connect Strava in Settings to start syncing your activities.
          </p>
        </div>
      )}

      {/* Column headers */}
      {!!activities?.length && (
        <>
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

          {/* Activity rows */}
          <div className="space-y-px">
            {activities.map(activity => {
              const miles = metersToMiles(activity.distance)
              const pace = activity.avg_pace
                ? mpsToMinPerMile(1 / activity.avg_pace)
                : '—'
              const typeColor = TYPE_COLORS[activity.activity_type] ?? '#6b6560'

              return (
                <div
                  key={activity.id}
                  className="grid items-center px-4 py-3.5 transition-colors hover:bg-[#141210] group"
                  style={{ gridTemplateColumns: '1fr 80px 80px 70px 60px 60px' }}
                >
                  {/* Name + date */}
                  <div className="min-w-0 pr-4">
                    <p
                      className="text-sm truncate"
                      style={{ color: typeColor }}
                    >
                      {activity.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                      {format(new Date(activity.started_at), 'EEE, MMM d')}
                    </p>
                  </div>

                  {/* Distance */}
                  <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                    {miles} <span className="text-xs" style={{ color: '#6b6560' }}>mi</span>
                  </p>

                  {/* Pace */}
                  <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                    {pace}
                    {pace !== '—' && (
                      <span className="text-xs" style={{ color: '#6b6560' }}>/mi</span>
                    )}
                  </p>

                  {/* Duration */}
                  <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                    {activity.moving_time ? formatDuration(activity.moving_time) : '—'}
                  </p>

                  {/* HR */}
                  <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                    {activity.avg_hr ?? '—'}
                  </p>

                  {/* Elevation */}
                  <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                    {activity.elevation_gain != null
                      ? `${Math.round(activity.elevation_gain * 3.281)}′`
                      : '—'}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
