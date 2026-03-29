'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Connection {
  coros_user_id: string
  connected_at: string
}

interface Props {
  connection: Connection | null
  connectedViaParam: boolean
}

export default function CorosConnect({ connection, connectedViaParam }: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch('/api/coros/disconnect', { method: 'DELETE' })
    router.refresh()
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/coros/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    setSyncResult(data.imported != null ? `Synced ${data.imported} activities` : 'Sync failed')
  }

  const cardStyle = { backgroundColor: '#141210', border: '1px solid #1e1b18' }
  const labelStyle = { color: '#6b6560' }

  if (connection) {
    return (
      <div className="p-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {connectedViaParam && (
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#7fbf7f' }}>
                ✓ Connected successfully
              </p>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff6b35' }} />
              <p className="text-sm font-medium" style={{ color: '#f5f2ee' }}>COROS Connected</p>
            </div>
            <p className="text-xs" style={labelStyle}>User ID: {connection.coros_user_id}</p>
            <p className="text-xs mt-1" style={labelStyle}>
              Connected {new Date(connection.connected_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            {syncResult && (
              <p className="text-xs mt-2" style={{ color: '#7fbf7f' }}>{syncResult}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
              style={{ color: '#6b6560' }}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
              style={{ color: '#9c9895' }}
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5" style={cardStyle}>
      <p className="text-xs uppercase tracking-widest mb-2" style={labelStyle}>Not connected</p>
      <p className="text-sm mb-5" style={{ color: '#e8e0d4' }}>
        Connect COROS to sync activities directly from your COROS watch.
      </p>
      <a
        href="/api/coros/connect"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#ff6b35', color: '#fff', borderRadius: '2px' }}
      >
        Connect COROS
      </a>
    </div>
  )
}
