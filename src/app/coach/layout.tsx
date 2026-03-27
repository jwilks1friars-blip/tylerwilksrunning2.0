import Link from 'next/link'
import { Zap, Users, MessageSquare, BookOpen, LayoutDashboard } from 'lucide-react'
import SignOutButton from '@/components/dashboard/SignOutButton'
import CoachMessagesLink from './messages/CoachMessagesLink'
import CoachMobileNav from '@/components/coach/CoachMobileNav'

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f4f2' }}>

      {/* Mobile nav */}
      <CoachMobileNav />

      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex w-60 shrink-0 min-h-screen flex-col"
        style={{ borderRight: '1px solid #e8e7e5', backgroundColor: '#ffffff' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-14 shrink-0"
          style={{ borderBottom: '1px solid #e8e7e5' }}
        >
          <div
            className="w-7 h-7 flex items-center justify-center rounded-md shrink-0"
            style={{ backgroundColor: '#fc4c02' }}
          >
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <Link href="/coach">
            <span
              className="text-sm font-semibold uppercase tracking-widest leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
            >
              Tyler Wilks<br />Running
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-6">
          <div>
            <p className="text-xs px-3 mb-1.5 font-semibold tracking-widest" style={{ color: '#c8c4c0' }}>
              COACH
            </p>
            <div className="space-y-0.5">
              <Link
                href="/coach"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0eeec]"
                style={{ color: '#6b6865' }}
              >
                <Users size={16} strokeWidth={1.5} />
                <span>Athletes</span>
              </Link>
              <CoachMessagesLink />
              <Link
                href="/coach/blog"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0eeec]"
                style={{ color: '#6b6865' }}
              >
                <BookOpen size={16} strokeWidth={1.5} />
                <span>Blog</span>
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs px-3 mb-1.5 font-semibold tracking-widest" style={{ color: '#c8c4c0' }}>
              ATHLETE
            </p>
            <div className="space-y-0.5">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0eeec]"
                style={{ color: '#6b6865' }}
              >
                <LayoutDashboard size={16} strokeWidth={1.5} />
                <span>My Dashboard</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid #e8e7e5' }}>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  )
}
