'use client'

import { useState } from 'react'
import { format, addDays, startOfWeek, differenceInCalendarWeeks, parseISO } from 'date-fns'

const WORKOUT_TYPES = ['easy', 'tempo', 'intervals', 'long', 'recovery', 'rest', 'race'] as const
type WorkoutType = typeof WORKOUT_TYPES[number]

const TYPE_COLORS: Record<WorkoutType, string> = {
  easy: '#4ade80',
  tempo: '#fb923c',
  intervals: '#f87171',
  long: '#60a5fa',
  recovery: '#c4b5fd',
  rest: '#3a3633',
  race: '#fc4c02',
}

const TYPE_TEXT: Record<WorkoutType, string> = {
  easy: '#052e16',
  tempo: '#431407',
  intervals: '#450a0a',
  long: '#082f49',
  recovery: '#2e1065',
  rest: '#6b6560',
  race: '#fff',
}

type Workout = {
  id: string
  scheduled_date: string
  workout_type: WorkoutType
  target_distance_miles: number | null
  target_pace_desc: string | null
  description: string | null
  completed: boolean
}

type Plan = {
  id: string
  goal_race: string | null
  goal_time: string | null
  start_date: string
  race_date: string
  total_weeks: number
}

type Profile = {
  goal_race: string | null
  goal_time: string | null
}

type Props = {
  athleteId: string
  plan: Plan | null
  workouts: Workout[]
  profile: Profile
}

const emptyWorkoutForm = {
  scheduledDate: '',
  workoutType: 'easy' as WorkoutType,
  targetDistanceMiles: '',
  targetPaceDesc: '',
  description: '',
}

