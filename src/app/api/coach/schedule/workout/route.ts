import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireCoach, validateBody } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const auth = await requireCoach()
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const validationError = validateBody(body, {
    planId: { type: 'string', required: true },
    athleteId: { type: 'string', required: true },
    scheduledDate: { type: 'date', required: true },
    workoutType: { type: 'string', required: true },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { planId, athleteId, scheduledDate, workoutType, targetDistanceMiles, targetPaceDesc, description } = body

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: workout, error } = await admin
    .from('workouts')
    .insert({
      plan_id: planId,
      user_id: athleteId,
      scheduled_date: scheduledDate,
      workout_type: workoutType,
      target_distance_miles: targetDistanceMiles || null,
      target_pace_desc: targetPaceDesc || null,
      description: description || null,
      completed: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workout })
}
