'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() =>
            setToasts(prev => prev.filter(x => x.id !== t.id))
          } />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { bg: string; color: string; border: string }> = {
  success: { bg: '#141210', color: '#7fbf7f', border: '#2a4a2a' },
  error:   { bg: '#141210', color: '#e8a0a0', border: '#4a2a2a' },
  info:    { bg: '#141210', color: '#e8e0d4', border: '#2a2521' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const styles = VARIANT_STYLES[toast.variant]

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 text-sm pointer-events-auto"
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        borderRadius: '2px',
        minWidth: '260px',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.2s ease',
      }}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="opacity-50 hover:opacity-100 transition-opacity text-xs leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
