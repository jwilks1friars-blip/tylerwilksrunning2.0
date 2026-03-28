'use client'

import { useState } from 'react'
import { addDays, addWeeks, subWeeks, startOfWeek, format, isSameDay, isToday, isPast } from 'date-fns'

interface Workout {
  id: string
  scheduled_date: string
  workout_type: string
  target_distance_miles: number | null
  target_pace_desc: string | null
  description: string | null
  completed: boolean
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WorkoutCalendar({ workouts, planStartDate, planEndDate, totalWeeks }: Props) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [localWorkouts, setLocalWorkouts] = useState(workouts)
  const [toggling, setToggling] = useState<string | null>(null)

  const currentWeekMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const isFutureWeekBlocked = weekStart >= currentWeekMonday

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
      setLocalWorkouts(prev =>
        prev.map(w => w.id === workout.id ? { ...w, completed: newCompleted } : w)
      )
    }
    setToggling(null)
  }

  return (
    <div>
      {/* Week header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Mobile: vertical day list */}
      <div className="md:hidden space-y-2">
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
                backgroundColor: '#141210',
                border: isToday(day) ? '1px solid #e8e0d4' : '1px solid #1e1b18',
                borderLeft: config ? `3px solid ${config.color}` : '3px solid #1e1b18',
                opacity: past && !workout ? 0.4 : 1,
              }}
            >
              <div className="shrink-0 w-10">
                <p className="text-xs uppercase tracking-widest" style={{ color: isToday(day) ? '#f5f2ee' : '#6b6560' }}>
                  {DAYS[i]}
                </p>
                <p className="text-xs tabular-nums" style={{ color: '#2a2521' }}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                {workout && config ? (
                  <>
                    <p className="text-xs font-medium" style={{ color: config.color }}>{config.label}</p>
                    {workout.target_distance_miles && (
                      <p className="text-xs tabular-nums" style={{ color: '#f5f2ee' }}>
                        {workout.target_distance_miles} mi
                      </p>
                    )}
                    {workout.description && (
                      <p className="text-xs mt-0.5 leading-4" style={{ color: '#6b6560' }}>
                        {workout.description}
                      </p>
                    )}
                    {workout.workout_type !== 'rest' && (
                      <button
                        onClick={() => toggleComplete(workout)}
                        disabled={toggling === workout.id}
                        className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
                        style={{
                          color: workout.completed ? '#7fbf7f' : '#3a3633',
                          opacity: toggling === workout.id ? 0.4 : 1,
                        }}
                      >
                        <span
                          className="flex items-center justify-center w-4 h-4 shrink-0"
                          style={{
                            border: `1px solid ${workout.completed ? '#7fbf7f' : '#3a3633'}`,
                            borderRadius: '2px',
                            backgroundColor: workout.completed ? '#7fbf7f22' : 'transparent',
                          }}
                        >
                          {workout.completed && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="#7fbf7f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {workout.completed ? 'Done' : 'Mark done'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-xs" style={{ color: '#2a2521' }}>Rest</p>
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
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: isToday(day) ? '#1a1917' : '#9c9895' }}>
                  {DAYS[i]}
                </p>
                <p className="text-xs tabular-nums" style={{ color: '#c8c4c0' }}>
                  {format(day, 'd')}
                </p>
              </div>

              {/* Workout */}
              {workout && config && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: config.color }}>
                      {config.label}
                    </p>
                    {workout.target_distance_miles && (
                      <p className="text-xs tabular-nums mb-1" style={{ color: '#1a1917' }}>
                        {workout.target_distance_miles} mi
                      </p>
                    )}
                    {workout.description && (
                      <p className="text-xs leading-4 line-clamp-3" style={{ color: '#9c9895' }}>
                        {workout.description}
                      </p>
                    )}
                  </div>

                  {/* Complete toggle */}
                  {workout.workout_type !== 'rest' && (
                    <button
                      onClick={() => toggleComplete(workout)}
                      disabled={toggling === workout.id}
                      className="mt-3 self-start flex items-center gap-1.5 text-xs uppercase tracking-widest transition-opacity disabled:opacity-40"
                      style={{
                        color: workout.completed ? '#22c55e' : '#9c9895',
                        opacity: toggling === workout.id ? 0.4 : 1,
                      }}
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
                </div>
              )}

              {/* Rest day */}
              {(!workout || workout.workout_type === 'rest') && (
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
            <span className="text-xs uppercase tracking-widest" style={{ color: '#9c9895' }}>
              {val.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
