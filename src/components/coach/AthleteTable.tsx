'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

type SortKey = 'name' | 'miles' | 'lastRun'
type SortDir = 'asc' | 'desc'

interface Athlete {
  id: string
  full_name: string | null
  email: string | null
  plan_tier: string | null
  miles: number
  lastRun: string | null
}

const TIER_LABELS: Record<string, string> = {
  plan: 'Plan',
  coaching: 'Coaching',
  elite: 'Elite',
  none: 'Free',
}

export default function AthleteTable({ athletes }: { athletes: Athlete[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('lastRun')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...athletes].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'name') cmp = (a.full_name ?? '').localeCompare(b.full_name ?? '')
    else if (sortKey === 'miles') cmp = a.miles - b.miles
    else if (sortKey === 'lastRun') cmp = (a.lastRun ?? '').localeCompare(b.lastRun ?? '')
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortIndicator({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ color: '#c8c4c0' }}> ↕</span>
    return <span style={{ color: '#1a1917' }}> {sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <>
      <div
        className="grid text-xs uppercase tracking-widest pb-2 mb-1 px-4"
        style={{
          color: '#9c9895',
          borderBottom: '1px solid #ebebea',
          gridTemplateColumns: '1fr 100px 80px 120px',
        }}
      >
        <button
          onClick={() => handleSort('name')}
          className="text-left flex items-center transition-colors hover:text-[#1a1917]"
        >
          Athlete<SortIndicator col="name" />
        </button>
        <span>Plan</span>
        <button
          onClick={() => handleSort('miles')}
          className="text-right flex items-center justify-end transition-colors hover:text-[#1a1917]"
        >
          Mi / Wk<SortIndicator col="miles" />
        </button>
        <button
          onClick={() => handleSort('lastRun')}
          className="text-right flex items-center justify-end transition-colors hover:text-[#1a1917]"
        >
          Last Run<SortIndicator col="lastRun" />
        </button>
      </div>

      <div className="space-y-px">
        {sorted.map(athlete => (
          <Link
            key={athlete.id}
            href={`/coach/athletes/${athlete.id}`}
            className="grid items-center px-4 py-3.5 rounded transition-colors hover:bg-[#f5f4f2]"
            style={{ gridTemplateColumns: '1fr 100px 80px 120px' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: '#1a1917' }}>
                {athlete.full_name ?? '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9c9895' }}>
                {athlete.email}
              </p>
            </div>

            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: athlete.plan_tier === 'none' ? '#c8c4c0' : '#6b6865' }}
            >
              {TIER_LABELS[athlete.plan_tier ?? 'none'] ?? athlete.plan_tier}
            </span>

            <p className="text-sm text-right tabular-nums" style={{ color: '#1a1917' }}>
              {athlete.miles > 0 ? athlete.miles.toFixed(1) : '—'}
            </p>

            <p className="text-sm text-right" style={{ color: '#9c9895' }}>
              {athlete.lastRun ? format(new Date(athlete.lastRun), 'MMM d') : '—'}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
