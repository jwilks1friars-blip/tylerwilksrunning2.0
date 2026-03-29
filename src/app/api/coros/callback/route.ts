import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCorosCode } from '@/lib/coros'
import { addSeconds } from 'date-fns'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?error=coros`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.APP_URL}/login`)

  const { userId, accessToken, refreshToken, expiresIn } = await exchangeCorosCode(code)

  await supabase.from('coros_connections').upsert({
    user_id: user.id,
    coros_user_id: userId,
    access_token: accessToken,
    refresh_token: refreshToken,
    token_expires_at: addSeconds(new Date(), expiresIn).toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?coros=connected`)
}
