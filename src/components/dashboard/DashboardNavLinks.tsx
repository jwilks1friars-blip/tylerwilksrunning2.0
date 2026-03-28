'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DASHBOARD_NAV_LINKS } from '@/lib/nav'
import DashboardMessagesLink from '@/app/dashboard/messages/DashboardMessagesLink'

interface Props {
  initialUnread: number
  isCoach: boolean
}

export default function DashboardNavLinks({ initialUnread, isCoach }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  return (
    <nav className="space-y-1 flex-1">
      {DASHBOARD_NAV_LINKS.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className="block py-2 px-3 text-xs uppercase tracking-widest rounded transition-colors hover:text-[#f5f2ee]"
          style={{ color: isActive(link.href) ? '#f5f2ee' : '#6b6560' }}
        >
          {link.label}
        </Link>
      ))}

      {!isCoach && (
        <DashboardMessagesLink
          initialUnread={initialUnread}
          active={pathname === '/dashboard/messages'}
        />
      )}

      {isCoach && (
        <>
          <div className="my-3" style={{ borderTop: '1px solid #1e1b18' }} />
          <Link
            href="/coach"
            className="block py-2 px-3 text-xs uppercase tracking-widest rounded transition-colors hover:text-[#f5f2ee]"
            style={{ color: pathname.startsWith('/coach') ? '#f5f2ee' : '#6b6560' }}
          >
            Coach Dashboard
          </Link>
        </>
      )}
    </nav>
  )
}
