'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

type Athlete = {
  id: string
  full_name: string | null
  email: string | null
  plan_tier: string | null
}

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  read_at: string | null
}

type UnreadCounts = {
  total: number
  bySender: Record<string, number>
}

export default function CoachConversation({
  coachId,
  athletes,
  initialAthleteId,
}: {
  coachId: string
  athletes: Athlete[]
  initialAthleteId: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const athleteId = searchParams.get('athlete') ?? initialAthleteId
  const selectedAthlete = athletes.find(a => a.id === athleteId) ?? null

  const [messages, setMessages] = useState<Message[]>([])
  const [unread, setUnread] = useState<UnreadCounts>({ total: 0, bySender: {} })
  const [input, setInput] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/messages?with=${id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages ?? [])
    }
  }, [])

  const fetchUnread = useCallback(async () => {
    const res = await fetch('/api/messages/unread-counts')
    if (res.ok) {
      const data = await res.json()
      setUnread(data)
    }
  }, [])

  // Load messages when selected athlete changes
  useEffect(() => {
    if (!athleteId) return
    fetchMessages(athleteId)
    // Clear polling if any, restart
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => fetchMessages(athleteId), 10_000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [athleteId, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch unread counts on mount and after sending
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 15_000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  const selectAthlete = (id: string) => {
    router.push(`/coach/messages?athlete=${id}`)
  }

  const handleSend = async () => {
    if (!input.trim() || !athleteId || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: athleteId, content: input.trim(), sendEmail }),
      })
      if (res.ok) {
        setInput('')
        await fetchMessages(athleteId)
        await fetchUnread()
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0" style={{ minHeight: 0 }}>
      {/* Left: Athlete list */}
      <div
        className="w-72 shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: '1px solid #ebebea' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #ebebea' }}>
          <h2
            className="text-xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
          >
            Messages
          </h2>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#9c9895' }}>
            {athletes.length} {athletes.length === 1 ? 'athlete' : 'athletes'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {athletes.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: '#9c9895' }}>No athletes yet.</p>
          ) : (
            athletes.map(athlete => {
              const unreadCount = unread.bySender[athlete.id] ?? 0
              const isSelected = athlete.id === athleteId

              return (
                <button
                  key={athlete.id}
                  onClick={() => selectAthlete(athlete.id)}
                  className="w-full text-left px-5 py-4 transition-colors flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: isSelected ? '#f5f4f2' : 'transparent',
                    borderBottom: '1px solid #ebebea',
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-sm truncate"
                      style={{ color: unreadCount > 0 ? '#1a1917' : '#6b6865' }}
                    >
                      {athlete.full_name ?? athlete.email ?? 'Unnamed'}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#9c9895' }}>
                      {athlete.plan_tier}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span
                      className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: '#fc4c02', color: '#fff', minWidth: '20px', textAlign: 'center' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right: Conversation */}
      {!selectedAthlete ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#9c9895' }}>
            Select an athlete to start a conversation.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div
            className="px-6 py-4 shrink-0 flex items-center gap-4"
            style={{ borderBottom: '1px solid #ebebea' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: '#1a1917' }}>
                {selectedAthlete.full_name ?? selectedAthlete.email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9c9895' }}>
                {selectedAthlete.email}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#9c9895' }}>
                No messages yet. Say something!
              </p>
            )}
            {messages.map(msg => {
              const isCoach = msg.sender_id === coachId
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: isCoach ? '#fc4c02' : '#f0eeec',
                      color: isCoach ? '#fff' : '#1a1917',
                      borderRadius: '4px',
                    }}
                  >
                    <p>{msg.content}</p>
                    <p
                      className="text-xs mt-1 opacity-70"
                      style={{ textAlign: isCoach ? 'right' : 'left' }}
                    >
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid #ebebea' }}>
            <div className="flex gap-3 items-end">
              <textarea
                className="flex-1 resize-none text-sm px-4 py-3 outline-none"
                style={{
                  backgroundColor: '#f9f8f7',
                  border: '1px solid #e0deda',
                  color: '#1a1917',
                  borderRadius: '2px',
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
                placeholder="Message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-5 py-3 text-xs uppercase tracking-widest transition-opacity"
                style={{
                  backgroundColor: '#fc4c02',
                  color: '#fff',
                  borderRadius: '2px',
                  opacity: !input.trim() || sending ? 0.4 : 1,
                  cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Send
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs" style={{ color: '#9c9895' }}>
                Enter to send · Shift+Enter for new line
              </p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  style={{ accentColor: '#fc4c02', width: '14px', height: '14px' }}
                />
                <span className="text-xs uppercase tracking-widest" style={{ color: sendEmail ? '#1a1917' : '#9c9895' }}>
                  Also send via email
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
