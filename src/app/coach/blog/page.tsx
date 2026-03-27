export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { format } from 'date-fns'
import DeletePostButton from '@/components/coach/DeletePostButton'
import PublishToggle from '@/components/coach/PublishToggle'

export const revalidate = 0

interface BlogPost {
  id: string
  slug: string
  title: string
  date: string
  category: string
  published: boolean
}

export default async function CoachBlogPage() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, slug, title, date, category, published')
    .order('date', { ascending: false })

  const allPosts: BlogPost[] = posts ?? []

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-3xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Blog
          </h2>
          <p className="text-sm mt-1" style={{ color: '#9c9895' }}>
            {allPosts.length} post{allPosts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Link
          href="/coach/blog/new"
          className="text-xs uppercase tracking-widest px-4 py-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1a1917', color: '#ffffff', borderRadius: '2px' }}
        >
          + New Post
        </Link>
      </div>

      {allPosts.length === 0 && (
        <div
          className="p-8 text-center"
          style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}
        >
          <p className="text-sm mb-4" style={{ color: '#9c9895' }}>No posts yet.</p>
          <Link
            href="/coach/blog/new"
            className="text-xs uppercase tracking-widest underline"
            style={{ color: '#6b6865' }}
          >
            Write your first post →
          </Link>
        </div>
      )}

      {allPosts.length > 0 && (
        <>
          {/* Column headers */}
          <div
            className="grid text-xs uppercase tracking-widest pb-2 mb-1 px-4"
            style={{
              color: '#9c9895',
              borderBottom: '1px solid #ebebea',
              gridTemplateColumns: '1fr 100px 90px 160px',
            }}
          >
            <span>Post</span>
            <span>Category</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="space-y-px">
            {allPosts.map(post => (
              <div
                key={post.id}
                className="grid items-center px-4 py-3.5"
                style={{ gridTemplateColumns: '1fr 100px 90px 120px' }}
              >
                <div>
                  <p className="text-sm" style={{ color: '#1a1917' }}>{post.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9c9895' }}>
                    {format(new Date(post.date), 'MMM d, yyyy')} · /{post.slug}
                  </p>
                </div>

                <span className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
                  {post.category}
                </span>

                <div className="flex justify-center">
                  <PublishToggle slug={post.slug} published={post.published} />
                </div>

                <div className="flex justify-end gap-3 items-center">
                  <Link
                    href={`/coach/blog/${post.slug}/edit`}
                    className="text-xs uppercase tracking-widest transition-colors hover:text-[#1a1917]"
                    style={{ color: '#9c9895' }}
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="text-xs uppercase tracking-widest transition-colors hover:text-[#1a1917]"
                    style={{ color: '#9c9895' }}
                  >
                    View
                  </Link>
                  <DeletePostButton slug={post.slug} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
