'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function EditBlogPostPage() {
  const router = useRouter()
  const { slug: originalSlug } = useParams<{ slug: string }>()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('Training')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/blog/${originalSlug}`)
      if (!res.ok) { setError('Post not found.'); setLoading(false); return }
      const { post } = await res.json()
      setTitle(post.title ?? '')
      setSlug(post.slug ?? '')
      setDate(post.date ?? '')
      setCategory(post.category ?? 'Training')
      setExcerpt(post.excerpt ?? '')
      // Reconstruct body text from sections
      const reconstructed = (post.sections ?? [])
        .map((s: { heading?: string; body: string }) =>
          s.heading ? `## ${s.heading}\n${s.body}` : s.body
        )
        .join('\n\n')
      setBody(reconstructed)
      setLoading(false)
    }
    load()
  }, [originalSlug])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim() || !body.trim()) {
      setError('Title, slug, and body are all required.')
      return
    }
    setError(null)
    setSaving(true)

    const res = await fetch(`/api/blog/${originalSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, date, category, excerpt, body }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong.')
      setSaving(false)
      return
    }

    router.push('/coach/blog')
  }

  const inputStyle = {
    backgroundColor: '#141210',
    border: '1px solid #2a2521',
    color: '#f5f2ee',
    borderRadius: '2px',
  } as const

  const labelStyle = { color: '#e8e0d4' } as const

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm" style={{ color: '#6b6560' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h2
        className="text-3xl font-semibold uppercase tracking-widest mb-8"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
      >
        Edit Post
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={labelStyle}>
            Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={labelStyle}>
            Slug <span style={{ color: '#6b6560' }}>(URL path)</span>
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
            className="w-full px-4 py-3 text-sm outline-none font-mono"
            style={inputStyle}
          />
          {slug && (
            <p className="text-xs mt-1.5" style={{ color: '#2a2521' }}>
              tylerwilksrunning.com/blog/{slug}
            </p>
          )}
        </div>

        {/* Date + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={labelStyle}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={labelStyle}>
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={inputStyle}
            >
              {['Training', 'Racing', 'Data', 'Nutrition', 'Gear', 'Mindset'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={labelStyle}>
            Excerpt <span style={{ color: '#6b6560' }}>(shown on blog listing page)</span>
          </label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 text-sm outline-none resize-none leading-7"
            style={inputStyle}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={labelStyle}>
            Body
          </label>
          <p className="text-xs mb-3" style={{ color: '#6b6560' }}>
            Start a new section with <code style={{ color: '#e8e0d4' }}>## Section Heading</code> on its own line.
          </p>
          <textarea
            required
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 text-sm outline-none resize-y leading-7 font-mono"
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="text-xs py-2" style={{ color: '#e8a0a0' }}>{error}</p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs uppercase tracking-widest font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/coach/blog')}
            className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
            style={{ color: '#6b6560' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
