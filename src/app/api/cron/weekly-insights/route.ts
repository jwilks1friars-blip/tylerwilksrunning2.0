import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all active athletes
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id')
    .neq('plan_tier', 'none')
    .neq('id', process.env.COACH_USER_ID)

  // Trigger insight generation for each athlete
  for (const athlete of athletes ?? []) {
    await fetch(`${process.env.APP_URL}/api/insights/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: athlete.id }),
    })
  }

  return NextResponse.json({ generated: athletes?.length ?? 0 })
}
