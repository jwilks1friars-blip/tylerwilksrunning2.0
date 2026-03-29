'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import LogRunModal from './LogRunModal'

export default function LogRunFAB() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* FAB — mobile only, floats above bottom tab bar */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Log a run"
        className="md:hidden fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-90 active:opacity-80"
        style={{
          width: '56px',
          height: '56px',
          right: '16px',
          bottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)',
          backgroundColor: '#fc4c02',
        }}
      >
        <Plus size={24} color="white" strokeWidth={2} />
      </button>

      {/* Modal — controlled by FAB state */}
      <LogRunModal
        externalOpen={open}
        onExternalClose={() => setOpen(false)}
      />
    </>
  )
}
