'use client'

import { useState, useRef, useEffect } from 'react'
import { addDays, addWeeks, subWeeks, startOfWeek, format, isToday, isPast } from 'date-fns'

interface Workout {
  id: string
  scheduled_date: string
  workout_type: string
  target_distance_miles: number | null
  target_pace_desc: string | null
  description: string | null
  completed: boolean
  target_rpe?: number | null
  hr_zone_target?: string | null
  race_prep?: boolean | null
}

interface Props {
  workouts: Workout[]
  planStartDate: string
  planEndDate: string
  totalWeeks: number
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  easy:      { color: '#7fbf7f', label: 'Easy' },
  long:      { color: '#7090e8', label: 'Long' },
  tempo:     { color: '#e8a050', label: 'Tempo' },
  intervals: { color: '#e87070', label: 'Intervals' },
  recovery:  { color: '#a0c4a0', label: 'Recovery' },
  rest:      { color: '#c8c4c0', label: 'Rest' },
  race:      { color: '#e8d070', label: 'Race' },
}

const HR_ZONE_LABELS: Record<string, string> = {
  z1: 'Z1', z2: 'Z2', z3: 'Z3', z4: 'Z4', z5: 'Z5',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FELT_OPTIONS = [
  { value: 'below', label: 'Easier than expected' },
  { value: 'as_expected', label: 'As expected' },
  { value: 'above', label: 'Harder than expected' },
]

interface FeedbackState {
  rpe: string
  feltLike: string
  notes: string
  saving: boolean
  saved: boolean
}

interface InsightState {
  content: string | null
  loading: boolean
}

export default function WorkoutCalendar({ workouts, planStartDate, planEndDate, totalWeeks }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [localWorkouts, setLocalWorkouts] = useState(workouts)
  const [toggling, setToggling] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackState>>({})
  const [insights, setInsights] = useState<Record<string, InsightState>>({})

  const currentWeekMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const isFutureWeekBlocked = weekStart >= currentWeekMonday

  // Swipe gesture on mobile week list
  const mobileListRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const el = mobileListRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      // Only intercept horizontal swipes
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx > 0) {
          // Swipe right → previous week
          setWeekStart(w => subWeeks(w, 1))
        } else if (!isFutureWeekBlocked) {
          // Swipe left → next week (only if not blocked)
          setWeekStart(w => addWeeks(w, 1))
        }
      }

      touchStartX.current = null
      touchStartY.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [isFutureWeekBlocked])
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekNumber = Math.ceil(
    (weekStart.getTime() - new Date(planStartDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  ) + 1

  async function toggleComplete(workout: Workout) {
    setToggling(workout.id)
    const newCompleted = !workout.completed
    const res = await fetch(`/api/workouts/${workout.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted }),
    })
    if (res.ok) {
      setLocalWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, completed: newCompleted } : w))
      // Open feedback panel when marking done
      if (newCompleted && workout.workout_type !== 'rest') {
        setFeedbackOpen(workout.id)
        setFeedbacks(prev => ({
          ...prev,
          [workout.id]: prev[workout.id] ?? { rpe: '', feltLike: '', notes: '', saving: false, saved: false },
        }))
      }
    }
    setToggling(null)
  }

  async function saveFeedback(workoutId: string) {
    const fb = feedbacks[workoutId]
    if (!fb) return
    setFeedbacks(prev => ({ ...prev, [workoutId]: { ...prev[workoutId], saving: true } }))
    await fetch(`/api/workouts/${workoutId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rpe: fb.rpe ? parseInt(fb.rpe) : null, feltLike: fb.feltLike || null, notes: fb.notes || null }),
    })
    setFeedbacks(prev => ({ ...prev, [workoutId]: { ...prev[workoutId], saving: false, saved: true } }))
    setTimeout(() => setFeedbackOpen(null), 1200)
  }

  async function loadInsight(workoutId: string, activityId?: string) {
    if (!activityId) return
    setInsights(prev => ({ ...prev, [workoutId]: { content: null, loading: true } }))
    const res = await fetch(`/api/activities/${activityId}/insight`)
    const data = await res.json()
    setInsights(prev => ({ ...prev, [workoutId]: { content: data.insight ?? null, loading: false } }))
  }

  function renderWorkoutCard(workout: Workout, isMobile: boolean) {
    const config = TYPE_CONFIG[workout.workout_type] ?? TYPE_CONFIG.easy
    const past = isPast(new Date(workout.scheduled_date + 'T23:59')) && !isToday(new Date(workout.scheduled_date))
    const insight = insights[workout.id]
    const fb = feedbacks[workout.id]

    return (
      <div key={workout.id}>
        {/* Workout info */}
        <p className="text-xs font-medium mb-1" style={{ color: config.color }}>{config.label}</p>
        {workout.target_distance_miles && (
          <p className="text-xs tabular-nums mb-0.5" style={{ color: '#1a1917' }}>
            {workout.target_distance_miles} mi
          </p>
        )}
        {workout.target_pace_desc && (
          <p className="text-xs mb-0.5" style={{ color: '#6b6865' }}>{workout.target_pace_desc}</p>
        )}

        {/* RPE + HR Zone badges */}
        {(workout.target_rpe || workout.hr_zone_target || workout.race_prep) && (
          <div className="flex flex-wrap gap-1 mb-1">
            {workout.target_rpe && (
              <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#f0eeec', color: '#6b6865', borderRadius: '2px', fontSize: '10px' }}>
                RPE {workout.target_rpe}
              </span>
            )}
            {workout.hr_zone_target && (
              <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#f0eeec', color: '#6b6865', borderRadius: '2px', fontSize: '10px' }}>
                {HR_ZONE_LABELS[workout.hr_zone_target]}
              </span>
            )}
            {workout.race_prep && (
              <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#fff8f0', color: '#b45309', borderRadius: '2px', fontSize: '10px' }}>
                Race Prep
              </span>
            )}
          </div>
        )}

        {workout.description && (
          <p className={`text-xs leading-4 ${isMobile ? '' : 'line-clamp-2'} mb-1`} style={{ color: '#9c9895' }}>
            {workout.description}
          </p>
        )}

        {/* Complete toggle */}
        {workout.workout_type !== 'rest' && (
          <button
            onClick={() => toggleComplete(workout)}
            disabled={toggling === workout.id}
            className="mt-1 flex items-center gap-1.5 text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
            style={{ color: workout.completed ? '#22c55e' : '#9c9895' }}
          >
            <span
              className="flex items-center justify-center w-4 h-4 shrink-0"
              style={{
                border: `1px solid ${workout.completed ? '#22c55e' : '#c8c4c0'}`,
                borderRadius: '2px',
                backgroundColor: workout.completed ? '#22c55e22' : 'transparent',
              }}
            >
              {workout.completed && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {workout.completed ? 'Done' : 'Mark done'}
          </button>
        )}

        {/* Feedback panel */}
        {feedbackOpen === workout.id && workout.completed && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #ebebea' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9c9895' }}>How did it go?</p>

            {/* RPE */}
            <div className="mb-2">
              <p className="text-xs mb-1.5" style={{ color: '#6b6865' }}>Effort (RPE 1–10)</p>
              <div className="flex gap-1 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setFeedbacks(prev => ({ ...prev, [workout.id]: { ...prev[workout.id], rpe: String(n) } }))}
                    className="w-6 h-6 text-xs transition-colors"
                    style={{
                      borderRadius: '2px',
                      border: '1px solid',
                      borderColor: fb?.rpe === String(n) ? '#1a1917' : '#ebebea',
                      backgroundColor: fb?.rpe === String(n) ? '#1a1917' : 'transparent',
                      color: fb?.rpe === String(n) ? '#fff' : '#6b6865',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Felt like */}
            <div className="mb-2">
              <div className="flex gap-1 flex-wrap">
                {FELT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setFeedbacks(prev => ({ ...prev, [workout.id]: { ...prev[workout.id], feltLike: o.value } }))}
                    className="text-xs px-2 py-1 transition-colors"
                    style={{
                      borderRadius: '2px',
                      border: '1px solid',
                      borderColor: fb?.feltLike === o.value ? '#1a1917' : '#ebebea',
                      backgroundColor: fb?.feltLike === o.value ? '#f5f4f2' : 'transparent',
                      color: fb?.feltLike === o.value ? '#1a1917' : '#9c9895',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <textarea
              value={fb?.notes ?? ''}
              onChange={e => setFeedbacks(prev => ({ ...prev, [workout.id]: { ...prev[workout.id], notes: e.target.value } }))}
              rows={2}
              placeholder="Any notes..."
              className="w-full px-2 py-1.5 text-xs bg-transparent outline-none resize-none leading-relaxed mb-2"
              style={{ border: '1px solid #ebebea', color: '#3a3733', borderRadius: '2px' }}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => saveFeedback(workout.id)}
                disabled={fb?.saving}
                className="text-xs px-3 py-1.5 uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#1a1917', color: '#fff', borderRadius: '2px' }}
              >
                {fb?.saving ? 'Saving...' : fb?.saved ? '✓ Saved' : 'Save'}
              </button>
              <button
                onClick={() => setFeedbackOpen(null)}
                className="text-xs uppercase tracking-widest"
                style={{ color: '#9c9895' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Activity insight */}
        {workout.completed && past && insight?.content && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid #ebebea' }}>
            <p className="text-xs leading-4 italic" style={{ color: '#9c9895' }}>{insight.content}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Week header — sticky so it stays visible while scrolling */}
      <div
        className="flex items-center justify-between mb-6 sticky top-0 z-10 py-3 -mx-1 px-1"
        style={{ backgroundColor: '#f5f4f2' }}
      >
        <button
          onClick={() => setWeekStart(w => subWeeks(w, 1))}
          className="text-xs uppercase tracking-widest px-3 py-1.5 transition-colors hover:text-[#1a1917]"
          style={{ color: '#9c9895', border: '1px solid #ebebea', borderRadius: '2px' }}
        >
          ← Prev
        </button>

        <div className="text-center">
          <p className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
            {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
          {weekNumber >= 1 && weekNumber <= totalWeeks && (
            <p className="text-xs mt-1" style={{ color: '#c8c4c0' }}>
              Week {weekNumber} of {totalWeeks}
            </p>
          )}
        </div>

        {isFutureWeekBlocked ? (
          <div style={{ width: '60px' }} />
        ) : (
          <button
            onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="text-xs uppercase tracking-widest px-3 py-1.5 transition-colors hover:text-[#1a1917]"
            style={{ color: '#9c9895', border: '1px solid #ebebea', borderRadius: '2px' }}
          >
            Next →
          </button>
        )}
      </div>

      {/* Mobile: vertical day list — swipe left/right to change week */}
      <div ref={mobileListRef} className="md:hidden space-y-2">
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const workout = localWorkouts.find(w => w.scheduled_date === dayStr)
          const config = workout ? (TYPE_CONFIG[workout.workout_type] ?? TYPE_CONFIG.easy) : null
          const past = isPast(day) && !isToday(day)

          return (
            <div
              key={dayStr}
              className="flex items-start gap-4 p-3"
              style={{
                backgroundColor: '#ffffff',
                border: isToday(day) ? '1px solid #1a1917' : '1px solid #ebebea',
                borderLeft: config ? `3px solid ${config.color}` : '3px solid #ebebea',
                opacity: past && !workout ? 0.4 : 1,
              }}
            >
              <div className="shrink-0 w-10">
                <p className="text-xs uppercase tracking-widest" style={{ color: isToday(day) ? '#1a1917' : '#9c9895' }}>
                  {DAYS[i]}
                </p>
                <p className="text-xs tabular-nums" style={{ color: '#c8c4c0' }}>{format(day, 'd')}</p>
              </div>
              <div className="flex-1 min-w-0">
                {workout && config ? (
                  renderWorkoutCard(workout, true)
                ) : (
                  <p className="text-xs" style={{ color: '#c8c4c0' }}>Rest</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const workout = localWorkouts.find(w => w.scheduled_date === dayStr)
          const config = workout ? (TYPE_CONFIG[workout.workout_type] ?? TYPE_CONFIG.easy) : null
          const past = isPast(day) && !isToday(day)

          return (
            <div
              key={dayStr}
              className="flex flex-col min-h-32 p-3"
              style={{
                backgroundColor: '#ffffff',
                border: isToday(day) ? '1px solid #1a1917' : '1px solid #ebebea',
                borderTop: config ? `3px solid ${config.color}` : isToday(day) ? '3px solid #1a1917' : '1px solid #ebebea',
                opacity: past && !workout ? 0.4 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: isToday(day) ? '#1a1917' : '#9c9895' }}>
                  {DAYS[i]}
                </p>
                <p className="text-xs tabular-nums" style={{ color: '#c8c4c0' }}>{format(day, 'd')}</p>
              </div>

              {workout && config ? (
                <div className="flex-1 flex flex-col">
                  {renderWorkoutCard(workout, false)}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#c8c4c0' }}>Rest</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-5">
        {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'rest').map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
