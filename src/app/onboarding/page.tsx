'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  backgroundColor: '#ffffff',
  border: '1px solid #e0deda',
  borderRadius: '4px',
  color: '#1a1917',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6b6865',
  marginBottom: '6px',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    experience: '',
    weekly_miles: '',
    goal_race: '',
    goal_time: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f5f4f2' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 flex items-center justify-center rounded-md" style={{ backgroundColor: '#fc4c02' }}>
            <Zap size={15} color="white" strokeWidth={2.5} />
          </div>
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Tyler Wilks Running
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-0.5 flex-1 rounded-full transition-all"
              style={{ backgroundColor: s <= step ? '#1a1917' : '#e0deda' }}
            />
          ))}
        </div>

        {/* Step 1 — About you */}
        {step === 1 && (
          <div>
            <h1
              className="text-3xl font-semibold uppercase tracking-widest mb-2"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
            >
              Welcome
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6865' }}>
              Let's get your profile set up so your coach can build your plan.
            </p>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Your Name</label>
                <input
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Experience Level</label>
                <select
                  value={form.experience}
                  onChange={e => set('experience', e.target.value)}
                  style={{ ...inputStyle, backgroundColor: '#ffffff' }}
                >
                  <option value="">Select level…</option>
                  <option value="beginner">Beginner — less than 1 year running</option>
                  <option value="intermediate">Intermediate — 1–3 years</option>
                  <option value="advanced">Advanced — 3+ years, racing regularly</option>
                  <option value="elite">Elite — competitive athlete</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Current Weekly Mileage</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={form.weekly_miles}
                    onChange={e => set('weekly_miles', e.target.value)}
                    placeholder="25"
                    style={{ ...inputStyle, width: 'auto', flex: 1 }}
                  />
                  <span className="text-xs uppercase tracking-widest shrink-0" style={{ color: '#9c9895' }}>mi / week</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.full_name.trim()) { setError('Please enter your name.'); return }
                if (!form.experience) { setError('Please select your experience level.'); return }
                setError('')
                setStep(2)
              }}
              className="mt-8 w-full py-3 text-sm font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1a1917', color: '#ffffff' }}
            >
              Continue →
            </button>
            {error && <p className="text-xs mt-3 text-center" style={{ color: '#e85555' }}>{error}</p>}
          </div>
        )}

        {/* Step 2 — Race goal */}
        {step === 2 && (
          <div>
            <h1
              className="text-3xl font-semibold uppercase tracking-widest mb-2"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
            >
              Your Goal
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6865' }}>
              What race are you training for? Your coach will use this to build your plan.
            </p>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Goal Race</label>
                <input
                  value={form.goal_race}
                  onChange={e => set('goal_race', e.target.value)}
                  placeholder="Boston Marathon, NYC Half Marathon…"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Goal Time <span style={{ color: '#c8c4c0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span></label>
                <input
                  value={form.goal_time}
                  onChange={e => set('goal_time', e.target.value)}
                  placeholder="3:30:00"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 text-sm uppercase tracking-widest rounded transition-colors hover:text-[#1a1917]"
                style={{ color: '#9c9895', border: '1px solid #e0deda' }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!form.goal_race.trim()) { setError('Please enter your goal race.'); return }
                  setError('')
                  setStep(3)
                }}
                className="flex-1 py-3 text-sm font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#1a1917', color: '#ffffff' }}
              >
                Continue →
              </button>
            </div>
            {error && <p className="text-xs mt-3 text-center" style={{ color: '#e85555' }}>{error}</p>}
          </div>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && (
          <div>
            <h1
              className="text-3xl font-semibold uppercase tracking-widest mb-2"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
            >
              You're set
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6865' }}>
              Here's what your coach will see. You can update this anytime in Settings.
            </p>

            <div className="space-y-px rounded-lg overflow-hidden" style={{ border: '1px solid #ebebea' }}>
              {[
                { label: 'Name', value: form.full_name },
                { label: 'Experience', value: form.experience },
                { label: 'Weekly Miles', value: form.weekly_miles ? `${form.weekly_miles} mi/wk` : '—' },
                { label: 'Goal Race', value: form.goal_race },
                { label: 'Goal Time', value: form.goal_time || '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #ebebea' }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>{row.label}</span>
                  <span className="text-sm font-medium" style={{ color: '#1a1917' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 text-sm uppercase tracking-widest rounded transition-colors hover:text-[#1a1917]"
                style={{ color: '#9c9895', border: '1px solid #e0deda' }}
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 py-3 text-sm font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#1a1917', color: '#ffffff' }}
              >
                {saving ? 'Saving…' : 'Go to Dashboard →'}
              </button>
            </div>
            {error && <p className="text-xs mt-3 text-center" style={{ color: '#e85555' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
