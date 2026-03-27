'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Activity, CalendarDays, Settings, MessageSquare, UserCheck } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/runs', label: 'Runs', icon: Activity, exact: false },
    ],
  },
  {
    label: 'TRAINING',
    links: [
      { href: '/dashboard/training', label: 'Training Plan', icon: CalendarDays, exact: false },
    ],
  },
  {
    label: 'ACCOUNT',
    links: [
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
    ],
  },
]

interface Props {
  initialUnread: number
  isCoach: boolean
}

export default function DashboardSidebarNav({ initialUnread, isCoach }: Props) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(initialUnread)

  useEffect(() => {
    if (isCoach) return
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-counts')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.total ?? 0)
        }
      } catch { /* ignore */ }
    }
    const interval = setInterval(fetchUnread, 15_000)
    return () => clearInterval(interval)
  }, [isCoach])

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p
            className="text-xs px-3 mb-1.5 font-semibold tracking-widest"
            style={{ color: '#c8c4c0' }}
          >
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.links.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href, link.exact)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
                  style={{
                    color: active ? '#1a1917' : '#6b6865',
                    backgroundColor: active ? '#f0eeec' : 'transparent',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* Messages (athlete only) */}
      {!isCoach && (
        <div>
          <p
            className="text-xs px-3 mb-1.5 font-semibold tracking-widest"
            style={{ color: '#c8c4c0' }}
          >
            COACH
          </p>
          <Link
            href="/dashboard/messages"
            className="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors"
            style={{
              color: pathname.startsWith('/dashboard/messages') ? '#1a1917' : '#6b6865',
              backgroundColor: pathname.startsWith('/dashboard/messages') ? '#f0eeec' : 'transparent',
              fontWeight: pathname.startsWith('/dashboard/messages') ? 500 : 400,
            }}
          >
            <div className="flex items-center gap-3">
              <MessageSquare
                size={16}
                strokeWidth={pathname.startsWith('/dashboard/messages') ? 2 : 1.5}
              />
              <span>Messages</span>
            </div>
            {unreadCount > 0 && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#fc4c02', color: '#fff', fontSize: '10px', minWidth: '18px', textAlign: 'center' }}
              >
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Coach link */}
      {isCoach && (
        <div>
          <p
            className="text-xs px-3 mb-1.5 font-semibold tracking-widest"
            style={{ color: '#c8c4c0' }}
          >
            COACH
          </p>
          <Link
            href="/coach"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: '#6b6865' }}
          >
            <UserCheck size={16} strokeWidth={1.5} />
            <span>Coach Dashboard</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
