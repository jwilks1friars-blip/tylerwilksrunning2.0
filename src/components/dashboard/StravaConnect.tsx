'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Connection {
  strava_athlete_id: number
  created_at: string
  last_synced_at: string | null
  token_expires_at: string
}

interface Props {
  connection: Connection | null
  connectedViaParam: boolean
}

export default function StravaConnect({ connection, connectedViaParam }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [justConnected] = useState(connectedViaParam)

  async function handleDisconnect() {
    setDisconnecting(true)
    const res = await fetch('/api/strava/disconnect', { method: 'DELETE' })
    if (res.ok) {
      toast('Strava disconnected', 'info')
    } else {
      toast('Failed to disconnect', 'error')
    }
    router.refresh()
  }

  async function handleManualSync() {
    setSyncing(true)
    const res = await fetch('/api/strava/backfill', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    if (res.ok) {
      toast(`Synced ${data.synced} activities`, 'success')
      router.refresh()
    } else {
      toast(data.error ?? 'Sync failed', 'error')
    }
  }

  const labelStyle = { color: '#6b6560' }
  const cardStyle = { backgroundColor: '#141210', border: '1px solid #1e1b18' }

  if (connection) {
    const tokenExpired = new Date(connection.token_expires_at) < new Date()

    return (
      <div className="p-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {justConnected && (
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#7fbf7f' }}>
                ✓ Connected successfully
              </p>
            )}
            <div className="flex items-center gap-3 mb-3">
              {/* Strava orange dot */}
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokenExpired ? '#e8a0a0' : '#fc4c02' }} />
              <p className="text-sm font-medium" style={{ color: '#f5f2ee' }}>
                Strava {tokenExpired ? 'Token Expired' : 'Connected'}
              </p>
            </div>
            <p className="text-xs" style={labelStyle}>
              Athlete ID: {connection.strava_athlete_id}
            </p>
            <p className="text-xs mt-1" style={labelStyle}>
              Connected {new Date(connection.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            {connection.last_synced_at ? (
              <p className="text-xs mt-1" style={labelStyle}>
                Last synced {new Date(connection.last_synced_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            ) : (
              <p className="text-xs mt-1" style={labelStyle}>Never manually synced</p>
            )}
            {tokenExpired ? (
              <p className="text-xs mt-2" style={{ color: '#e8a0a0' }}>
                Session expired — reconnect Strava to re-authorize.
              </p>
            ) : (
              <p className="text-xs mt-2" style={labelStyle}>
                New runs sync automatically via webhook.
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={handleManualSync}
              disabled={syncing || disconnecting}
              className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
              style={{ color: '#e8e0d4' }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting || syncing}
              className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
              style={{ color: '#6b6560' }}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
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
