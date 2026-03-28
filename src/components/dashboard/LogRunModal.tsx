'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

const ACTIVITY_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike', 'Ride']

// Parse "M:SS" or "MM:SS" or "H:MM:SS" → total seconds, returns null if invalid
function parsePaceToSecs(pace: string): number | null {
  const parts = pace.trim().split(':').map(Number)
  if (parts.some(isNaN) || parts.length < 2 || parts.length > 3) return null
  if (parts.length === 2) {
    const [min, sec] = parts
    if (sec < 0 || sec >= 60) return null
    return min * 60 + sec
  }
  const [hr, min, sec] = parts
  if (min >= 60 || sec < 0 || sec >= 60) return null
  return hr * 3600 + min * 60 + sec
}

function formatDuration(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function defaultDateTimeLocal(): string {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString().slice(0, 16)
}

const inputStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0deda',
  borderRadius: '4px',
  color: '#1a1917',
  fontSize: '14px',
  padding: '8px 10px',
  width: '100%',
  outline: 'none',
} as const

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6b6865',
  marginBottom: '5px',
}

export default function LogRunModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [distance, setDistance] = useState('')
  const [pace, setPace] = useState('')
  const [startedAt, setStartedAt] = useState(defaultDateTimeLocal)
  const [activityType, setActivityType] = useState('Run')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [calculatedTime, setCalculatedTime] = useState<string | null>(null)

  useEffect(() => {
    const dist = parseFloat(distance)
    const secsPerMile = parsePaceToSecs(pace)
    if (dist > 0 && secsPerMile && secsPerMile > 0) {
      setCalculatedTime(formatDuration(Math.round(dist * secsPerMile)))
    } else {
      setCalculatedTime(null)
    }
  }, [distance, pace])

  async function handleSave() {
    setError('')
    const dist = parseFloat(distance)
    if (!dist || dist <= 0) { setError('Enter a valid distance.'); return }
    if (!parsePaceToSecs(pace)) { setError('Enter pace as MM:SS or H:MM:SS.'); return }
    if (!startedAt) { setError('Enter a date and time.'); return }

    setSaving(true)
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        distance_miles: dist,
        pace,
        started_at: new Date(startedAt).toISOString(),
        activity_type: activityType,
      }),
    })
    setSaving(false)

    if (res.ok) {
      router.refresh()
      setOpen(false)
      setName(''); setDistance(''); setPace(''); setStartedAt(defaultDateTimeLocal()); setActivityType('Run')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#f0eeec', color: '#3a3733', border: '1px solid #e8e7e5', borderRadius: '4px' }}
      >
        <Plus size={13} />
        Log Run
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-md mx-4 p-6 rounded-lg"
            style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
              >
                Log a Run
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded transition-colors hover:bg-[#f5f4f2]"
                style={{ color: '#9c9895' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Activity Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Morning Run"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Distance (mi) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={distance}
                    onChange={e => setDistance(e.target.value)}
                    placeholder="6.2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Pace (min/mi) *{' '}
                    <span style={{ color: '#c8c4c0', textTransform: 'none', fontSize: '10px' }}>MM:SS</span>
                  </label>
                  <input
                    value={pace}
                    onChange={e => setPace(e.target.value)}
                    placeholder="7:30"
                    style={inputStyle}
                  />
                </div>
              </div>

              {calculatedTime && (
                <p className="text-xs" style={{ color: '#6b6865' }}>
                  Total time:{' '}
                  <span style={{ color: '#1a1917', fontWeight: 500 }}>{calculatedTime}</span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={startedAt}
                    onChange={e => setStartedAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    style={{ ...inputStyle, backgroundColor: '#ffffff' }}
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs" style={{ color: '#e85555' }}>{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-colors hover:bg-[#f5f4f2]"
                  style={{ color: '#6b6865', border: '1px solid #e0deda' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#1a1917', color: '#ffffff' }}
                >
                  {saving ? 'Saving…' : 'Save Run'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
