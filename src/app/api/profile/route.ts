import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, validateBody } from '@/lib/api-helpers'

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  const supabase = await createClient()

  const body = await req.json()
  const validationError = validateBody(body, {
    goal_time: { type: 'string', maxLength: 20 },
    weekly_miles: { type: 'number', min: 0, max: 300 },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { goal_race, goal_time, weekly_miles } = body

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
