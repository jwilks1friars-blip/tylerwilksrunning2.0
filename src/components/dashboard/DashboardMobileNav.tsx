import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Props {
  initialUnread: number
  isCoach: boolean
}

// Mobile top brand bar — navigation is handled by DashboardBottomNav
export default function DashboardMobileNav({ initialUnread: _initialUnread, isCoach: _isCoach }: Props) {
  return (
    <div
      className="md:hidden flex items-center px-5 h-14 shrink-0"
      style={{ borderBottom: '1px solid #e8e7e5', backgroundColor: '#ffffff' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 flex items-center justify-center rounded-md"
          style={{ backgroundColor: '#fc4c02' }}
        >
          <Zap size={12} color="white" strokeWidth={2.5} />
        </div>
        <Link href="/dashboard">
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Tyler Wilks Running
          </span>
        </Link>
      </div>
    </div>
  )
}
