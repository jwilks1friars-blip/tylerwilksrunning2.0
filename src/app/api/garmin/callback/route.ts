import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeGarminToken } from '@/lib/garmin'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const oauthToken = searchParams.get('oauth_token')
  const oauthVerifier = searchParams.get('oauth_verifier')

  const requestToken = request.cookies.get('garmin_request_token')?.value
  const requestTokenSecret = request.cookies.get('garmin_request_token_secret')?.value

  if (!oauthToken || !oauthVerifier || !requestToken || !requestTokenSecret) {
    return NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?error=garmin`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.APP_URL}/login`)

  const { userId, accessToken, accessTokenSecret } = await exchangeGarminToken(
    requestToken,
    requestTokenSecret,
    oauthVerifier
  )

  await supabase.from('garmin_connections').upsert({
    user_id: user.id,
    garmin_user_id: userId,
    access_token: accessToken,
    access_token_secret: accessTokenSecret,
  }, { onConflict: 'user_id' })

  const response = NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?garmin=connected`)
  response.cookies.delete('garmin_request_token')
  response.cookies.delete('garmin_request_token_secret')
  return response
}
