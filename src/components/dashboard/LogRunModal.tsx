'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { logRun } from '@/app/dashboard/actions'

const inputStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0deda',
  borderRadius: '4px',
  color: '#1a1917',
  fontSize: '14px',
  padding: '8px 10px',
  width: '100%',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6b6865',
  marginBottom: '5px',
}

export default function LogRunModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await logRun(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      formRef.current?.reset()
      router.refresh()
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

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={labelStyle}>Activity Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Morning Run"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Distance (mi) *</label>
                  <input
                    name="distance"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="6.2"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duration * <span style={{ color: '#c8c4c0', textTransform: 'none', fontSize: '10px' }}>MM:SS or HH:MM:SS</span></label>
                  <input
                    name="duration"
                    type="text"
                    placeholder="55:00"
                    required
                    pattern="\d+:\d{2}(:\d{2})?"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Date & Time *</label>
                  <input
                    name="date"
                    type="datetime-local"
                    defaultValue={today}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    name="activity_type"
                    defaultValue="Run"
                    style={{ ...inputStyle, backgroundColor: '#ffffff' }}
                  >
                    <option value="Run">Run</option>
                    <option value="TrailRun">Trail Run</option>
                    <option value="Walk">Walk</option>
                    <option value="Hike">Hike</option>
                    <option value="Ride">Ride</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#e85555' }}>{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-colors hover:bg-[#f5f4f2]"
                  style={{ color: '#6b6865', border: '1px solid #e0deda' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#1a1917', color: '#ffffff', border: 'none' }}
                >
                  {loading ? 'Saving…' : 'Save Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
