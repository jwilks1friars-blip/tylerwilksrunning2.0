'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishToggle({ slug, published }: { slug: string; published: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState(published)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const next = !current
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    })
    if (res.ok) {
      setCurrent(next)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
      style={{ color: current ? '#7fbf7f' : '#6b6560' }}
    >
      {current ? 'Live' : 'Draft'}
    </button>
  )
}
