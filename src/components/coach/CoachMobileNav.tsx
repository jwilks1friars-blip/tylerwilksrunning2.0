'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Users, MessageSquare, BookOpen, LayoutDashboard, Zap } from 'lucide-react'
import CoachMessagesLink from '@/app/coach/messages/CoachMessagesLink'
import SignOutButton from '@/components/dashboard/SignOutButton'

export default function CoachMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-5 h-14"
        style={{ borderBottom: '1px solid #e8e7e5', backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 flex items-center justify-center rounded-md" style={{ backgroundColor: '#fc4c02' }}>
            <Zap size={12} color="white" strokeWidth={2.5} />
          </div>
          <Link href="/coach">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
              Tyler Wilks Running
            </span>
          </Link>
        </div>
        <button onClick={() => setOpen(true)} className="p-1" style={{ color: '#9c9895' }} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e8e7e5' }}
      >
        <div className="flex items-center justify-between px-5 h-14 shrink-0" style={{ borderBottom: '1px solid #e8e7e5' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center rounded-md" style={{ backgroundColor: '#fc4c02' }}>
              <Zap size={12} color="white" strokeWidth={2.5} />
            </div>
            <Link href="/coach" onClick={() => setOpen(false)}>
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                Tyler Wilks Running
              </span>
            </Link>
          </div>
          <button onClick={() => setOpen(false)} className="p-1" style={{ color: '#9c9895' }} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          <div>
            <p className="text-xs px-3 mb-1.5 font-semibold tracking-widest" style={{ color: '#c8c4c0' }}>COACH</p>
            <div className="space-y-0.5">
              <Link href="/coach" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0eeec]" style={{ color: '#6b6865' }}>
                <Users size={16} strokeWidth={1.5} /><span>Athletes</span>
              </Link>
              <CoachMessagesLink />
              <Link href="/coach/blog" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0eeec]" style={{ color: '#6b6865' }}>
                <BookOpen size={16} strokeWidth={1.5} /><span>Blog</span>
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs px-3 mb-1.5 font-semibold tracking-widest" style={{ color: '#c8c4c0' }}>ATHLETE</p>
            <div className="space-y-0.5">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0eeec]" style={{ color: '#6b6865' }}>
                <LayoutDashboard size={16} strokeWidth={1.5} /><span>My Dashboard</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid #e8e7e5' }}>
          <SignOutButton />
        </div>
      </div>
    </>
  )
}
