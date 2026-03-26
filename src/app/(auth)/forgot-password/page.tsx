'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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
            Reset Password
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: '#7fbf7f' }}>
              Check your email — we sent a reset link to <strong>{email}</strong>.
            </p>
            <p className="text-xs" style={{ color: '#6b6560' }}>
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false) }}
                className="underline"
                style={{ color: '#e8e0d4' }}
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-center mb-6" style={{ color: '#6b6560' }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-widest mb-2"
                style={{ color: '#e8e0d4' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm outline-none focus:ring-1 transition-all"
                style={inputStyle}
                placeholder="you@example.com"
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
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs" style={{ color: '#6b6560' }}>
          <Link href="/login" className="underline" style={{ color: '#e8e0d4' }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
