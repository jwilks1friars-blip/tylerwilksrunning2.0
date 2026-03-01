'use client'

import { useState } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '/coaching', label: 'Coaching' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ borderBottom: '1px solid #1e1b18', backgroundColor: '#0a0908' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <span
            className="text-base font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Tyler Wilks Running
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
              style={{ color: '#6b6560' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
            style={{ color: '#6b6560' }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-px transition-all"
            style={{ backgroundColor: '#f5f2ee', transform: open ? 'translateY(4px) rotate(45deg)' : 'none' }}
          />
          <span
            className="block w-5 h-px transition-all"
            style={{ backgroundColor: '#f5f2ee', opacity: open ? 0 : 1 }}
          />
          <span
            className="block w-5 h-px transition-all"
            style={{ backgroundColor: '#f5f2ee', transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none' }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-6 pb-6 pt-2 space-y-4"
          style={{ borderTop: '1px solid #1e1b18' }}
        >
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-xs uppercase tracking-widest"
              style={{ color: '#6b6560' }}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-widest"
              style={{ color: '#6b6560' }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="inline-block px-4 py-2 text-xs uppercase tracking-widest font-medium text-center"
              style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
