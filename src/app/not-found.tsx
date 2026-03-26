import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#0a0908' }}
    >
      <p
        className="text-8xl md:text-[120px] font-semibold uppercase tracking-widest mb-4 leading-none"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1e1b18' }}
      >
        404
      </p>
      <h1
        className="text-2xl md:text-3xl font-semibold uppercase tracking-widest mb-4"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
      >
        Page not found
      </h1>
      <p className="text-sm mb-10 max-w-sm" style={{ color: '#6b6560' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#6b6560' }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
