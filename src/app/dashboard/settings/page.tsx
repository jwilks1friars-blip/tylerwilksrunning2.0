export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import StravaConnect from '@/components/dashboard/StravaConnect'
import ProfileEditor from '@/components/dashboard/ProfileEditor'
import ExportButton from '@/components/dashboard/ExportButton'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'

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
      .select('strava_athlete_id, created_at, last_synced_at, token_expires_at')
      .eq('user_id', user!.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name, email, goal_race, goal_time, experience, weekly_miles, notify_weekly_insight, notify_new_message')
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

        {/* Notifications */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Notifications
          </p>
          <NotificationPreferences
            initialWeeklyInsight={profile?.notify_weekly_insight ?? true}
            initialNewMessage={profile?.notify_new_message ?? true}
          />
        </section>

        {/* Data export */}
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Export Your Data
          </p>
          <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
            <p className="text-xs mb-4" style={{ color: '#6b6560' }}>
              Download all your activities and race results. CSV opens in Excel; JSON is machine-readable.
            </p>
            <ExportButton />
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
