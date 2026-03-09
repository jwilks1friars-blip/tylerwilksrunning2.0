import Link from 'next/link'
import SignOutButton from '@/components/dashboard/SignOutButton'
import CoachMessagesLink from './messages/CoachMessagesLink'

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0908' }}>

      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 min-h-screen flex flex-col px-6 py-8"
        style={{ borderRight: '1px solid #1e1b18' }}
      >
        <div className="mb-10">
          <Link href="/coach">
            <h1
              className="text-lg font-semibold uppercase tracking-widest leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Tyler Wilks<br />Running
            </h1>
          </Link>
          <p className="text-xs uppercase tracking-widest mt-2" style={{ color: '#fc4c02' }}>
            Coach
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          <Link
            href="/coach"
            className="block py-2 px-3 text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
            style={{ color: '#6b6560' }}
          >
            Athletes
          </Link>
          <CoachMessagesLink />
          <Link
            href="/coach/blog"
            className="block py-2 px-3 text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
            style={{ color: '#6b6560' }}
          >
            Blog
          </Link>
          <Link
            href="/dashboard"
            className="block py-2 px-3 text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
            style={{ color: '#6b6560' }}
          >
            My Dashboard
          </Link>
        </nav>

        <div className="pt-6" style={{ borderTop: '1px solid #1e1b18' }}>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  )
}
