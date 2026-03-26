/**
 * Shared Strava token-refresh utility.
 *
 * Call `getValidStravaToken(userId, supabase)` anywhere you need a fresh
 * access token. It checks expiry and silently refreshes when needed, updating
 * the stored tokens before returning.
 */
import { refreshStravaToken } from './strava'
import { SupabaseClient } from '@supabase/supabase-js'

interface StravaConnection {
  user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

/**
 * Returns a valid (non-expired) Strava access token for the given user.
 * Refreshes and persists the token if it has expired.
 * Returns null if the user has no Strava connection.
 */
export async function getValidStravaToken(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<string | null> {
  const { data: connection } = await supabase
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .single() as { data: StravaConnection | null }

  if (!connection) return null

  // Token still valid — return as-is
  if (new Date(connection.token_expires_at) > new Date()) {
    return connection.access_token
  }

  // Token expired — refresh
  const refreshed = await refreshStravaToken(connection.refresh_token)
  if (!refreshed?.access_token) {
    console.error('Strava token refresh failed for user', userId)
    return null
  }

  await supabase
    .from('strava_connections')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return refreshed.access_token
}

/**
 * Same as above but looks up the user by their Strava athlete ID.
 * Used by the webhook handler which only knows the Strava owner_id.
 */
export async function getValidStravaTokenByAthleteId(
  stravaAthleteId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<{ accessToken: string; userId: string } | null> {
  const { data: connection } = await supabase
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, token_expires_at')
    .eq('strava_athlete_id', stravaAthleteId)
    .single() as { data: StravaConnection | null }

  if (!connection) return null

  if (new Date(connection.token_expires_at) > new Date()) {
    return { accessToken: connection.access_token, userId: connection.user_id }
  }

  const refreshed = await refreshStravaToken(connection.refresh_token)
  if (!refreshed?.access_token) {
    console.error('Strava token refresh failed for athlete', stravaAthleteId)
    return null
  }

  await supabase
    .from('strava_connections')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('strava_athlete_id', stravaAthleteId)

  return { accessToken: refreshed.access_token, userId: connection.user_id }
}
