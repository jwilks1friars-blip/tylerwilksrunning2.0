'use client'

import { Zap, WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#f5f4f2' }}
    >
      {/* Logo */}
      <div
        className="w-14 h-14 flex items-center justify-center rounded-xl mb-6"
        style={{ backgroundColor: '#fc4c02' }}
      >
        <Zap size={28} color="white" strokeWidth={2.5} />
      </div>

      {/* Offline icon */}
      <div className="mb-4" style={{ color: '#c8c4c0' }}>
        <WifiOff size={36} />
      </div>

      <h1
        className="text-2xl font-semibold uppercase tracking-widest mb-3"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
      >
        You&apos;re Offline
      </h1>

      <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: '#6b6865' }}>
        Reconnect to continue training. Your data will sync automatically when you&apos;re back online.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 text-xs font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#1a1917', color: '#ffffff' }}
      >
        Try Again
      </button>
    </div>
  )
}
