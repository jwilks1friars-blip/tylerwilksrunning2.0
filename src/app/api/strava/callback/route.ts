import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { exchangeStravaCode } from '@/lib/strava'
import { syncAllActivities } from '@/app/api/strava/backfill/route'

// Allow extra time for the initial activity backfill on first connect
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const base = process.env.APP_URL ?? request.nextUrl.origin
  if (!code) return NextResponse.redirect(`${base}/dashboard/settings?error=strava`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base}/login`)

  const tokenData = await exchangeStravaCode(code)

  // If Strava returns an error (e.g. bad client ID/secret), surface it
  if (tokenData.errors || !tokenData.athlete) {
    console.error('Strava token exchange failed:', JSON.stringify(tokenData))
    return NextResponse.redirect(`${base}/dashboard/settings?error=strava_token`)
  }

  await supabase.from('strava_connections').upsert({
    user_id: user.id,
    strava_athlete_id: tokenData.athlete.id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
  })

  // Backfill full activity history using the fresh access token
  // We already have the token so we can sync directly without another auth hop
  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await syncAllActivities(user.id, tokenData.access_token, serviceClient)
  } catch {
    // Backfill failure shouldn't block the redirect
  }

  return NextResponse.redirect(`${base}/dashboard?strava=connected`)
}
