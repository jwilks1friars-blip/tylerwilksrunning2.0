import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planId, athleteId } = await request.json()
  if (!planId || !athleteId) {
    return NextResponse.json({ error: 'Missing planId or athleteId' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Pause any currently active plans for this athlete
  await admin
    .from('training_plans')
    .update({ status: 'paused' })
    .eq('user_id', athleteId)
    .eq('status', 'active')

  const { data: plan, error } = await admin
    .from('training_plans')
    .update({ status: 'active' })
    .eq('id', planId)
    .eq('user_id', athleteId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ plan })
}
