'use client'

import { useState } from 'react'

export default function InviteAthleteForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    goalRace: '',
    goalTime: '',
    experience: '',
    weeklyMiles: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/coach/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
    } else {
      setSuccess(true)
      setForm({ fullName: '', email: '', goalRace: '', goalTime: '', experience: '', weeklyMiles: '' })
    }
  }

  function handleClose() {
    setOpen(false)
    setSuccess(false)
    setError('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
      >
        Add Athlete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(10,9,8,0.85)' }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md p-8"
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
            onClick={e => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-4">
                <p
                  className="text-2xl font-semibold uppercase tracking-widest mb-3"
                  style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                >
                  Invite Sent
                </p>
                <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
                  {form.email || 'The athlete'} will receive an email with a link to access their dashboard.
                </p>
                <button
                  onClick={handleClose}
                  className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
                  style={{ color: '#6b6560' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p
                    className="text-xl font-semibold uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                  >
                    Add Athlete
                  </p>
                  <button
                    onClick={handleClose}
                    className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
                    style={{ color: '#6b6560' }}
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>
                        Full Name *
                      </label>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                        style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
                        placeholder="Jane Smith"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>
                        Email *
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                        style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
                        placeholder="jane@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>
                        Goal Race
                      </label>
                      <input
                        name="goalRace"
                        value={form.goalRace}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                        style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
                        placeholder="Boston Marathon"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>
                        Goal Time
                      </label>
                      <input
                        name="goalTime"
                        value={form.goalTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                        style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
                        placeholder="3:30:00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>
                        Experience
                      </label>
                      <select
                        name="experience"
                        value={form.experience}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 text-sm bg-[#141210] outline-none"
                        style={{ border: '1px solid #2a2521', color: form.experience ? '#f5f2ee' : '#6b6560' }}
                      >
                        <option value="">Select</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>
                        Weekly Miles
                      </label>
                      <input
                        name="weeklyMiles"
                        type="number"
                        value={form.weeklyMiles}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                        style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs" style={{ color: '#fc4c02' }}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50 mt-2"
                    style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
                  >
                    {loading ? 'Sending Invite...' : 'Add Athlete & Send Invite'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
