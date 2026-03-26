export const dynamic = 'force-dynamic'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CoachConversation from './CoachConversation'

export default async function CoachMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string }>
}) {
  const { athlete: selectedAthleteId } = await searchParams

  // Verify coach
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { getCoachId } = await import('@/lib/coach')
  const coachId = await getCoachId()
  if (!user || user.id !== coachId) redirect('/dashboard')

  // Use service role to get all active athletes
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: athletes } = await serviceSupabase
    .from('profiles')
    .select('id, full_name, email, plan_tier')
    .neq('id', coachId)
    .order('full_name', { ascending: true })

  return (
    <CoachConversation
      coachId={user!.id}
      athletes={athletes ?? []}
      initialAthleteId={selectedAthleteId ?? null}
    />
  )
}
