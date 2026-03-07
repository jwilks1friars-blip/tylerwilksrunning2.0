import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeStravaCode } from '@/lib/strava'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const base = process.env.APP_URL ?? request.nextUrl.origin
  if (!code) return NextResponse.redirect(`${base}/dashboard/settings?error=strava`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base}/login`)

  const tokenData = await exchangeStravaCode(code)

  await supabase.from('strava_connections').upsert({
    user_id: user.id,
    strava_athlete_id: tokenData.athlete.id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
  })

  return NextResponse.redirect(`${process.env.APP_URL}/dashboard?strava=connected`)
}
