import Link from 'next/link'

interface Props {
  currentPage: number
  totalPages: number
  basePath: string
  /** Extra query params to preserve (e.g. { filter: 'run' }) */
  extraParams?: Record<string, string>
}

export default function Pagination({ currentPage, totalPages, basePath, extraParams = {} }: Props) {
  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams({ ...extraParams, page: String(page) })
    return `${basePath}?${params}`
  }

  const pages = buildPageNumbers(currentPage, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-3 py-2 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#6b6560' }}
        >
          ← Prev
        </Link>
      )}

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-xs" style={{ color: '#3a3633' }}>…</span>
        ) : (
          <Link
            key={page}
            href={buildHref(page as number)}
            className="w-8 h-8 flex items-center justify-center text-xs transition-opacity"
            style={{
              color: page === currentPage ? '#f5f2ee' : '#6b6560',
              backgroundColor: page === currentPage ? '#1e1b18' : 'transparent',
              borderRadius: '2px',
            }}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-3 py-2 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#6b6560' }}
        >
          Next →
        </Link>
      )}
    </nav>
  )
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
