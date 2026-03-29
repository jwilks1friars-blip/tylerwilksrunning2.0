'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Props {
  athleteId: string
  weeklyMiles: number
  goalRace: string | null
  goalTime: string | null
  weeksUntilRace: number | null
  raceDate: string | null
  stravaConnected: boolean
}

export default function AthleteProfileStats({
  athleteId,
  weeklyMiles,
  goalRace: initialGoalRace,
  goalTime: initialGoalTime,
  weeksUntilRace,
  raceDate,
  stravaConnected,
}: Props) {
  const [goalRace, setGoalRace] = useState(initialGoalRace ?? '')
  const [goalTime, setGoalTime] = useState(initialGoalTime ?? '')
  const [editing, setEditing] = useState<'goalRace' | 'goalTime' | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(field: 'goalRace' | 'goalTime') {
    setSaving(true)
    await fetch(`/api/coach/athletes/${athleteId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalRace, goalTime }),
    })
    setSaving(false)
    setEditing(null)
  }

  function handleKeyDown(e: React.KeyboardEvent, field: 'goalRace' | 'goalTime') {
    if (e.key === 'Enter') save(field)
    if (e.key === 'Escape') setEditing(null)
  }

  const cardStyle = { backgroundColor: '#ffffff', border: '1px solid #ebebea' }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">

      {/* Mi This Week — read only */}
      <div className="p-4" style={cardStyle}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9c9895' }}>Mi This Week</p>
        <p className="text-sm font-medium" style={{ color: '#1a1917' }}>{weeklyMiles.toFixed(1)}</p>
      </div>

      {/* Goal Race — editable */}
      <div
        className="p-4 cursor-pointer group"
        style={cardStyle}
        onClick={() => editing !== 'goalRace' && setEditing('goalRace')}
      >
        <p className="text-xs uppercase tracking-widest mb-1 flex items-center justify-between" style={{ color: '#9c9895' }}>
          Goal Race
          {editing !== 'goalRace' && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs normal-case tracking-normal" style={{ color: '#c8c4c0' }}>
              edit
            </span>
          )}
        </p>
        {editing === 'goalRace' ? (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              value={goalRace}
              onChange={e => setGoalRace(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'goalRace')}
              className="flex-1 text-sm bg-transparent outline-none border-b"
              style={{ color: '#1a1917', borderColor: '#1a1917', minWidth: 0 }}
              placeholder="Boston Marathon"
            />
            <button
              onClick={() => save('goalRace')}
              disabled={saving}
              className="text-xs uppercase tracking-widest shrink-0"
              style={{ color: '#1a1917' }}
            >
              {saving ? '…' : '✓'}
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium" style={{ color: '#1a1917' }}>
            {goalRace || <span style={{ color: '#c8c4c0' }}>—</span>}
          </p>
        )}
      </div>

      {/* Goal Time — editable */}
      <div
        className="p-4 cursor-pointer group"
        style={cardStyle}
        onClick={() => editing !== 'goalTime' && setEditing('goalTime')}
      >
        <p className="text-xs uppercase tracking-widest mb-1 flex items-center justify-between" style={{ color: '#9c9895' }}>
          Goal Time
          {editing !== 'goalTime' && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs normal-case tracking-normal" style={{ color: '#c8c4c0' }}>
              edit
            </span>
          )}
        </p>
        {editing === 'goalTime' ? (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              value={goalTime}
              onChange={e => setGoalTime(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'goalTime')}
              className="flex-1 text-sm bg-transparent outline-none border-b"
              style={{ color: '#1a1917', borderColor: '#1a1917', minWidth: 0 }}
              placeholder="1:45:00"
            />
            <button
              onClick={() => save('goalTime')}
              disabled={saving}
              className="text-xs uppercase tracking-widest shrink-0"
              style={{ color: '#1a1917' }}
            >
              {saving ? '…' : '✓'}
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium" style={{ color: '#1a1917' }}>
            {goalTime || <span style={{ color: '#c8c4c0' }}>—</span>}
          </p>
        )}
      </div>

      {/* Weeks to Race — read only */}
      <div className="p-4" style={{ ...cardStyle, borderColor: weeksUntilRace !== null && weeksUntilRace <= 3 ? '#fcd9b0' : '#ebebea' }}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9c9895' }}>Weeks to Race</p>
        <p className="text-sm font-medium" style={{ color: weeksUntilRace !== null && weeksUntilRace <= 3 ? '#fc4c02' : '#1a1917' }}>
          {weeksUntilRace !== null ? <>{weeksUntilRace}<span className="font-normal" style={{ color: '#9c9895' }}> wks</span></> : '—'}
        </p>
        {raceDate && (
          <p className="text-xs mt-0.5" style={{ color: '#c8c4c0' }}>{format(new Date(raceDate), 'MMM d, yyyy')}</p>
        )}
      </div>

      {/* Strava — read only */}
      <div className="p-4" style={cardStyle}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9c9895' }}>Strava</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stravaConnected ? '#fc4c02' : '#c8c4c0' }} />
          <p className="text-sm font-medium" style={{ color: '#1a1917' }}>
            {stravaConnected ? 'Connected' : 'Not connected'}
          </p>
        </div>
      </div>

    </div>
  )
}
