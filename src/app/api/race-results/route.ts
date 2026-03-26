import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, validateBody } from '@/lib/api-helpers'

/** GET /api/race-results — list the current user's race results */
export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('race_results')
    .select('*')
    .eq('user_id', user.id)
    .order('race_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ results: data })
}

/** POST /api/race-results — log a new race result */
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  const body = await request.json()
  const validationError = validateBody(body, {
    race_name: { type: 'string', required: true, maxLength: 200 },
    race_date: { type: 'date', required: true },
    distance: { type: 'string', required: true, maxLength: 50 },
    finish_time: { type: 'string', required: true, maxLength: 20 },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('race_results')
    .insert({
      user_id: user.id,
      race_name: body.race_name,
      race_date: body.race_date,
      distance: body.distance,
      finish_time: body.finish_time,
      goal_time: body.goal_time ?? null,
      place_overall: body.place_overall ?? null,
      place_age_group: body.place_age_group ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ result: data }, { status: 201 })
}
