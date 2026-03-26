import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, validateBody } from '@/lib/api-helpers'

/** PATCH /api/profile/notifications */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  const body = await request.json()
  const validationError = validateBody(body, {
    notify_weekly_insight: { type: 'boolean' },
    notify_new_message: { type: 'boolean' },
  })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const supabase = await createClient()
  const update: Record<string, boolean> = {}
  if (body.notify_weekly_insight !== undefined) update.notify_weekly_insight = body.notify_weekly_insight
  if (body.notify_new_message !== undefined) update.notify_new_message = body.notify_new_message

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
