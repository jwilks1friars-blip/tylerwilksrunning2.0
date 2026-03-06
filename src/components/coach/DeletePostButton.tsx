'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/blog/${slug}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs uppercase tracking-widest disabled:opacity-40"
          style={{ color: '#e87070' }}
        >
          {deleting ? '…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs uppercase tracking-widest"
          style={{ color: '#6b6560' }}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs uppercase tracking-widest transition-colors hover:text-[#e87070]"
      style={{ color: '#2a2521' }}
    >
      Delete
    </button>
  )
}
