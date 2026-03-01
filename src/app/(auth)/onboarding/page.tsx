'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'Running less than 1 year' },
  { value: 'intermediate', label: 'Intermediate', description: '1–4 years, some races' },
  { value: 'advanced', label: 'Advanced', description: '4+ years, competitive racing' },
] as const

const RACE_OPTIONS = [
  '5K', '10K', 'Half Marathon', 'Marathon', 'Ultra Marathon',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [goalRace, setGoalRace] = useState('')
  const [goalTime, setGoalTime] = useState('')
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('')
  const [weeklyMiles, setWeeklyMiles] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        goal_race: goalRace,
        goal_time: goalTime,
        experience: experience || null,
        weekly_miles: weeklyMiles ? parseInt(weeklyMiles) : 0,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const inputStyle = {
    backgroundColor: '#141210',
    border: '1px solid #2a2521',
    color: '#f5f2ee',
    borderRadius: '2px',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0908' }}>
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1
            className="text-4xl font-semibold uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Let&apos;s Get Started
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: '#e8e0d4' }}>
            Tell us about your goals
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-10">
          {[1, 2].map(s => (
            <div
              key={s}
              className="h-px flex-1 transition-all duration-300"
              style={{ backgroundColor: s <= step ? '#e8e0d4' : '#2a2521' }}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* Step 1 — Race goal */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: '#e8e0d4' }}>
                  Goal Race
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RACE_OPTIONS.map(race => (
                    <button
                      key={race}
                      type="button"
                      onClick={() => setGoalRace(race)}
                      className="py-3 px-4 text-sm text-left transition-all"
                      style={{
                        ...inputStyle,
                        border: goalRace === race ? '1px solid #e8e0d4' : '1px solid #2a2521',
                        color: goalRace === race ? '#f5f2ee' : '#6b6560',
                      }}
                    >
                      {race}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Other…"
                    value={RACE_OPTIONS.includes(goalRace as any) ? '' : goalRace}
                    onChange={e => setGoalRace(e.target.value)}
                    className="py-3 px-4 text-sm outline-none col-span-2"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#e8e0d4' }}>
                  Goal Time <span style={{ color: '#6b6560' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={goalTime}
                  onChange={e => setGoalTime(e.target.value)}
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                  placeholder="e.g. 3:30:00"
                />
              </div>

              <button
                type="button"
                disabled={!goalRace}
                onClick={() => setStep(2)}
                className="w-full py-3 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-30"
                style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2 — Experience + mileage */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: '#e8e0d4' }}>
                  Experience Level
                </label>
                <div className="space-y-2">
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExperience(opt.value)}
                      className="w-full py-3 px-4 text-left transition-all"
                      style={{
                        ...inputStyle,
                        border: experience === opt.value ? '1px solid #e8e0d4' : '1px solid #2a2521',
                      }}
                    >
                      <span className="text-sm block" style={{ color: '#f5f2ee' }}>{opt.label}</span>
                      <span className="text-xs" style={{ color: '#6b6560' }}>{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#e8e0d4' }}>
                  Current Weekly Mileage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={weeklyMiles}
                    onChange={e => setWeeklyMiles(e.target.value)}
                    className="w-full px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                    placeholder="0"
                  />
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest"
                    style={{ color: '#6b6560' }}
                  >
                    miles / wk
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#e8a0a0' }}>{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 text-xs uppercase tracking-widest transition-opacity"
                  style={{ border: '1px solid #2a2521', color: '#6b6560', borderRadius: '2px' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !experience}
                  className="flex-1 py-3 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-30"
                  style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
                >
                  {loading ? 'Saving…' : 'Go to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
