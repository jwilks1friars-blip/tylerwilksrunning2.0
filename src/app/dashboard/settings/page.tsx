export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import StravaConnect from '@/components/dashboard/StravaConnect'
import ProfileEditor from '@/components/dashboard/ProfileEditor'

interface Props {
  searchParams: Promise<{ strava?: string; error?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const [{ data: connection }, { data: profile }] = await Promise.all([
    supabase
      .from('strava_connections')
      .select('strava_athlete_id, connected_at')
      .eq('user_id', user!.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name, email, goal_race, goal_time, experience, weekly_miles')
      .eq('id', user!.id)
      .single(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Settings
        </h2>
      </div>

      <div className="space-y-6 max-w-lg">

        {/* Editable Profile */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Profile
          </p>
          <ProfileEditor
            initialGoalRace={profile?.goal_race ?? ''}
            initialGoalTime={profile?.goal_time ?? ''}
            initialWeeklyMiles={profile?.weekly_miles ?? null}
            name={profile?.full_name ?? user?.email ?? ''}
            email={profile?.email ?? user?.email ?? ''}
          />
        </section>

        {/* Strava */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Strava
          </p>
          {params.error === 'strava' && (
            <p className="text-xs mb-3" style={{ color: '#e8a0a0' }}>
              Strava connection failed. Please try again.
            </p>
          )}
          <StravaConnect
            connection={connection}
            connectedViaParam={params.strava === 'connected'}
          />
        </section>

      </div>
    </div>
  )
}
