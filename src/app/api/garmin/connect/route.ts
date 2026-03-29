import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGarminRequestToken, getGarminAuthUrl } from '@/lib/garmin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token, tokenSecret } = await getGarminRequestToken()

  // Store request token secret in a short-lived cookie so we can use it in the callback
  const response = NextResponse.redirect(getGarminAuthUrl(token))
  response.cookies.set('garmin_request_token', token, { httpOnly: true, maxAge: 600, path: '/' })
  response.cookies.set('garmin_request_token_secret', tokenSecret, { httpOnly: true, maxAge: 600, path: '/' })
  return response
}
