import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function assertCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id === process.env.COACH_USER_ID ? user : null
}

// GET /api/coach/schedule/weekly-note?planId=xxx
// Returns all weekly notes for a plan as { notes: { [weekNum]: content } }
export async function GET(req: NextRequest) {
  const coach = await assertCoach()
  if (!coach) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planId = req.nextUrl.searchParams.get('planId')
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })

  const admin = adminClient()
  const { data, error } = await admin
    .from('weekly_notes')
    .select('week_num, content')
    .eq('plan_id', planId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const notes: Record<number, string> = {}
  data?.forEach(n => { notes[n.week_num] = n.content })

  return NextResponse.json({ notes })
}

// POST /api/coach/schedule/weekly-note
// Body: { planId, weekNum, content }
export async function POST(req: NextRequest) {
  const coach = await assertCoach()
  if (!coach) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId, weekNum, content } = await req.json()
  if (!planId || weekNum == null) {
    return NextResponse.json({ error: 'planId and weekNum required' }, { status: 400 })
  }

  const admin = adminClient()
  const { error } = await admin
    .from('weekly_notes')
    .upsert(
      { plan_id: planId, week_num: weekNum, content: content ?? '', updated_at: new Date().toISOString() },
      { onConflict: 'plan_id,week_num' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
