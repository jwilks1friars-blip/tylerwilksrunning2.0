import { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

/**
 * When an athlete logs a run (manual or via Strava), automatically mark
 * the matching scheduled workout as completed if one exists on that date.
 */
export async function autoCompleteWorkout(
  userId: string,
  startedAt: string, // ISO string
  supabase: SupabaseClient
) {
  const activityDate = format(new Date(startedAt), 'yyyy-MM-dd')

  const { data: plan } = await supabase
    .from('training_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!plan) return

  const { data: workout } = await supabase
    .from('workouts')
    .select('id, completed')
    .eq('plan_id', plan.id)
    .eq('scheduled_date', activityDate)
    .neq('workout_type', 'rest')
    .limit(1)
    .maybeSingle()

  if (!workout || workout.completed) return

  await supabase.from('workouts').update({ completed: true }).eq('id', workout.id)
}
