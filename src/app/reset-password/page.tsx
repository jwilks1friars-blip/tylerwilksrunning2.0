'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard?reset=1')
    }
  }

  const inputStyle = {
    backgroundColor: '#141210',
    border: '1px solid #2a2521',
    color: '#f5f2ee',
    borderRadius: '2px',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0908' }}>
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1
            className="text-4xl font-semibold uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Tyler Wilks
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: '#e8e0d4' }}>
            New Password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#e8e0d4' }}
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none focus:ring-1 transition-all"
              style={inputStyle}
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#e8e0d4' }}
            >
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none focus:ring-1 transition-all"
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs py-2" style={{ color: '#e8a0a0' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
          >
            {loading ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
