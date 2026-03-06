export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import StravaConnect from '@/components/dashboard/StravaConnect'

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

        {/* Profile summary */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Profile
          </p>
          <div
            className="p-5 space-y-3"
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
          >
            {[
              { label: 'Name', value: profile?.full_name },
              { label: 'Email', value: profile?.email ?? user?.email },
              { label: 'Goal Race', value: profile?.goal_race },
              { label: 'Goal Time', value: profile?.goal_time },
              { label: 'Experience', value: profile?.experience },
              { label: 'Weekly Miles', value: profile?.weekly_miles != null ? `${profile.weekly_miles} mi/wk` : null },
            ].map(row => row.value ? (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
                  {row.label}
                </span>
                <span className="text-sm capitalize" style={{ color: '#f5f2ee' }}>
                  {row.value}
                </span>
              </div>
            ) : null)}
          </div>
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
