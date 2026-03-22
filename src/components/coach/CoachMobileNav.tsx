'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import CoachMessagesLink from '@/app/coach/messages/CoachMessagesLink'
import SignOutButton from '@/components/dashboard/SignOutButton'

export default function CoachMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer when route changes
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #1e1b18', backgroundColor: '#0a0908' }}
      >
        <div>
          <Link href="/coach">
            <h1
              className="text-base font-semibold uppercase tracking-widest leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Tyler Wilks Running
            </h1>
          </Link>
          <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: '#fc4c02' }}>
            Coach
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-1"
          style={{ color: '#6b6560' }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full z-50 w-64 flex flex-col px-6 py-8 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#0a0908', borderRight: '1px solid #1e1b18' }}
      >
        <div className="flex items-start justify-between mb-10">
          <Link href="/coach" onClick={() => setOpen(false)}>
            <h1
              className="text-lg font-semibold uppercase tracking-widest leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Tyler Wilks<br />Running
            </h1>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1"
            style={{ color: '#6b6560' }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs uppercase tracking-widest -mt-8 mb-8 px-3" style={{ color: '#fc4c02' }}>
          Coach
        </p>

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
      </div>
    </>
  )
}
