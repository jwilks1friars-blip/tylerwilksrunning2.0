import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { rateLimit, validateBody } from '@/lib/api-helpers'

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
// Body: { recipient_id: string, content: string, sendEmail?: boolean }
export async function POST(request: NextRequest) {
  // Rate limit: 30 messages per minute per IP
  const limited = rateLimit(request, 30, 60_000)
  if (limited) return limited

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const validationError = validateBody(body, {
    recipient_id: { type: 'string', required: true },
    content: { type: 'string', required: true, minLength: 1, maxLength: 2000 },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { recipient_id, content, sendEmail } = body

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

  // Optionally send email — only coach can trigger this
  if (sendEmail && isCoach) {
    try {
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: recipient } = await serviceSupabase
        .from('profiles')
        .select('email, full_name, notify_new_message')
        .eq('id', recipient_id)
        .single()

      if (recipient?.email && recipient.notify_new_message !== false) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'coach@tylerwilksrunning.com',
          to: recipient.email,
          subject: 'New message from your coach',
          text: [
            `Hi ${recipient.full_name ?? 'there'},`,
            ``,
            `You have a new message from your coach:`,
            ``,
            `"${content.trim()}"`,
            ``,
            `Reply in the app: https://tylerwilksrunning.com/dashboard/messages`,
          ].join('\n'),
        })
      }
    } catch {
      // Email failure shouldn't block the message from being saved
    }
  }

  return NextResponse.json({ message }, { status: 201 })
}
