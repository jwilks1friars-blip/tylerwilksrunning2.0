import { createClient } from '@supabase/supabase-js'
import { metersToMiles } from '@/lib/strava'
import { subDays, format } from 'date-fns'
import Link from 'next/link'
import InviteAthleteForm from '@/components/coach/InviteAthleteForm'

const TIER_LABELS: Record<string, string> = {
  plan: 'Plan',
  coaching: 'Coaching',
  elite: 'Elite',
  none: 'Free',
}

export default async function CoachPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sevenDaysAgo = subDays(new Date(), 7).toISOString()

  // All athletes (excluding coach)
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, email, plan_tier, created_at')
    .neq('id', process.env.COACH_USER_ID)
    .order('created_at', { ascending: false })

  // All activities in the last 7 days across all athletes
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('user_id, distance, started_at')
    .in('user_id', athletes?.map(a => a.id) ?? [])
    .gte('started_at', sevenDaysAgo)

  // Map weekly miles per athlete
  const weeklyMilesMap: Record<string, number> = {}
  const lastRunMap: Record<string, string> = {}

  for (const activity of recentActivities ?? []) {
    weeklyMilesMap[activity.user_id] =
      (weeklyMilesMap[activity.user_id] ?? 0) + metersToMiles(activity.distance)
    if (!lastRunMap[activity.user_id] ||
      activity.started_at > lastRunMap[activity.user_id]) {
      lastRunMap[activity.user_id] = activity.started_at
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-3xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Athletes
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            {athletes?.length ?? 0} total
          </p>
        </div>
        <InviteAthleteForm />
      </div>

      {!athletes?.length && (
        <div
          className="p-8 text-center"
          style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
        >
          <p className="text-sm" style={{ color: '#6b6560' }}>No athletes yet.</p>
        </div>
      )}

      {!!athletes?.length && (
        <>
          {/* Column headers */}
          <div
            className="grid text-xs uppercase tracking-widest pb-2 mb-1 px-4"
            style={{
              color: '#6b6560',
              borderBottom: '1px solid #1e1b18',
              gridTemplateColumns: '1fr 100px 80px 120px',
            }}
          >
            <span>Athlete</span>
            <span>Plan</span>
            <span className="text-right">Mi / Wk</span>
            <span className="text-right">Last Run</span>
          </div>

          <div className="space-y-px">
            {athletes.map(athlete => {
              const miles = weeklyMilesMap[athlete.id] ?? 0
              const lastRun = lastRunMap[athlete.id]

              return (
                <Link
                  key={athlete.id}
                  href={`/coach/athletes/${athlete.id}`}
                  className="grid items-center px-4 py-3.5 transition-colors hover:bg-[#141210]"
                  style={{ gridTemplateColumns: '1fr 100px 80px 120px' }}
                >
                  <div>
                    <p className="text-sm" style={{ color: '#f5f2ee' }}>
                      {athlete.full_name ?? '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                      {athlete.email}
                    </p>
                  </div>

                  <span
                    className="text-xs uppercase tracking-widest"
                    style={{
                      color: athlete.plan_tier === 'none' ? '#6b6560' : '#e8e0d4',
                    }}
                  >
                    {TIER_LABELS[athlete.plan_tier] ?? athlete.plan_tier}
                  </span>

                  <p className="text-sm text-right tabular-nums" style={{ color: '#f5f2ee' }}>
                    {miles > 0 ? miles.toFixed(1) : '—'}
                  </p>

                  <p className="text-sm text-right" style={{ color: '#6b6560' }}>
                    {lastRun
                      ? format(new Date(lastRun), 'MMM d')
                      : '—'}
                  </p>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
