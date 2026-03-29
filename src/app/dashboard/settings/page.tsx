export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import StravaConnect from '@/components/dashboard/StravaConnect'
import GarminConnect from '@/components/dashboard/GarminConnect'
import CorosConnect from '@/components/dashboard/CorosConnect'
import ProfileEditor from '@/components/dashboard/ProfileEditor'

interface Props {
  searchParams: Promise<{ strava?: string; garmin?: string; coros?: string; error?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const [
    { data: stravaConnection },
    { data: garminConnection },
    { data: corosConnection },
    { data: profile },
  ] = await Promise.all([
    supabase.from('strava_connections').select('strava_athlete_id, connected_at').eq('user_id', user!.id).maybeSingle(),
    supabase.from('garmin_connections').select('garmin_user_id, connected_at').eq('user_id', user!.id).maybeSingle(),
    supabase.from('coros_connections').select('coros_user_id, connected_at').eq('user_id', user!.id).maybeSingle(),
    supabase.from('profiles').select('full_name, email, goal_race, goal_time, experience, weekly_miles').eq('id', user!.id).single(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
        >
          Settings
        </h2>
      </div>

      <div className="space-y-8 max-w-lg">

        {/* Profile */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>Profile</p>
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
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>Strava</p>
          {params.error === 'strava' && (
            <p className="text-xs mb-3" style={{ color: '#e8a0a0' }}>Strava connection failed. Please try again.</p>
          )}
          <StravaConnect
            connection={stravaConnection}
            connectedViaParam={params.strava === 'connected'}
          />
        </section>

        {/* Garmin */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>Garmin</p>
          {params.error === 'garmin' && (
            <p className="text-xs mb-3" style={{ color: '#e8a0a0' }}>Garmin connection failed. Please try again.</p>
          )}
          <GarminConnect
            connection={garminConnection}
            connectedViaParam={params.garmin === 'connected'}
          />
        </section>

        {/* COROS */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>COROS</p>
          {params.error === 'coros' && (
            <p className="text-xs mb-3" style={{ color: '#e8a0a0' }}>COROS connection failed. Please try again.</p>
          )}
          <CorosConnect
            connection={corosConnection}
            connectedViaParam={params.coros === 'connected'}
          />
        </section>

        {/* Apple Watch */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>Apple Watch</p>
          <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#555' }} />
              <p className="text-sm font-medium" style={{ color: '#f5f2ee' }}>Apple Watch</p>
            </div>
            <p className="text-sm mb-3" style={{ color: '#e8e0d4' }}>
              Apple Watch workouts sync automatically through Strava or Garmin.
            </p>
            <div className="space-y-2">
              <p className="text-xs" style={{ color: '#6b6560' }}>
                <span style={{ color: '#9c9895' }}>Option 1:</span> Install the Strava iOS app → enable Health permissions → your Apple Watch runs will appear here automatically.
              </p>
              <p className="text-xs" style={{ color: '#6b6560' }}>
                <span style={{ color: '#9c9895' }}>Option 2:</span> If you have a Garmin device paired to your Apple Watch, connect Garmin above.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
