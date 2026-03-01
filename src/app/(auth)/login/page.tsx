'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0908' }}>
      <div className="w-full max-w-sm">

        {/* Logo / heading */}
        <div className="mb-10 text-center">
          <h1
            className="text-4xl font-semibold uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Tyler Wilks
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: '#e8e0d4' }}>
            Running
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              style={{
                backgroundColor: '#141210',
                border: '1px solid #2a2521',
                color: '#f5f2ee',
                borderRadius: '2px',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#e8e0d4' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: '#141210',
                border: '1px solid #2a2521',
                color: '#f5f2ee',
                borderRadius: '2px',
              }}
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
            style={{
              backgroundColor: '#e8e0d4',
              color: '#0a0908',
              borderRadius: '2px',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs" style={{ color: '#6b6560' }}>
          No account?{' '}
          <Link href="/signup" className="underline" style={{ color: '#e8e0d4' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
