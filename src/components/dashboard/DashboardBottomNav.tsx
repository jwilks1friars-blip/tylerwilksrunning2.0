'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Activity, CalendarDays, MessageSquare, Settings } from 'lucide-react'
import { useUnreadCount } from '@/hooks/useUnreadCount'

interface Props {
  initialUnread: number
  isCoach: boolean
}

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/training', label: 'Training', icon: CalendarDays, exact: false },
  { href: '/dashboard/runs', label: 'Runs', icon: Activity, exact: false },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, exact: false, athleteOnly: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
]

export default function DashboardBottomNav({ initialUnread, isCoach }: Props) {
  const pathname = usePathname()
  const unreadCount = useUnreadCount(initialUnread, isCoach)

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const tabs = TABS.filter(t => !t.athleteOnly || !isCoach)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e8e7e5',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab.href, tab.exact)
        const showBadge = tab.athleteOnly && unreadCount > 0

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
            style={{ minHeight: '56px' }}
          >
            <div className="relative">
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                color={active ? '#fc4c02' : '#9c9895'}
              />
              {showBadge && (
                <span
                  className="absolute flex items-center justify-center font-bold"
                  style={{
                    top: '-5px',
                    right: '-6px',
                    minWidth: '16px',
                    height: '16px',
                    backgroundColor: '#fc4c02',
                    color: '#fff',
                    fontSize: '9px',
                    borderRadius: '8px',
                    padding: '0 3px',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span
              className="text-center"
              style={{
                fontSize: '10px',
                color: active ? '#fc4c02' : '#9c9895',
                fontWeight: active ? 600 : 400,
                lineHeight: 1.2,
              }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
