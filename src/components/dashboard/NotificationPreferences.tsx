'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

interface Props {
  initialWeeklyInsight: boolean
  initialNewMessage: boolean
}

export default function NotificationPreferences({ initialWeeklyInsight, initialNewMessage }: Props) {
  const { toast } = useToast()
  const [weeklyInsight, setWeeklyInsight] = useState(initialWeeklyInsight)
  const [newMessage, setNewMessage] = useState(initialNewMessage)
  const [saving, setSaving] = useState(false)

  async function toggle(field: 'weekly' | 'message', value: boolean) {
    const next = value
    if (field === 'weekly') setWeeklyInsight(next)
    else setNewMessage(next)

    setSaving(true)
    const res = await fetch('/api/profile/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notify_weekly_insight: field === 'weekly' ? next : weeklyInsight,
        notify_new_message: field === 'message' ? next : newMessage,
      }),
    })
    setSaving(false)

    if (!res.ok) {
      // Revert on error
      if (field === 'weekly') setWeeklyInsight(!next)
      else setNewMessage(!next)
      toast('Failed to save preferences', 'error')
    }
  }

  return (
    <div className="p-5 space-y-4" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
      <ToggleRow
        label="Weekly coaching insight emails"
        description="Get an email when your coach publishes your weekly note"
        checked={weeklyInsight}
        onChange={v => toggle('weekly', v)}
        disabled={saving}
      />
      <div style={{ borderTop: '1px solid #1e1b18' }} />
      <ToggleRow
        label="New message emails"
        description="Get an email when your coach sends you a message"
        checked={newMessage}
        onChange={v => toggle('message', v)}
        disabled={saving}
      />
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: '#f5f2ee' }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: '#6b6560' }}>{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className="shrink-0 w-10 h-5 rounded-full transition-colors disabled:opacity-50 relative"
        style={{
          backgroundColor: checked ? '#7fbf7f' : '#2a2521',
          border: '1px solid ' + (checked ? '#4a7a4a' : '#3a3633'),
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            backgroundColor: checked ? '#fff' : '#6b6560',
            transform: checked ? 'translateX(21px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  )
}
