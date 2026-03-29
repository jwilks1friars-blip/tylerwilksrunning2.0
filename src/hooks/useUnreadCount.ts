'use client'

import { useState, useEffect } from 'react'

export function useUnreadCount(initialCount: number, isCoach: boolean): number {
  const [unreadCount, setUnreadCount] = useState(initialCount)

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

  return unreadCount
}
