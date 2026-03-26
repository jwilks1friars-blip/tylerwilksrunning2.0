export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/dashboard/SignOutButton'
import DashboardMobileNav from '@/components/dashboard/DashboardMobileNav'
import DashboardSidebarNav from '@/components/dashboard/DashboardSidebarNav'
import { Bell, Search, Settings, Zap } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isCoach = user?.id === process.env.COACH_USER_ID

  let unreadCount = 0
  if (user && !isCoach) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null)
    unreadCount = count ?? 0
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const fullName = profile?.full_name ?? 'Athlete'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0908' }}>

      {/* Mobile nav */}
      <DashboardMobileNav initialUnread={unreadCount} isCoach={isCoach} />

      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex w-60 shrink-0 min-h-screen flex-col"
        style={{ borderRight: '1px solid #1e1b18', backgroundColor: '#0a0908' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-14 shrink-0"
          style={{ borderBottom: '1px solid #1e1b18' }}
        >
          <div
            className="w-7 h-7 flex items-center justify-center rounded-md shrink-0"
            style={{ backgroundColor: '#fc4c02' }}
          >
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <Link href="/dashboard">
            <span
              className="text-sm font-semibold uppercase tracking-widest leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Tyler Wilks<br />Running
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <DashboardSidebarNav initialUnread={unreadCount} isCoach={isCoach} />

        {/* User footer */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: '1px solid #1e1b18' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#1e1b18', color: '#e8e0d4' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#e8e0d4' }}>{fullName}</p>
              <p className="text-xs" style={{ color: '#6b6560' }}>Athlete</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Right side: header + content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Top header bar — desktop only */}
        <header
          className="hidden md:flex items-center justify-between px-8 h-14 shrink-0 sticky top-0 z-10"
          style={{ borderBottom: '1px solid #1e1b18', backgroundColor: '#0a0908' }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b6560' }}>
            <Link href="/dashboard" className="hover:text-[#f5f2ee] transition-colors">
              Dashboard
            </Link>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
            style={{ backgroundColor: '#0f0d0b', border: '1px solid #1e1b18', color: '#6b6560', width: '220px' }}
          >
            <Search size={13} />
            <span>Search...</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button
              className="relative transition-colors hover:text-[#e8e0d4]"
              style={{ color: '#6b6560' }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: '#fc4c02', color: '#fff', fontSize: '9px' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <Link href="/dashboard/settings">
              <button
                className="transition-colors hover:text-[#e8e0d4]"
                style={{ color: '#6b6560' }}
              >
                <Settings size={17} />
              </button>
            </Link>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: '#1e1b18', color: '#e8e0d4' }}
              >
                {initials}
              </div>
              <div>
                <p className="text-xs font-medium leading-tight" style={{ color: '#e8e0d4' }}>{fullName}</p>
                <p className="text-xs leading-tight" style={{ color: '#6b6560' }}>Athlete</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
