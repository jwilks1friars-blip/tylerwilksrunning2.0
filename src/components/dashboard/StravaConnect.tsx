'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Connection {
  strava_athlete_id: number
  connected_at: string
}

interface Props {
  connection: Connection | null
  connectedViaParam: boolean
}

export default function StravaConnect({ connection, connectedViaParam }: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)
  const [justConnected] = useState(connectedViaParam)

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch('/api/strava/disconnect', { method: 'DELETE' })
    router.refresh()
  }

  const labelStyle = {
    color: '#6b6560',
  }

  const cardStyle = {
    backgroundColor: '#141210',
    border: '1px solid #1e1b18',
  }

  if (connection) {
    return (
      <div className="p-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {justConnected && (
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#7fbf7f' }}>
                ✓ Connected successfully
              </p>
            )}
            <div className="flex items-center gap-3 mb-3">
              {/* Strava orange dot */}
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fc4c02' }} />
              <p className="text-sm font-medium" style={{ color: '#f5f2ee' }}>
                Strava Connected
              </p>
            </div>
            <p className="text-xs" style={labelStyle}>
              Athlete ID: {connection.strava_athlete_id}
            </p>
            <p className="text-xs mt-1" style={labelStyle}>
              Connected {new Date(connection.connected_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            <p className="text-xs mt-3" style={labelStyle}>
              New runs will sync automatically via webhook.
            </p>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40 shrink-0"
            style={{ color: '#6b6560' }}
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5" style={cardStyle}>
      <p className="text-xs uppercase tracking-widest mb-2" style={labelStyle}>
        Not connected
      </p>
      <p className="text-sm mb-5" style={{ color: '#e8e0d4' }}>
        Connect Strava to automatically sync your runs and unlock coaching insights.
      </p>
      <a
        href="/api/strava/connect"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#fc4c02', color: '#fff', borderRadius: '2px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
        </svg>
        Connect Strava
      </a>
    </div>
  )
}
