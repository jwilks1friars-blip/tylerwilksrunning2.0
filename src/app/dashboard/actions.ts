'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { autoCompleteWorkout } from '@/lib/autoCompleteWorkout'

export async function logRun(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string)?.trim()
  const date = formData.get('date') as string
  const distanceMiles = parseFloat(formData.get('distance') as string)
  const durationStr = (formData.get('duration') as string)?.trim()
  const activityType = (formData.get('activity_type') as string) || 'Run'

  if (!date || isNaN(distanceMiles) || distanceMiles <= 0 || !durationStr) {
    return { error: 'Please fill in all required fields.' }
  }

  const parts = durationStr.split(':').map(Number)
  let movingTime: number
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    movingTime = parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2 && parts.every(p => !isNaN(p))) {
    movingTime = parts[0] * 60 + parts[1]
  } else {
    return { error: 'Invalid duration. Use MM:SS or HH:MM:SS.' }
  }

  if (movingTime <= 0) return { error: 'Duration must be greater than 0.' }

  const distanceMeters = distanceMiles * 1609.34
  const avgPace = movingTime / distanceMeters
  const startedAt = new Date(date).toISOString()

  const { error } = await supabase.from('activities').insert({
    user_id: user.id,
    name: name || 'Manual Run',
    distance: Math.round(distanceMeters),
    started_at: startedAt,
    moving_time: movingTime,
    avg_pace: avgPace,
    activity_type: activityType,
  })

  if (error) return { error: error.message }

  // Auto-complete matching scheduled workout
  await autoCompleteWorkout(user.id, startedAt, supabase)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/runs')
  revalidatePath('/dashboard/training')
  return { success: true }
}
