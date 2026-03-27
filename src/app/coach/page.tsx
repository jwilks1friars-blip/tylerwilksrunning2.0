export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { metersToMiles } from '@/lib/strava'
import { subDays } from 'date-fns'
import InviteAthleteForm from '@/components/coach/InviteAthleteForm'
import AthleteTable from '@/components/coach/AthleteTable'

export default async function CoachPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sevenDaysAgo = subDays(new Date(), 7).toISOString()

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, email, plan_tier, created_at')
    .neq('id', process.env.COACH_USER_ID)
    .order('created_at', { ascending: false })

  const { data: recentActivities } = await supabase
    .from('activities')
    .select('user_id, distance, started_at')
    .in('user_id', athletes?.map(a => a.id) ?? [])
    .gte('started_at', sevenDaysAgo)

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
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Athletes
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b6865' }}>
            {athletes?.length ?? 0} total
          </p>
        </div>
        <InviteAthleteForm />
      </div>

      {!athletes?.length && (
        <div className="p-8 text-center rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <p className="text-sm" style={{ color: '#9c9895' }}>No athletes yet.</p>
        </div>
      )}

      {!!athletes?.length && (
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
  )
}
