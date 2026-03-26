'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Props {
  initialGoalRace: string
  initialGoalTime: string
  initialWeeklyMiles: number | null
  name: string
  email: string
}

export default function ProfileEditor({ initialGoalRace, initialGoalTime, initialWeeklyMiles, name, email }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [goalRace, setGoalRace] = useState(initialGoalRace)
  const [goalTime, setGoalTime] = useState(initialGoalTime)
  const [weeklyMiles, setWeeklyMiles] = useState(initialWeeklyMiles?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_race: goalRace, goal_time: goalTime, weekly_miles: weeklyMiles }),
    })
    setSaving(false)
    if (res.ok) {
      toast('Profile saved', 'success')
      router.refresh()
    } else {
      const data = await res.json()
      toast(data.error ?? 'Something went wrong', 'error')
    }
  }

  const inputStyle = {
    border: '1px solid #2a2521',
    color: '#f5f2ee',
    backgroundColor: 'transparent',
  }

  const labelStyle = {
    color: '#6b6560',
  }

  return (
    <div className="p-5 space-y-4" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
      {/* Read-only fields */}
      <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #1e1b18' }}>
        <span className="text-xs uppercase tracking-widest" style={labelStyle}>Name</span>
        <span className="text-sm" style={{ color: '#f5f2ee' }}>{name}</span>
      </div>
      <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #1e1b18' }}>
        <span className="text-xs uppercase tracking-widest" style={labelStyle}>Email</span>
        <span className="text-sm" style={{ color: '#f5f2ee' }}>{email}</span>
      </div>

      {/* Editable fields */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Goal Race</label>
        <input
          value={goalRace}
          onChange={e => setGoalRace(e.target.value)}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
          placeholder="Boston Marathon"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Goal Time</label>
        <input
          value={goalTime}
          onChange={e => setGoalTime(e.target.value)}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
          placeholder="3:05:00"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Weekly Mileage Goal</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="200"
            value={weeklyMiles}
            onChange={e => setWeeklyMiles(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="40"
          />
          <span className="text-xs uppercase tracking-widest shrink-0" style={{ color: '#6b6560' }}>mi / week</span>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
