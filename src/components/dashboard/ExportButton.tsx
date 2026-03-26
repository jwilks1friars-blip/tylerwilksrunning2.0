'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function ExportButton() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<'csv' | 'json' | null>(null)

  async function handleExport(fmt: 'csv' | 'json') {
    setLoading(fmt)
    try {
      const res = await fetch(`/api/export?format=${fmt}`)
      if (!res.ok) {
        const data = await res.json()
        toast(data.error ?? 'Export failed', 'error')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const cd = res.headers.get('content-disposition') ?? ''
      const match = cd.match(/filename="([^"]+)"/)
      a.download = match?.[1] ?? `export.${fmt}`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
      toast(`Data exported as ${fmt.toUpperCase()}`, 'success')
    } finally {
      setLoading(null)
    }
  }

  const btnStyle = {
    backgroundColor: '#141210',
    border: '1px solid #2a2521',
    color: '#6b6560',
    borderRadius: '2px',
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleExport('csv')}
        disabled={!!loading}
        className="px-4 py-2.5 text-xs uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
        style={btnStyle}
      >
        {loading === 'csv' ? 'Exporting…' : 'Export CSV'}
      </button>
      <button
        onClick={() => handleExport('json')}
        disabled={!!loading}
        className="px-4 py-2.5 text-xs uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
        style={btnStyle}
      >
        {loading === 'json' ? 'Exporting…' : 'Export JSON'}
      </button>
    </div>
  )
}
