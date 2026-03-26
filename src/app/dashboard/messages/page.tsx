export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AthleteConversation from './AthleteConversation'
import { getCoachId } from '@/lib/coach'

export default async function AthleteMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const coachId = await getCoachId()
  if (!coachId) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Messages
        </h2>
        <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
          Your conversation with your coach
        </p>
      </div>
      <AthleteConversation userId={user.id} coachId={coachId} />
    </div>
  )
}
