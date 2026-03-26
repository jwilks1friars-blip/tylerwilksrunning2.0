'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

const DISTANCES = ['5K', '10K', 'Half Marathon', 'Marathon', '50K', '50 Mile', '100K', '100 Mile', 'Other']

export default function RaceResultForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState({
    race_name: '',
    race_date: '',
    distance: 'Marathon',
    finish_time: '',
    goal_time: '',
    place_overall: '',
    place_age_group: '',
    notes: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/race-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        place_overall: form.place_overall ? parseInt(form.place_overall) : undefined,
        place_age_group: form.place_age_group ? parseInt(form.place_age_group) : undefined,
      }),
    })

    setSaving(false)
    if (res.ok) {
      toast('Race result logged!', 'success')
      setForm({ race_name: '', race_date: '', distance: 'Marathon', finish_time: '', goal_time: '', place_overall: '', place_age_group: '', notes: '' })
      setExpanded(false)
      router.refresh()
    } else {
      const data = await res.json()
      toast(data.error ?? 'Failed to save race result', 'error')
    }
  }

  const inputStyle = {
    backgroundColor: '#141210',
    border: '1px solid #2a2521',
    color: '#f5f2ee',
    borderRadius: '2px',
  }

  const labelStyle = { color: '#6b6560' }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="px-5 py-2.5 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
        style={{ border: '1px solid #2a2521', color: '#6b6560', borderRadius: '2px', backgroundColor: '#141210' }}
      >
        + Log Race Result
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Race Name *</label>
          <input
            required
            value={form.race_name}
            onChange={e => update('race_name', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="Boston Marathon"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Date *</label>
          <input
            required
            type="date"
            value={form.race_date}
            onChange={e => update('race_date', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Distance *</label>
          <select
            required
            value={form.distance}
            onChange={e => update('distance', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          >
            {DISTANCES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Finish Time *</label>
          <input
            required
            value={form.finish_time}
            onChange={e => update('finish_time', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="3:05:22"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Goal Time</label>
          <input
            value={form.goal_time}
            onChange={e => update('goal_time', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="3:05:00"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Overall Place</label>
          <input
            type="number"
            min="1"
            value={form.place_overall}
            onChange={e => update('place_overall', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="142"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Age Group Place</label>
          <input
            type="number"
            min="1"
            value={form.place_age_group}
            onChange={e => update('place_age_group', e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="12"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm outline-none resize-none"
            style={inputStyle}
            placeholder="How did it go?"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          {saving ? 'Saving…' : 'Save Result'}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#6b6560' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
