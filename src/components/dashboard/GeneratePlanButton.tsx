'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function GeneratePlanButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [raceDate, setRaceDate] = useState('')

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/plans/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceDate: raceDate || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast(data.error ?? 'Failed to generate plan', 'error')
      setLoading(false)
      return
    }

    toast('Training plan generated!', 'success')
    router.refresh()
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      <div>
        <label
          className="block text-xs uppercase tracking-widest mb-2"
          style={{ color: '#e8e0d4' }}
        >
          Race Date <span style={{ color: '#6b6560' }}>(optional — defaults to 16 weeks out)</span>
        </label>
        <input
          type="date"
          value={raceDate}
          onChange={e => setRaceDate(e.target.value)}
          className="px-4 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: '#141210',
            border: '1px solid #2a2521',
            color: '#f5f2ee',
            borderRadius: '2px',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
      >
        {loading ? 'Generating plan…' : 'Generate Training Plan'}
      </button>

      {loading && (
        <p className="text-xs" style={{ color: '#6b6560' }}>
          Building your plan with Claude — this takes about 15 seconds…
        </p>
      )}
    </form>
  )
}
