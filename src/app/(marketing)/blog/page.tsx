import Link from 'next/link'
import Image from 'next/image'
import { fetchPostsPaginated, BLOG_PAGE_SIZE } from '@/lib/blog'
import { format } from 'date-fns'
import Pagination from '@/components/ui/Pagination'

export const revalidate = 60

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10))
  const { posts, total } = await fetchPostsPaginated(currentPage)
  const totalPages = Math.ceil(total / BLOG_PAGE_SIZE)

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6b6560' }}>
          Blog
        </p>
        <h1
          className="text-6xl md:text-8xl font-semibold uppercase tracking-tight leading-none"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Training &<br />Racing
        </h1>
      </section>

      <div className="relative h-64 md:h-96 w-full">
        <Image
          src="/477999289.jpg"
          alt="Race start"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,9,8,0.5)' }} />
      </div>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="divide-y" style={{ borderColor: '#1e1b18' }}>
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col md:flex-row md:items-start gap-4 md:gap-12 py-10 transition-opacity hover:opacity-80"
            >
              {/* Date + category */}
              <div className="shrink-0 md:w-40">
                <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
                  {format(new Date(post.date), 'MMM d, yyyy')}
                </p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#2a2521' }}>
                  {post.category}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2
                  className="text-2xl font-semibold uppercase tracking-widest mb-3 leading-tight"
                  style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                >
                  {post.title}
                </h2>
                <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                  {post.excerpt}
                </p>
                <p className="text-xs uppercase tracking-widest mt-4" style={{ color: '#e8e0d4' }}>
                  Read →
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/blog"
        />
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
