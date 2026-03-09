'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format } from 'date-fns'

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  read_at: string | null
}

export default function AthleteConversation({
  userId,
  coachId,
}: {
  userId: string
  coachId: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!coachId) return
    const res = await fetch(`/api/messages?with=${coachId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages ?? [])
    }
  }, [coachId])

  useEffect(() => {
    if (!coachId) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 10_000)
    return () => clearInterval(interval)
  }, [fetchMessages, coachId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: coachId, content: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        await fetchMessages()
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
    <div
      className="flex flex-col"
      style={{
        backgroundColor: '#141210',
        border: '1px solid #1e1b18',
        height: 'calc(100vh - 220px)',
        minHeight: '400px',
      }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: '#6b6560' }}>
            No messages yet. Send your coach a message!
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === userId
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  backgroundColor: isMe ? '#fc4c02' : '#1e1b18',
                  color: isMe ? '#fff' : '#e8e0d4',
                  borderRadius: '4px',
                }}
              >
                {!isMe && (
                  <p className="text-xs font-medium mb-1 opacity-70">Coach</p>
                )}
                <p>{msg.content}</p>
                <p
                  className="text-xs mt-1 opacity-70"
                  style={{ textAlign: isMe ? 'right' : 'left' }}
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
      <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1e1b18' }}>
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 resize-none text-sm px-4 py-3 outline-none"
            style={{
              backgroundColor: '#0a0908',
              border: '1px solid #2a2521',
              color: '#f5f2ee',
              borderRadius: '2px',
              minHeight: '48px',
              maxHeight: '120px',
            }}
            placeholder="Message your coach..."
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
        <p className="text-xs mt-2" style={{ color: '#6b6560' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
