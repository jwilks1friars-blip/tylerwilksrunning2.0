import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Parse "M:SS" or "MM:SS" or "H:MM:SS" pace string → seconds per mile
function parsePaceToSecsPerMile(pace: string): number | null {
  const parts = pace.trim().split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 2) {
    const [min, sec] = parts
    if (sec < 0 || sec >= 60) return null
    return min * 60 + sec
  }
  if (parts.length === 3) {
    const [hr, min, sec] = parts
    if (min >= 60 || sec < 0 || sec >= 60) return null
    return hr * 3600 + min * 60 + sec
  }
  return null
}

// POST /api/activities — manual activity log
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, distance_miles, pace, started_at, activity_type } = await request.json()

  if (!distance_miles || !pace || !started_at) {
    return NextResponse.json({ error: 'distance_miles, pace, and started_at are required' }, { status: 400 })
  }

  const distanceMiles = parseFloat(distance_miles)
  if (isNaN(distanceMiles) || distanceMiles <= 0) {
    return NextResponse.json({ error: 'Invalid distance' }, { status: 400 })
  }

  const secsPerMile = parsePaceToSecsPerMile(pace)
  if (!secsPerMile || secsPerMile <= 0) {
    return NextResponse.json({ error: 'Invalid pace — use MM:SS or H:MM:SS format' }, { status: 400 })
  }

  const distanceMeters = distanceMiles * 1609.34
  const movingTime = Math.round(distanceMiles * secsPerMile)
  // avg_pace stored as seconds-per-meter (same convention as Strava webhook)
  const avgPace = secsPerMile / 1609.34

  // Synthetic negative strava_id so the unique-not-null constraint is satisfied
  const syntheticStravaId = -(Date.now() * 1000 + Math.floor(Math.random() * 1000))

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      strava_id: syntheticStravaId,
      name: name?.trim() || 'Manual Run',
      distance: distanceMeters,
      moving_time: movingTime,
      elapsed_time: movingTime,
      avg_pace: avgPace,
      activity_type: activity_type || 'Run',
      started_at,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data }, { status: 201 })
}
