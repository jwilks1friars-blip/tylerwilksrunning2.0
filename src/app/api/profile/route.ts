import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { goal_race, goal_time, weekly_miles } = await req.json()

  const { error } = await supabase
    .from('profiles')
    .update({
      goal_race: goal_race || null,
      goal_time: goal_time || null,
      weekly_miles: weekly_miles ? Number(weekly_miles) : null,
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