export default function ScheduleBuilder({ athleteId, plan: initialPlan, workouts: initialWorkouts, profile }: Props) {
  const [plan, setPlan] = useState<Plan | null>(initialPlan)
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Plan creation form
  const [planForm, setPlanForm] = useState({
    goalRace: profile.goal_race ?? '',
    goalTime: profile.goal_time ?? '',
    raceDate: '',
    startDate: format(addDays(new Date(), (8 - new Date().getDay()) % 7 || 7), 'yyyy-MM-dd'), // next Monday
  })

  // Workout modal
  const [workoutModal, setWorkoutModal] = useState<{ open: boolean; editing: Workout | null; defaultDate: string }>({
    open: false,
    editing: null,
    defaultDate: '',
  })
  const [workoutForm, setWorkoutForm] = useState(emptyWorkoutForm)

  // --- Plan actions ---

  async function handleGeneratePlan() {
    if (!planForm.raceDate) { setError('Race date is required'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/coach/schedule/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, ...planForm }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setPlan(data.plan)
    // Reload workouts
    const wRes = await fetch(`/api/coach/schedule/workout?planId=${data.plan.id}`)
    // Workouts come back via page reload — just reload
    window.location.reload()
  }

  async function handleCreateEmptyPlan() {
    if (!planForm.raceDate || !planForm.startDate) { setError('Start date and race date are required'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/coach/schedule/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, ...planForm }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setPlan(data.plan)
    setWorkouts([])
  }

  // --- Workout modal ---

  function openAdd(date: string) {
    setWorkoutForm({ ...emptyWorkoutForm, scheduledDate: date })
    setWorkoutModal({ open: true, editing: null, defaultDate: date })
  }

  function openEdit(workout: Workout) {
    setWorkoutForm({
      scheduledDate: workout.scheduled_date,
      workoutType: workout.workout_type,
      targetDistanceMiles: workout.target_distance_miles?.toString() ?? '',
      targetPaceDesc: workout.target_pace_desc ?? '',
      description: workout.description ?? '',
    })
    setWorkoutModal({ open: true, editing: workout, defaultDate: workout.scheduled_date })
  }

  function closeModal() {
    setWorkoutModal({ open: false, editing: null, defaultDate: '' })
    setWorkoutForm(emptyWorkoutForm)
  }

  async function handleSaveWorkout(e: React.FormEvent) {
    e.preventDefault()
    if (!plan) return
    setLoading(true); setError('')

    const payload = {
      planId: plan.id,
      athleteId,
      scheduledDate: workoutForm.scheduledDate,
      workoutType: workoutForm.workoutType,
      targetDistanceMiles: workoutForm.targetDistanceMiles ? parseFloat(workoutForm.targetDistanceMiles) : null,
      targetPaceDesc: workoutForm.targetPaceDesc || null,
      description: workoutForm.description || null,
    }

    if (workoutModal.editing) {
      const res = await fetch(`/api/coach/schedule/workout/${workoutModal.editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) { setError(data.error); return }
      setWorkouts(prev => prev.map(w => w.id === workoutModal.editing!.id ? data.workout : w))
    } else {
      const res = await fetch('/api/coach/schedule/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) { setError(data.error); return }
      setWorkouts(prev => [...prev, data.workout].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)))
    }

    closeModal()
  }

  async function handleDeleteWorkout(id: string) {
    setLoading(true)
    await fetch(`/api/coach/schedule/workout/${id}`, { method: 'DELETE' })
    setWorkouts(prev => prev.filter(w => w.id !== id))
    setLoading(false)
    closeModal()
  }

  // --- Organize by week ---

  function getWeeks() {
    if (!plan) return []
    const start = parseISO(plan.start_date)
    const end = parseISO(plan.race_date)
    const numWeeks = Math.max(plan.total_weeks, differenceInCalendarWeeks(end, start) + 1)
    return Array.from({ length: numWeeks }, (_, i) => {
      const weekStart = addDays(start, i * 7)
      const days = Array.from({ length: 7 }, (_, d) => {
        const date = format(addDays(weekStart, d), 'yyyy-MM-dd')
        const dayWorkouts = workouts.filter(w => w.scheduled_date === date)
        return { date, dayWorkouts }
      })
      return { weekNum: i + 1, weekStart, days }
    })
  }

  const weeks = getWeeks()

  // --- No plan state ---
  if (!plan) {
    return (
      <div className="max-w-lg">
        <div className="p-8" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-xl font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
            Create Training Plan
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Goal Race</label>
              <input value={planForm.goalRace} onChange={e => setPlanForm(p => ({ ...p, goalRace: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} placeholder="Boston Marathon" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Goal Time</label>
              <input value={planForm.goalTime} onChange={e => setPlanForm(p => ({ ...p, goalTime: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} placeholder="3:30:00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Start Date</label>
                <input type="date" value={planForm.startDate} onChange={e => setPlanForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-[#141210] outline-none"
                  style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Race Date</label>
                <input type="date" value={planForm.raceDate} onChange={e => setPlanForm(p => ({ ...p, raceDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-[#141210] outline-none"
                  style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} />
              </div>
            </div>
          </div>

          {error && <p className="text-xs mt-3" style={{ color: '#fc4c02' }}>{error}</p>}

          <div className="flex gap-3 mt-6">
            <button onClick={handleGeneratePlan} disabled={loading}
              className="flex-1 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}>
              {loading ? 'Generating...' : 'Generate with AI'}
            </button>
            <button onClick={handleCreateEmptyPlan} disabled={loading}
              className="flex-1 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }}>
              Create Empty
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Active plan ---
  return (
    <div>
      {/* Plan header */}
      <div className="flex items-start justify-between mb-6 p-4"
        style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#f5f2ee' }}>
            {plan.goal_race ?? 'Training Plan'}
            {plan.goal_time && <span style={{ color: '#6b6560' }}> — {plan.goal_time}</span>}
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
            {format(parseISO(plan.start_date), 'MMM d')} → {format(parseISO(plan.race_date), 'MMM d, yyyy')} · {plan.total_weeks} weeks
          </p>
        </div>
        <button onClick={() => { setPlan(null); setWorkouts([]) }}
          className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
          style={{ color: '#6b6560' }}>
          New Plan
        </button>
      </div>

      {error && <p className="text-xs mb-4" style={{ color: '#fc4c02' }}>{error}</p>}

      {/* Weeks */}
      <div className="space-y-6">
        {weeks.map(({ weekNum, weekStart, days }) => (
          <div key={weekNum}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
                Week {weekNum} — {format(weekStart, 'MMM d')}
              </p>
              <button
                onClick={() => openAdd(format(weekStart, 'yyyy-MM-dd'))}
                className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
                style={{ color: '#6b6560' }}>
                + Add
              </button>
            </div>

            <div style={{ border: '1px solid #1e1b18' }}>
              {days.map(({ date, dayWorkouts }, i) => (
                <div key={date}>
                  {dayWorkouts.length === 0 ? (
                    <div
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[#141210] transition-colors"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid #1e1b18' }}
                      onClick={() => openAdd(date)}
                    >
                      <span className="text-xs" style={{ color: '#2a2521' }}>
                        {format(parseISO(date), 'EEE MMM d')}
                      </span>
                      <span className="text-xs" style={{ color: '#2a2521' }}>+</span>
                    </div>
                  ) : (
                    dayWorkouts.map(workout => (
                      <div
                        key={workout.id}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid #1e1b18' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-24 shrink-0" style={{ color: '#6b6560' }}>
                            {format(parseISO(date), 'EEE MMM d')}
                          </span>
                          <span
                            className="text-xs uppercase tracking-widest px-2 py-0.5 shrink-0"
                            style={{
                              backgroundColor: TYPE_COLORS[workout.workout_type],
                              color: TYPE_TEXT[workout.workout_type],
                              borderRadius: '2px',
                            }}
                          >
                            {workout.workout_type}
                          </span>
                          {workout.target_distance_miles && (
                            <span className="text-sm tabular-nums" style={{ color: '#f5f2ee' }}>
                              {workout.target_distance_miles} mi
                            </span>
                          )}
                          {workout.target_pace_desc && (
                            <span className="text-xs hidden md:block" style={{ color: '#6b6560' }}>
                              {workout.target_pace_desc}
                            </span>
                          )}
                          {workout.description && (
                            <span className="text-xs hidden lg:block truncate max-w-xs" style={{ color: '#3a3633' }}>
                              {workout.description}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => openEdit(workout)}
                          className="text-xs uppercase tracking-widest ml-4 shrink-0 transition-colors hover:text-[#f5f2ee]"
                          style={{ color: '#3a3633' }}
                        >
                          Edit
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Workout Modal */}
      {workoutModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(10,9,8,0.85)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md p-8"
            style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-xl font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}>
                {workoutModal.editing ? 'Edit Workout' : 'Add Workout'}
              </p>
              <button onClick={closeModal} className="text-xs uppercase tracking-widest"
                style={{ color: '#6b6560' }}>Cancel</button>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Date</label>
                  <input type="date" value={workoutForm.scheduledDate}
                    onChange={e => setWorkoutForm(p => ({ ...p, scheduledDate: e.target.value }))}
                    required className="w-full px-3 py-2.5 text-sm bg-[#141210] outline-none"
                    style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Type</label>
                  <select value={workoutForm.workoutType}
                    onChange={e => setWorkoutForm(p => ({ ...p, workoutType: e.target.value as WorkoutType }))}
                    className="w-full px-3 py-2.5 text-sm bg-[#141210] outline-none"
                    style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}>
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Distance (mi)</label>
                  <input type="number" step="0.1" value={workoutForm.targetDistanceMiles}
                    onChange={e => setWorkoutForm(p => ({ ...p, targetDistanceMiles: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                    style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} placeholder="5.0" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Pace</label>
                  <input value={workoutForm.targetPaceDesc}
                    onChange={e => setWorkoutForm(p => ({ ...p, targetPaceDesc: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                    style={{ border: '1px solid #2a2521', color: '#f5f2ee' }} placeholder="7:30/mi" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6560' }}>Notes</label>
                <textarea value={workoutForm.description}
                  onChange={e => setWorkoutForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2.5 text-sm bg-transparent outline-none resize-none"
                  style={{ border: '1px solid #2a2521', color: '#f5f2ee' }}
                  placeholder="Workout notes..." />
              </div>

              {error && <p className="text-xs" style={{ color: '#fc4c02' }}>{error}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}>
                  {loading ? 'Saving...' : 'Save Workout'}
                </button>
                {workoutModal.editing && (
                  <button type="button" onClick={() => handleDeleteWorkout(workoutModal.editing!.id)}
                    disabled={loading}
                    className="px-4 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ border: '1px solid #2a2521', color: '#fc4c02', borderRadius: '2px' }}>
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
