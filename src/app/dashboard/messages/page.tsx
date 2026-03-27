export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AthleteConversation from './AthleteConversation'

export default async function AthleteMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const coachId = process.env.COACH_USER_ID!

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
        >
          Messages
        </h2>
        <p className="text-sm mt-1" style={{ color: '#9c9895' }}>
          Your conversation with your coach
        </p>
      </div>
      <AthleteConversation userId={user.id} coachId={coachId} />
    </div>
  )
}
