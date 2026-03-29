import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { rpe, feltLike, notes } = await request.json()

  const { data, error } = await supabase
    .from('workout_feedback')
    .upsert({
      workout_id: id,
      user_id: user.id,
      rpe: rpe || null,
      felt_like: feltLike || null,
      notes: notes || null,
    }, { onConflict: 'workout_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feedback: data })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data } = await supabase
    .from('workout_feedback')
    .select('*')
    .eq('workout_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ feedback: data })
}
