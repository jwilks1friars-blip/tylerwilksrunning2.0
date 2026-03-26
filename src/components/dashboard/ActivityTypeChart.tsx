'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DataPoint {
  type: string
  miles: number
  color: string
}

interface Props {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 text-xs" style={{ backgroundColor: '#1e1b18', border: '1px solid #2a2521', color: '#f5f2ee', borderRadius: '4px' }}>
      <p className="uppercase tracking-widest mb-1" style={{ color: '#6b6560' }}>{label}</p>
      <p>{payload[0].value} mi</p>
    </div>
  )
}

export default function ActivityTypeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="type"
          tick={{ fill: '#6b6560', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b6560', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1a1714' }} />
        <Bar dataKey="miles" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
