'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CoachMessagesLink() {
  const pathname = usePathname()
  const [unreadTotal, setUnreadTotal] = useState(0)
  const active = pathname.startsWith('/coach/messages')

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-counts')
        if (res.ok) {
          const data = await res.json()
          setUnreadTotal(data.total ?? 0)
        }
      } catch { /* ignore */ }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/coach/messages"
      className="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors"
      style={{
        color: active ? '#1a1917' : '#6b6865',
        backgroundColor: active ? '#f0eeec' : 'transparent',
        fontWeight: active ? 500 : 400,
      }}
    >
      <div className="flex items-center gap-3">
        <MessageSquare size={16} strokeWidth={active ? 2 : 1.5} />
        <span>Messages</span>
      </div>
      {unreadTotal > 0 && (
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: '#fc4c02', color: '#fff', fontSize: '10px', minWidth: '18px', textAlign: 'center' }}
        >
          {unreadTotal}
        </span>
      )}
    </Link>
  )
}
