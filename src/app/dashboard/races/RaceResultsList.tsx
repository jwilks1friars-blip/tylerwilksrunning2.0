'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/Toast'

interface RaceResult {
  id: string
  race_name: string
  race_date: string
  distance: string
  finish_time: string
  goal_time: string | null
  place_overall: number | null
  place_age_group: number | null
  notes: string | null
}

export default function RaceResultsList({ results }: { results: RaceResult[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/race-results/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      toast('Race result deleted', 'info')
      router.refresh()
    } else {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div
      className="divide-y"
      style={{ backgroundColor: '#141210', border: '1px solid #1e1b18', borderColor: '#1e1b18' }}
    >
      {results.map(r => {
        const hitGoal = r.goal_time && r.finish_time <= r.goal_time
        return (
          <div key={r.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-medium truncate" style={{ color: '#f5f2ee' }}>
                    {r.race_name}
                  </p>
                  {hitGoal && (
                    <span className="text-xs uppercase tracking-widest px-1.5 py-0.5" style={{ color: '#7fbf7f', border: '1px solid #2a4a2a' }}>
                      PR
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                  {format(new Date(r.race_date), 'MMM d, yyyy')} · {r.distance}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                    {r.finish_time}
                  </p>
                  {r.goal_time && (
                    <p className="text-xs" style={{ color: r.finish_time <= r.goal_time ? '#7fbf7f' : '#6b6560' }}>
                      goal: {r.goal_time}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="text-xs uppercase tracking-widest transition-opacity disabled:opacity-40 opacity-30 hover:opacity-80"
                  style={{ color: '#6b6560' }}
                >
                  {deleting === r.id ? '…' : '✕'}
                </button>
              </div>
            </div>

            {(r.place_overall || r.place_age_group || r.notes) && (
              <div className="mt-2 flex flex-wrap gap-4">
                {r.place_overall && (
                  <p className="text-xs" style={{ color: '#6b6560' }}>
                    Overall: #{r.place_overall}
                  </p>
                )}
                {r.place_age_group && (
                  <p className="text-xs" style={{ color: '#6b6560' }}>
                    Age group: #{r.place_age_group}
                  </p>
                )}
                {r.notes && (
                  <p className="text-xs italic w-full mt-1" style={{ color: '#3a3633' }}>
                    {r.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
