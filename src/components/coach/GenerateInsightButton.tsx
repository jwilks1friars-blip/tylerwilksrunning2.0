'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function GenerateInsightButton({ athleteId }: { athleteId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [coachNotes, setCoachNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  async function handleGenerate() {
    setLoading(true)

    const res = await fetch('/api/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: athleteId,
        coachNotes: coachNotes.trim() || undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast(data.error ?? 'Failed to generate insight', 'error')
    } else {
      toast('Insight generated!', 'success')
      setCoachNotes('')
      setShowNotes(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {/* Coach notes — expands when toggled */}
      {showNotes && (
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6560' }}>
            Your Notes for Claude
          </label>
          <textarea
            value={coachNotes}
            onChange={e => setCoachNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm bg-transparent outline-none resize-none leading-relaxed"
            style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
            placeholder={
              'Add context you want woven into the note — e.g.\n' +
              '"She mentioned knee tightness on Thursday, worth addressing"\n' +
              '"Crushed the tempo — really dialed in pacing this week"'
            }
            autoFocus
          />
          <p className="text-xs mt-1" style={{ color: '#3a3633' }}>
            Claude will incorporate this into the generated note naturally.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          {loading ? 'Generating…' : 'Generate Insight'}
        </button>

        <button
          onClick={() => setShowNotes(s => !s)}
          className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
          style={{ color: coachNotes.trim() ? '#e8e0d4' : '#6b6560' }}
        >
          {showNotes
            ? 'Hide Notes'
            : coachNotes.trim()
              ? '✓ Notes Added'
              : '+ Add Your Notes'}
        </button>
      </div>

    </div>
  )
}
