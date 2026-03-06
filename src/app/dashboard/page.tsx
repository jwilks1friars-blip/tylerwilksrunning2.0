export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import MileageChart from '@/components/dashboard/MileageChart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sevenDaysAgo = subDays(new Date(), 6)

  const [
    { data: activities },
    { data: profile },
    { data: insight },
  ] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('user_id', user!.id)
      .gte('started_at', sevenDaysAgo.toISOString())
      .order('started_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, goal_race, goal_time')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('insights')
      .select('*')
      .eq('user_id', user!.id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Stats
  const totalMiles = activities?.reduce((sum, a) => sum + metersToMiles(a.distance), 0) ?? 0
  const runCount = activities?.length ?? 0
  const pacedRuns = activities?.filter(a => a.avg_pace) ?? []
  const avgPaceMps = pacedRuns.length
    ? pacedRuns.reduce((sum, a) => sum + (1 / a.avg_pace), 0) / pacedRuns.length
    : 0

  // Chart data — one bar per day for the last 7 days
  const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() })
  const chartData = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayMiles = activities
      ?.filter(a => format(new Date(a.started_at), 'yyyy-MM-dd') === dayStr)
      .reduce((sum, a) => sum + metersToMiles(a.distance), 0) ?? 0
    return {
      day: format(day, 'EEE'),
      miles: Math.round(dayMiles * 10) / 10,
    }
  })

  const displayName = profile?.full_name ?? null

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          {displayName ? `Hey, ${displayName}` : 'Overview'}
        </h2>
        {profile?.goal_race && (
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Training for {profile.goal_race}
            {profile.goal_time && ` — goal: ${profile.goal_time}`}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Miles This Week', value: totalMiles.toFixed(1) },
          { label: 'Avg Pace', value: avgPaceMps ? `${mpsToMinPerMile(avgPaceMps)}/mi` : '—' },
          { label: 'Runs', value: String(runCount) },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-5"
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>
              {stat.label}
            </p>
            <p
              className="text-3xl font-semibold"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Mileage chart */}
      <div
        className="p-5 mb-6"
        style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
      >
        <p className="text-xs uppercase tracking-widest mb-5" style={{ color: '#6b6560' }}>
          Daily Mileage — Last 7 Days
        </p>
        <MileageChart data={chartData} />
      </div>

      {/* Latest coaching insight */}
      {insight ? (
        <div
          className="p-5"
          style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
        >
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6b6560' }}>
            Coaching Note
          </p>
          <p className="text-sm leading-7" style={{ color: '#e8e0d4' }}>
            {insight.content}
          </p>
          <p className="text-xs mt-4" style={{ color: '#6b6560' }}>
            Week of {format(new Date(insight.week_start), 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div
          className="p-5"
          style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>
            Coaching Note
          </p>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            No coaching notes yet. Connect Strava and complete a week of training to receive your first insight.
          </p>
        </div>
      )}
    </div>
  )
}
