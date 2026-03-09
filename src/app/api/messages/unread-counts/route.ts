import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages/unread-counts
// Returns { total: number, bySender: { [sender_id]: number } }
// Used for sidebar unread badges.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ total: 0, bySender: {} })

  const { data: messages } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('recipient_id', user.id)
    .is('read_at', null)

  const bySender: Record<string, number> = {}
  for (const msg of messages ?? []) {
    bySender[msg.sender_id] = (bySender[msg.sender_id] ?? 0) + 1
  }

  return NextResponse.json({ total: (messages ?? []).length, bySender })
}
