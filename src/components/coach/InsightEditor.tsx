'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Insight {
  id: string
  content: string
  week_start: string
  approved: boolean
}

interface Props {
  insight: Insight
  athleteId: string
}

export default function InsightEditor({ insight, athleteId }: Props) {
  const router = useRouter()
  const [content, setContent] = useState(insight.content)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(insight.approved)

  async function handleApprove() {
    setSaving(true)
    const res = await fetch(`/api/insights/${insight.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (res.ok) {
      setSaved(true)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div
      className="p-5"
      style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
            Week of {new Date(insight.week_start).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
          {saved && (
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: '#22c55e' }}>
              ✓ Approved
            </p>
          )}
        </div>

        {!saved && (
          <button
            onClick={handleApprove}
            disabled={saving || !content.trim()}
            className="px-4 py-2 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#1a1917', color: '#ffffff', borderRadius: '2px' }}
          >
            {saving ? 'Saving…' : 'Approve & Send'}
          </button>
        )}
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={saved}
        rows={8}
        className="w-full text-sm leading-7 outline-none resize-none disabled:opacity-70"
        style={{
          backgroundColor: 'transparent',
          color: '#1a1917',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
