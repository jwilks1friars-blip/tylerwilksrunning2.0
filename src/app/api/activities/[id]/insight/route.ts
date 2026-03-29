import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data } = await supabase
    .from('activity_insights')
    .select('content')
    .eq('activity_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ insight: data?.content ?? null })
}
