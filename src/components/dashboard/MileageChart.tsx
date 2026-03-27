'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { day: string; miles: number }[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 text-xs" style={{ backgroundColor: '#ffffff', border: '1px solid #e8e7e5', color: '#1a1917', borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <p className="uppercase tracking-widest mb-1" style={{ color: '#9c9895' }}>{label}</p>
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
          tick={{ fill: '#9c9895', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#9c9895', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f4f2' }} />
        <Bar dataKey="miles" fill="#7090e8" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
