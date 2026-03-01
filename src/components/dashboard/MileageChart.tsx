'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { day: string; miles: number }[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 text-xs" style={{ backgroundColor: '#1e1b18', border: '1px solid #2a2521', color: '#f5f2ee' }}>
      <p className="uppercase tracking-widest mb-1" style={{ color: '#6b6560' }}>{label}</p>
      <p>{payload[0].value} mi</p>
    </div>
  )
}

export default function MileageChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={24} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#6b6560', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b6560', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1b18' }} />
        <Bar dataKey="miles" fill="#e8e0d4" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
