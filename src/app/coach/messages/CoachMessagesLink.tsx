'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CoachMessagesLink() {
  const [unreadTotal, setUnreadTotal] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-counts')
        if (res.ok) {
          const data = await res.json()
          setUnreadTotal(data.total ?? 0)
        }
      } catch {
        // ignore
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/coach/messages"
      className="flex items-center justify-between py-2 px-3 text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
      style={{ color: '#6b6560' }}
    >
      <span>Messages</span>
      {unreadTotal > 0 && (
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: '#fc4c02', color: '#fff', minWidth: '20px', textAlign: 'center' }}
        >
          {unreadTotal}
        </span>
      )}
    </Link>
  )
}
