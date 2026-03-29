import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planId, athleteId, scheduledDate, workoutType, targetDistanceMiles, targetPaceDesc, description, targetRpe, hrZoneTarget, racePrep } = await request.json()

  if (!planId || !athleteId || !scheduledDate || !workoutType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

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
      target_rpe: targetRpe || null,
      hr_zone_target: hrZoneTarget || null,
      race_prep: racePrep ?? false,
      completed: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workout })
}
