'use client'

import { useState } from 'react'
import LogRunModal from './LogRunModal'

export default function LogRunButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
        style={{ border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }}
      >
        + Log a Run
      </button>
      {open && <LogRunModal onClose={() => setOpen(false)} />}
    </>
  )
}
