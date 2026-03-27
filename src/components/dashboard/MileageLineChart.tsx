'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

interface DataPoint {
  week: string
  miles: number
  goal?: number
}

interface Props {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 text-xs" style={{ backgroundColor: '#ffffff', border: '1px solid #e8e7e5', color: '#1a1917', borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <p className="uppercase tracking-widest mb-1" style={{ color: '#9c9895' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'miles' ? 'Miles' : 'Goal'}: {p.value} mi
        </p>
      ))}
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="flex items-center gap-4 justify-end pr-2 mb-2">
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-0.5 rounded" style={{ backgroundColor: '#7090e8' }} />
        <span className="text-xs" style={{ color: '#9c9895' }}>Miles</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-0.5 rounded" style={{ backgroundColor: '#d0ccc8', borderTop: '2px dashed #d0ccc8' }} />
        <span className="text-xs" style={{ color: '#9c9895' }}>Goal</span>
      </div>
    </div>
  )
}

export default function MileageLineChart({ data }: Props) {
  const hasGoal = data.some(d => d.goal !== undefined)
  return (
    <div>
      <CustomLegend />
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#ebebea" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#9c9895', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9c9895', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e8e7e5', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="miles"
            stroke="#7090e8"
            strokeWidth={2}
            dot={{ fill: '#7090e8', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#7090e8' }}
          />
          {hasGoal && (
            <Line
              type="monotone"
              dataKey="goal"
              stroke="#d0ccc8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
