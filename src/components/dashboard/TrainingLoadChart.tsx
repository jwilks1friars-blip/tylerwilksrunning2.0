'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

interface WeekData {
  week: string
  planned: number
  actual: number
}

interface Props {
  data: WeekData[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2.5" style={{ backgroundColor: '#1a1917', borderRadius: '4px' }}>
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9c9895' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs tabular-nums" style={{ color: p.name === 'actual' ? '#7090e8' : '#c8c4c0' }}>
          {p.name === 'actual' ? 'Actual' : 'Planned'}: {p.value.toFixed(1)} mi
        </p>
      ))}
    </div>
  )
}

export default function TrainingLoadChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={10} barCategoryGap="30%">
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: '#9c9895', fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

        {/* Planned (background) */}
        <Bar dataKey="planned" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.actual > 0 ? '#e8e4e0' : '#f0eeec'} />
          ))}
        </Bar>

        {/* Actual (foreground) */}
        <Bar dataKey="actual" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => {
            const pct = entry.planned > 0 ? entry.actual / entry.planned : 1
            const color = entry.actual === 0 ? '#ebebea'
              : pct >= 0.9 ? '#7090e8'
              : pct >= 0.7 ? '#e8a050'
              : '#e87070'
            return <Cell key={i} fill={color} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
