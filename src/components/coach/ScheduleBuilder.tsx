'use client'

import { useState } from 'react'
import { format, addDays, parseISO, differenceInCalendarWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns'

const WORKOUT_TYPES = ['easy', 'tempo', 'intervals', 'long', 'recovery', 'rest', 'race'] as const
type WorkoutType = typeof WORKOUT_TYPES[number]

const TYPE_COLORS: Record<WorkoutType, string> = {
  easy: '#4ade80',
  tempo: '#fb923c',
  intervals: '#f87171',
  long: '#60a5fa',
  recovery: '#c4b5fd',
  rest: '#ebebea',
  race: '#fc4c02',
}

const TYPE_TEXT: Record<WorkoutType, string> = {
  easy: '#052e16',
  tempo: '#431407',
  intervals: '#450a0a',
  long: '#082f49',
  recovery: '#2e1065',
  rest: '#9c9895',
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
  status: string
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
  weeklyNotes?: Record<number, string>
}

const emptyWorkoutForm = {
  scheduledDate: '',
  workoutType: 'easy' as WorkoutType,
  targetDistanceMiles: '',
  targetPaceDesc: '',
  description: '',
}

export default function ScheduleBuilder({
  athleteId,
  plan: initialPlan,
  workouts: initialWorkouts,
  profile,
  weeklyNotes: initialWeeklyNotes = {},
}: Props) {
  const [plan, setPlan] = useState<Plan | null>(initialPlan)
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  // Tabs
  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar' | 'weekly-note'>('schedule')

  // Calendar view
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (initialPlan) return parseISO(initialPlan.start_date)
    return new Date()
  })

  // Weekly notes
  const [weeklyNotes, setWeeklyNotes] = useState<Record<number, string>>(initialWeeklyNotes)
  const [selectedWeekNum, setSelectedWeekNum] = useState(1)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  // Plan creation form
  const [planForm, setPlanForm] = useState({
    goalRace: profile.goal_race ?? '',
    goalTime: profile.goal_time ?? '',
    raceDate: '',
    startDate: format(addDays(new Date(), (8 - new Date().getDay()) % 7 || 7), 'yyyy-MM-dd'),
    coachNotes: '',
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
    try {
      const res = await fetch('/api/coach/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, ...planForm }),
      })
      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON body */ }
      setLoading(false)
      if (!res.ok) { setError(data.error ?? `Server error (${res.status})`); return }
      setPlan(data.plan)
      if (data.plan?.start_date) setCalendarMonth(parseISO(data.plan.start_date))
      window.location.reload()
    } catch (err: any) {
      setLoading(false)
      setError(err?.message ?? 'Network error. Please try again.')
    }
  }

  async function handlePublishPlan() {
    if (!plan) return
    setPublishing(true)
    setError('')
    try {
      const res = await fetch('/api/coach/schedule/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, athleteId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to publish'); setPublishing(false); return }
      setPlan(data.plan)
    } catch (err: any) {
      setError(err?.message ?? 'Network error')
    }
    setPublishing(false)
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
    if (data.plan?.start_date) setCalendarMonth(parseISO(data.plan.start_date))
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

  // --- Weekly note ---

  async function handleSaveWeeklyNote() {
    if (!plan) return
    setNoteSaving(true)
    setNoteSaved(false)
    await fetch('/api/coach/schedule/weekly-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        weekNum: selectedWeekNum,
        content: weeklyNotes[selectedWeekNum] ?? '',
      }),
    })
    setNoteSaving(false)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2500)
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
        <div className="p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
          <p className="text-xl font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
            Create Training Plan
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Goal Race</label>
              <input value={planForm.goalRace} onChange={e => setPlanForm(p => ({ ...p, goalRace: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                style={{ border: '1px solid #e0deda', color: '#1a1917' }} placeholder="Boston Marathon" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Goal Time</label>
              <input value={planForm.goalTime} onChange={e => setPlanForm(p => ({ ...p, goalTime: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                style={{ border: '1px solid #e0deda', color: '#1a1917' }} placeholder="3:30:00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Start Date</label>
                <input type="date" value={planForm.startDate} onChange={e => setPlanForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-white outline-none"
                  style={{ border: '1px solid #e0deda', color: '#1a1917' }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Race Date</label>
                <input type="date" value={planForm.raceDate} onChange={e => setPlanForm(p => ({ ...p, raceDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-white outline-none"
                  style={{ border: '1px solid #e0deda', color: '#1a1917' }} />
              </div>
            </div>
          </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>
                Coaching Notes
                <span className="ml-2 normal-case tracking-normal" style={{ color: '#c8c4c0' }}>
                  — context for the AI (injuries, focus areas, schedule constraints)
                </span>
              </label>
              <textarea
                value={planForm.coachNotes}
                onChange={e => setPlanForm(p => ({ ...p, coachNotes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2.5 text-sm bg-transparent outline-none resize-none leading-relaxed"
                style={{ border: '1px solid #e0deda', color: '#1a1917' }}
                placeholder="e.g. Athlete had IT band issues in January, cleared to run. Focus on easy aerobic base. Runs 5 days/week max. Tends to go out too fast on long runs."
              />
            </div>

          {error && <p className="text-xs mt-3" style={{ color: '#fc4c02' }}>{error}</p>}

          <div className="flex gap-3 mt-6">
            <button onClick={handleGeneratePlan} disabled={loading}
              className="flex-1 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#1a1917', color: '#ffffff', borderRadius: '2px' }}>
              {loading ? 'Generating...' : 'Generate with AI'}
            </button>
            <button onClick={handleCreateEmptyPlan} disabled={loading}
              className="flex-1 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ border: '1px solid #e0deda', color: '#6b6865', borderRadius: '2px' }}>
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
      {/* Draft banner */}
      {plan.status === 'draft' && (
        <div
          className="flex items-center justify-between px-5 py-4 mb-6 rounded-lg"
          style={{ backgroundColor: '#fff8f0', border: '1px solid #fcd9b0' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
              Draft — not visible to athlete
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
              Review the plan below, make any edits, then publish when ready.
            </p>
          </div>
          <button
            onClick={handlePublishPlan}
            disabled={publishing}
            className="ml-6 shrink-0 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest rounded transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#1a1917', color: '#ffffff' }}
          >
            {publishing ? 'Publishing…' : 'Publish to Athlete'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: '1px solid #ebebea' }}>
        {(['schedule', 'calendar', 'weekly-note'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-1 pb-3 mr-6 text-xs uppercase tracking-widest transition-colors"
            style={{
              color: activeTab === tab ? '#1a1917' : '#9c9895',
              borderBottom: activeTab === tab ? '1px solid #1a1917' : '1px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab === 'schedule' ? 'Schedule' : tab === 'calendar' ? 'Calendar' : 'Weekly Note'}
          </button>
        ))}
      </div>

      {/* Plan header */}
      <div className="flex items-start justify-between mb-6 p-4"
        style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#1a1917' }}>
            {plan.goal_race ?? 'Training Plan'}
            {plan.goal_time && <span style={{ color: '#9c9895' }}> — {plan.goal_time}</span>}
          </p>
          <p className="text-xs mt-1" style={{ color: '#9c9895' }}>
            {format(parseISO(plan.start_date), 'MMM d')} → {format(parseISO(plan.race_date), 'MMM d, yyyy')} · {plan.total_weeks} weeks
          </p>
        </div>
        <button onClick={() => { setPlan(null); setWorkouts([]) }}
          className="text-xs uppercase tracking-widest transition-colors hover:text-[#1a1917]"
          style={{ color: '#9c9895' }}>
          New Plan
        </button>
      </div>

      {error && <p className="text-xs mb-4" style={{ color: '#fc4c02' }}>{error}</p>}

      {/* ── SCHEDULE TAB ── */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {weeks.map(({ weekNum, weekStart, days }) => {
            const weekMiles = days
              .flatMap(d => d.dayWorkouts)
              .filter(w => w.workout_type !== 'rest')
              .reduce((sum, w) => sum + (w.target_distance_miles ?? 0), 0)

            return (
            <div key={weekNum}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
                  Week {weekNum} — {format(weekStart, 'MMM d')}
                  {weeklyNotes[weekNum] && (
                    <span className="ml-3 normal-case tracking-normal" style={{ color: '#c8c4c0' }}>
                      · note
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setSelectedWeekNum(weekNum); setActiveTab('weekly-note') }}
                    className="text-xs uppercase tracking-widest transition-colors hover:text-[#1a1917]"
                    style={{ color: '#c8c4c0' }}>
                    Note
                  </button>
                  <button
                    onClick={() => openAdd(format(weekStart, 'yyyy-MM-dd'))}
                    className="text-xs uppercase tracking-widest transition-colors hover:text-[#1a1917]"
                    style={{ color: '#9c9895' }}>
                    + Add
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid #ebebea' }}>
                {days.map(({ date, dayWorkouts }, i) => (
                  <div key={date}>
                    {dayWorkouts.length === 0 ? (
                      <div
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[#f5f4f2] transition-colors"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid #ebebea' }}
                        onClick={() => openAdd(date)}
                      >
                        <span className="text-xs" style={{ color: '#c8c4c0' }}>
                          {format(parseISO(date), 'EEE MMM d')}
                        </span>
                        <span className="text-xs" style={{ color: '#c8c4c0' }}>+</span>
                      </div>
                    ) : (
                      dayWorkouts.map(workout => (
                        <div
                          key={workout.id}
                          className="flex items-center justify-between px-4 py-3"
                          style={{ borderTop: i === 0 ? 'none' : '1px solid #ebebea' }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs w-24 shrink-0" style={{ color: '#9c9895' }}>
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
                              <span className="text-sm tabular-nums" style={{ color: '#1a1917' }}>
                                {workout.target_distance_miles} mi
                              </span>
                            )}
                            {workout.target_pace_desc && (
                              <span className="text-xs hidden md:block" style={{ color: '#9c9895' }}>
                                {workout.target_pace_desc}
                              </span>
                            )}
                            {workout.description && (
                              <span className="text-xs hidden lg:block truncate max-w-xs" style={{ color: '#c8c4c0' }}>
                                {workout.description}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => openEdit(workout)}
                            className="text-xs uppercase tracking-widest ml-4 shrink-0 transition-colors hover:text-[#1a1917]"
                            style={{ color: '#c8c4c0' }}
                          >
                            Edit
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>

              {/* Weekly mileage total */}
              <div className="flex justify-end mt-1.5 px-1">
                <p className="text-xs tabular-nums" style={{ color: '#9c9895' }}>
                  {weekMiles > 0 ? (
                    <><span style={{ color: '#1a1917', fontWeight: 600 }}>{weekMiles.toFixed(1)}</span> mi total</>
                  ) : (
                    <span style={{ color: '#c8c4c0' }}>0 mi</span>
                  )}
                </p>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* ── CALENDAR TAB ── */}
      {activeTab === 'calendar' && (() => {
        const monthStart = startOfMonth(calendarMonth)
        const monthEnd = endOfMonth(calendarMonth)
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

        // Build grid of days
        const calDays: Date[] = []
        let d = calStart
        while (d <= calEnd) { calDays.push(d); d = addDays(d, 1) }

        const planStart = parseISO(plan.start_date)
        const planEnd = parseISO(plan.race_date)

        const canGoPrev = subMonths(calendarMonth, 1).getTime() >= startOfMonth(planStart).getTime()
        const canGoNext = addMonths(calendarMonth, 1).getTime() <= startOfMonth(planEnd).getTime()

        return (
          <div>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarMonth(m => subMonths(m, 1))}
                disabled={!canGoPrev}
                className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:text-[#1a1917] disabled:opacity-30"
                style={{ color: '#9c9895', border: '1px solid #ebebea' }}
              >
                ←
              </button>
              <p className="text-sm font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                {format(calendarMonth, 'MMMM yyyy')}
              </p>
              <button
                onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                disabled={!canGoNext}
                className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:text-[#1a1917] disabled:opacity-30"
                style={{ color: '#9c9895', border: '1px solid #ebebea' }}
              >
                →
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center py-1.5 text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7" style={{ border: '1px solid #ebebea' }}>
              {calDays.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayWorkouts = workouts.filter(w => w.scheduled_date === dateStr)
                const inMonth = isSameMonth(day, calendarMonth)
                const inPlan = day.getTime() >= planStart.getTime() && day.getTime() <= planEnd.getTime()
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={dateStr}
                    onClick={() => inPlan && openAdd(dateStr)}
                    className="min-h-[90px] p-1.5 relative transition-colors"
                    style={{
                      borderTop: idx < 7 ? 'none' : '1px solid #ebebea',
                      borderLeft: idx % 7 === 0 ? 'none' : '1px solid #ebebea',
                      backgroundColor: !inMonth ? '#fafaf9' : '#ffffff',
                      cursor: inPlan ? 'pointer' : 'default',
                    }}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs w-5 h-5 flex items-center justify-center"
                        style={{
                          color: !inMonth ? '#c8c4c0' : isToday ? '#ffffff' : '#1a1917',
                          backgroundColor: isToday ? '#1a1917' : 'transparent',
                          borderRadius: '50%',
                          fontSize: '11px',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                      {inPlan && inMonth && dayWorkouts.length === 0 && (
                        <span className="text-xs opacity-0 group-hover:opacity-100" style={{ color: '#c8c4c0' }}>+</span>
                      )}
                    </div>

                    {/* Workouts */}
                    <div className="space-y-0.5">
                      {dayWorkouts.map(workout => (
                        <div
                          key={workout.id}
                          onClick={e => { e.stopPropagation(); openEdit(workout) }}
                          className="flex items-center gap-1 px-1 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: TYPE_COLORS[workout.workout_type],
                            borderRadius: '2px',
                          }}
                        >
                          <span
                            className="text-xs font-medium uppercase tracking-wide truncate"
                            style={{ color: TYPE_TEXT[workout.workout_type], fontSize: '10px' }}
                          >
                            {workout.workout_type === 'rest' ? 'rest' : `${workout.target_distance_miles ?? ''}mi ${workout.workout_type}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── WEEKLY NOTE TAB ── */}
      {activeTab === 'weekly-note' && (
        <div>
          {/* Week selector */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedWeekNum(n => Math.max(1, n - 1))}
              disabled={selectedWeekNum <= 1}
              className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:text-[#1a1917] disabled:opacity-30"
              style={{ color: '#9c9895', border: '1px solid #ebebea' }}
            >
              ←
            </button>
            <div className="text-center" style={{ minWidth: '120px' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>Week</p>
              <p className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                {selectedWeekNum}
                <span className="text-sm font-normal ml-1" style={{ color: '#9c9895' }}>
                  / {weeks.length}
                </span>
              </p>
              {weeks[selectedWeekNum - 1] && (
                <p className="text-xs mt-0.5" style={{ color: '#c8c4c0' }}>
                  {format(weeks[selectedWeekNum - 1].weekStart, 'MMM d')}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedWeekNum(n => Math.min(weeks.length, n + 1))}
              disabled={selectedWeekNum >= weeks.length}
              className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:text-[#1a1917] disabled:opacity-30"
              style={{ color: '#9c9895', border: '1px solid #ebebea' }}
            >
              →
            </button>
          </div>

          {/* Note textarea */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: '#9c9895' }}>
              Note to Athlete — Week {selectedWeekNum}
            </label>
            <textarea
              value={weeklyNotes[selectedWeekNum] ?? ''}
              onChange={e => {
                const val = e.target.value
                setWeeklyNotes(prev => ({ ...prev, [selectedWeekNum]: val }))
                setNoteSaved(false)
              }}
              rows={14}
              className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none leading-relaxed"
              style={{ border: '1px solid #e0deda', color: '#1a1917' }}
              placeholder={`Write your coaching note for Week ${selectedWeekNum}...\n\nWhat's the focus of this week? Any key workouts to highlight? Advice on pacing, recovery, or mindset?`}
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveWeeklyNote}
              disabled={noteSaving}
              className="px-6 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#1a1917', color: '#ffffff', borderRadius: '2px' }}
            >
              {noteSaving ? 'Saving...' : 'Save Note'}
            </button>
            {noteSaved && (
              <p className="text-xs uppercase tracking-widest" style={{ color: '#22c55e' }}>
                Saved
              </p>
            )}
          </div>
        </div>
      )}

      {/* Workout Modal */}
      {workoutModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md p-8"
            style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea', borderRadius: '4px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-xl font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}>
                {workoutModal.editing ? 'Edit Workout' : 'Add Workout'}
              </p>
              <button onClick={closeModal} className="text-xs uppercase tracking-widest"
                style={{ color: '#9c9895' }}>Cancel</button>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Date</label>
                  <input type="date" value={workoutForm.scheduledDate}
                    onChange={e => setWorkoutForm(p => ({ ...p, scheduledDate: e.target.value }))}
                    required className="w-full px-3 py-2.5 text-sm bg-white outline-none"
                    style={{ border: '1px solid #e0deda', color: '#1a1917' }} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Type</label>
                  <select value={workoutForm.workoutType}
                    onChange={e => setWorkoutForm(p => ({ ...p, workoutType: e.target.value as WorkoutType }))}
                    className="w-full px-3 py-2.5 text-sm bg-white outline-none"
                    style={{ border: '1px solid #e0deda', color: '#1a1917' }}>
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Distance (mi)</label>
                  <input type="number" step="0.1" value={workoutForm.targetDistanceMiles}
                    onChange={e => setWorkoutForm(p => ({ ...p, targetDistanceMiles: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                    style={{ border: '1px solid #e0deda', color: '#1a1917' }} placeholder="5.0" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Pace</label>
                  <input value={workoutForm.targetPaceDesc}
                    onChange={e => setWorkoutForm(p => ({ ...p, targetPaceDesc: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                    style={{ border: '1px solid #e0deda', color: '#1a1917' }} placeholder="7:30/mi" />
                </div>
              </div>

              {/* Notes — bigger textarea */}
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#9c9895' }}>Notes</label>
                <textarea value={workoutForm.description}
                  onChange={e => setWorkoutForm(p => ({ ...p, description: e.target.value }))}
                  rows={7} className="w-full px-3 py-2.5 text-sm bg-transparent outline-none resize-none leading-relaxed"
                  style={{ border: '1px solid #e0deda', color: '#1a1917' }}
                  placeholder="Workout notes, instructions, or cues..." />
              </div>

              {error && <p className="text-xs" style={{ color: '#fc4c02' }}>{error}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#1a1917', color: '#ffffff', borderRadius: '2px' }}>
                  {loading ? 'Saving...' : 'Save Workout'}
                </button>
                {workoutModal.editing && (
                  <button type="button" onClick={() => handleDeleteWorkout(workoutModal.editing!.id)}
                    disabled={loading}
                    className="px-4 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ border: '1px solid #e0deda', color: '#fc4c02', borderRadius: '2px' }}>
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
