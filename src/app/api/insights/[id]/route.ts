import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCoach, validateBody } from '@/lib/api-helpers'
import { Resend } from 'resend'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCoach()
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const validationError = validateBody(body, {
    content: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { content } = body
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('insights')
    .update({
      content,
      approved: true,
      sent_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, profiles!insights_user_id_fkey(email, full_name, notify_weekly_insight)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email notification to athlete if they have opted in
  const profile = data?.profiles as { email?: string; full_name?: string; notify_weekly_insight?: boolean } | null
  if (profile?.email && profile.notify_weekly_insight !== false && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'coach@tylerwilksrunning.com',
        to: profile.email,
        subject: 'Your weekly coaching note is ready',
        text: [
          `Hi ${profile.full_name ?? 'there'},`,
          '',
          'Your weekly coaching note from Tyler is ready:',
          '',
          content,
          '',
          'View it in the app: https://tylerwilksrunning.com/dashboard',
        ].join('\n'),
      })
    } catch {
      // Email failure shouldn't block the response
    }
  }

  // Return insight without embedded profile data
  const { profiles: _p, ...insight } = data
  return NextResponse.json({ insight })
}
