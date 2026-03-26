export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/dashboard/SignOutButton'
import DashboardMessagesLink from './messages/DashboardMessagesLink'
import DashboardMobileNav from '@/components/dashboard/DashboardMobileNav'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/runs', label: 'Runs' },
  { href: '/dashboard/training', label: 'Training' },
  { href: '/dashboard/races', label: 'Races' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isCoach = user?.id === process.env.COACH_USER_ID

  // Fetch unread count server-side for initial render
  let unreadCount = 0
  if (user && !isCoach) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null)
    unreadCount = count ?? 0
  }

  return (
    <div className="min-h-screen md:flex flex-col" style={{ backgroundColor: '#0a0908' }}>

      {/* Mobile nav (hamburger) */}
      <DashboardMobileNav initialUnread={unreadCount} isCoach={isCoach} />

      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex w-52 shrink-0 min-h-screen flex-col px-6 py-8"
        style={{ borderRight: '1px solid #1e1b18' }}
      >
        <div className="mb-10">
          <Link href="/dashboard">
            <h1
              className="text-lg font-semibold uppercase tracking-widest leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Tyler Wilks<br />Running
            </h1>
          </Link>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 px-3 text-xs uppercase tracking-widest rounded transition-colors hover:text-[#f5f2ee]"
              style={{ color: '#6b6560' }}
            >
              {link.label}
            </Link>
          ))}

          {!isCoach && (
            <DashboardMessagesLink initialUnread={unreadCount} />
          )}

          {isCoach && (
            <>
              <div className="my-3" style={{ borderTop: '1px solid #1e1b18' }} />
              <Link
                href="/coach"
                className="block py-2 px-3 text-xs uppercase tracking-widest rounded transition-colors hover:text-[#f5f2ee]"
                style={{ color: '#6b6560' }}
              >
                Coach Dashboard
              </Link>
            </>
          )}
        </nav>

        <div className="pt-6" style={{ borderTop: '1px solid #1e1b18' }}>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-10 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
