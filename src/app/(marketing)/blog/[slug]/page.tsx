import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPost, POSTS } from '@/lib/blog'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return { title: `${post.title} — Tyler Wilks Running`, description: post.excerpt }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <div>
      <article className="max-w-2xl mx-auto px-6 pt-20 pb-24">

        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-12 transition-colors hover:text-[#f5f2ee]"
          style={{ color: '#6b6560' }}
        >
          ← Blog
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
              {format(new Date(post.date), 'MMMM d, yyyy')}
            </p>
            <span style={{ color: '#2a2521' }}>·</span>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
              {post.category}
            </p>
          </div>

          <h1
            className="text-4xl md:text-5xl font-semibold uppercase tracking-tight leading-tight mb-6"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            {post.title}
          </h1>

          <p className="text-base leading-8" style={{ color: '#6b6560' }}>
            {post.excerpt}
          </p>
        </div>

        <div style={{ borderTop: '1px solid #1e1b18' }} className="mb-12" />

        {/* Body */}
        <div className="space-y-8">
          {post.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2
                  className="text-xl font-semibold uppercase tracking-widest mb-3"
                  style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                >
                  {section.heading}
                </h2>
              )}
              <p className="text-sm leading-8" style={{ color: '#6b6560' }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-16 p-8"
          style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
        >
          <p
            className="text-xl font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Train with coaching
          </p>
          <p className="text-sm leading-7 mb-6" style={{ color: '#6b6560' }}>
            Get a training plan built around your goal race, plus weekly coaching notes from Tyler every Monday.
          </p>
          <Link
            href="/coaching"
            className="inline-block px-5 py-2.5 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
          >
            View Plans
          </Link>
        </div>
      </article>

      {/* More posts */}
      <div style={{ borderTop: '1px solid #1e1b18' }} />
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-widest mb-8" style={{ color: '#6b6560' }}>
          More posts
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {POSTS.filter(p => p.slug !== post.slug).slice(0, 3).map(p => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group p-6 transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
            >
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
                {format(new Date(p.date), 'MMM d, yyyy')} · {p.category}
              </p>
              <h3
                className="text-lg font-semibold uppercase tracking-widest mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {p.title}
              </h3>
              <p className="text-xs leading-6 line-clamp-2" style={{ color: '#6b6560' }}>
                {p.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid #1e1b18' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="text-sm uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#6b6560' }}
          >
            Tyler Wilks Running
          </span>
          <div className="flex gap-6">
            {[
              { href: '/coaching', label: 'Coaching' },
              { href: '/about', label: 'About' },
              { href: '/blog', label: 'Blog' },
              { href: '/login', label: 'Sign in' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
                style={{ color: '#6b6560' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#2a2521' }}>
            © {new Date().getFullYear()} Tyler Wilks Running
          </p>
        </div>
      </footer>
    </div>
  )
}
