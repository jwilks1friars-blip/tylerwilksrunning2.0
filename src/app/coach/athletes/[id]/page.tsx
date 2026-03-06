export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { metersToMiles, mpsToMinPerMile } from '@/lib/strava'
import { subDays, format } from 'date-fns'
import Link from 'next/link'
import InsightEditor from '@/components/coach/InsightEditor'
import GenerateInsightButton from '@/components/coach/GenerateInsightButton'
import { notFound } from 'next/navigation'

export default async function AthletePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Use service role to read any athlete's data
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const fourWeeksAgo = subDays(new Date(), 28).toISOString()

  const [
    { data: profile },
    { data: activities },
    { data: insights },
    { data: stravaConnection },
  ] = await Promise.all([
    serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single(),
    serviceSupabase
      .from('activities')
      .select('*')
      .eq('user_id', id)
      .gte('started_at', fourWeeksAgo)
      .order('started_at', { ascending: false }),
    serviceSupabase
      .from('insights')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(4),
    serviceSupabase
      .from('strava_connections')
      .select('strava_athlete_id, connected_at')
      .eq('user_id', id)
      .maybeSingle(),
  ])

  if (!profile) notFound()

  const weeklyMiles = activities
    ?.filter(a => new Date(a.started_at) >= subDays(new Date(), 7))
    .reduce((sum, a) => sum + metersToMiles(a.distance), 0) ?? 0

  const pendingInsights = insights?.filter(i => !i.approved) ?? []
  const approvedInsights = insights?.filter(i => i.approved) ?? []

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-8 transition-colors hover:text-[#f5f2ee]"
        style={{ color: '#6b6560' }}
      >
        ← Athletes
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-3xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            {profile.full_name ?? 'Unnamed Athlete'}
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            {profile.email}
            {profile.plan_tier && profile.plan_tier !== 'none' && (
              <span className="ml-3 uppercase tracking-widest" style={{ color: '#e8e0d4' }}>
                {profile.plan_tier}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/coach/athletes/${id}/schedule`}
            className="px-4 py-2 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }}
          >
            Manage Schedule
          </Link>
          <GenerateInsightButton athleteId={id} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Mi This Week', value: weeklyMiles.toFixed(1) },
          { label: 'Goal Race', value: profile.goal_race ?? '—' },
          { label: 'Goal Time', value: profile.goal_time ?? '—' },
          { label: 'Strava', value: stravaConnection ? 'Connected' : 'Not connected' },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-4"
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#6b6560' }}>
              {stat.label}
            </p>
            <p className="text-sm" style={{ color: '#f5f2ee' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending insights */}
      {pendingInsights.length > 0 && (
        <section className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#fc4c02' }}>
            Needs Approval
          </p>
          <div className="space-y-3">
            {pendingInsights.map(insight => (
              <InsightEditor key={insight.id} insight={insight} athleteId={id} />
            ))}
          </div>
        </section>
      )}

      {/* Recent activities */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
          Last 4 Weeks
        </p>

        {!activities?.length ? (
          <p className="text-sm" style={{ color: '#6b6560' }}>No recent activities.</p>
        ) : (
          <div
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
          >
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid #1e1b18',
                }}
              >
                <div>
                  <p className="text-sm" style={{ color: '#f5f2ee' }}>{activity.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                    {format(new Date(activity.started_at), 'EEE, MMM d')}
                  </p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-sm tabular-nums" style={{ color: '#f5f2ee' }}>
                      {metersToMiles(activity.distance)} mi
                    </p>
                  </div>
                  <div>
                    <p className="text-sm tabular-nums" style={{ color: '#f5f2ee' }}>
                      {activity.avg_pace ? `${mpsToMinPerMile(1 / activity.avg_pace)}/mi` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm tabular-nums" style={{ color: '#6b6560' }}>
                      {activity.avg_hr ? `${activity.avg_hr} bpm` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past insights */}
      {approvedInsights.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Past Coaching Notes
          </p>
          <div className="space-y-3">
            {approvedInsights.map(insight => (
              <div
                key={insight.id}
                className="p-5"
                style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
              >
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
                  Week of {format(new Date(insight.week_start), 'MMMM d, yyyy')}
                </p>
                <p className="text-sm leading-7" style={{ color: '#e8e0d4' }}>
                  {insight.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
