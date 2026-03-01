'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateInsightButton({ athleteId }: { athleteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: athleteId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to generate insight')
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
        style={{ border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }}
      >
        {loading ? 'Generating…' : 'Generate Insight'}
      </button>
      {error && (
        <p className="text-xs mt-2" style={{ color: '#e8a0a0' }}>{error}</p>
      )}
    </div>
  )
}
