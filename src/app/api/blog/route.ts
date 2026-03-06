import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { parseBodyToSections } from '@/lib/blog'

/** POST /api/blog — create a new blog post (coach only) */
export async function POST(request: NextRequest) {
  // Verify the caller is the coach
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, slug, date, category, excerpt, body, published } = await request.json()

  if (!title || !slug || !body) {
    return NextResponse.json({ error: 'title, slug, and body are required' }, { status: 400 })
  }

  const sections = parseBodyToSections(body)

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('blog_posts')
    .insert({ title, slug, date: date ?? new Date().toISOString().split('T')[0], category: category ?? 'Training', excerpt: excerpt ?? '', sections, published: published ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}
