import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages?with=<user_id>
// Fetches full conversation between current user and the specified user,
// and marks all unread incoming messages as read.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withUserId = request.nextUrl.searchParams.get('with')
  if (!withUserId || withUserId === 'undefined' || withUserId === 'null') {
    return NextResponse.json({ error: 'Missing ?with= param' }, { status: 400 })
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at, read_at')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${withUserId}),` +
      `and(sender_id.eq.${withUserId},recipient_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark unread incoming messages as read
  const unreadIds = (messages ?? [])
    .filter(m => m.recipient_id === user.id && !m.read_at)
    .map(m => m.id)

  if (unreadIds.length > 0) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
  }

  return NextResponse.json({ messages })
}

// POST /api/messages
// Body: { recipient_id: string, content: string }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipient_id, content } = await request.json()

  if (!recipient_id || !content?.trim()) {
    return NextResponse.json({ error: 'recipient_id and content are required' }, { status: 400 })
  }

  // Enforce that conversations only happen between coach and athletes
  const coachId = process.env.COACH_USER_ID
  const isCoach = user.id === coachId
  const isToCoach = recipient_id === coachId

  if (!isCoach && !isToCoach) {
    return NextResponse.json(
      { error: 'Messages can only be sent to or from the coach' },
      { status: 403 }
    )
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message }, { status: 201 })
}
