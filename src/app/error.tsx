'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error-tracking service in production
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#0a0908' }}
    >
      <p
        className="text-8xl md:text-[120px] font-semibold uppercase tracking-widest mb-4 leading-none"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1e1b18' }}
      >
        500
      </p>
      <h1
        className="text-2xl md:text-3xl font-semibold uppercase tracking-widest mb-4"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
      >
        Something went wrong
      </h1>
      <p className="text-sm mb-10 max-w-sm" style={{ color: '#6b6560' }}>
        An unexpected error occurred. Try again, or contact support if the problem persists.
        {error.digest && (
          <span className="block mt-2 text-xs font-mono" style={{ color: '#3a3633' }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#6b6560' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
