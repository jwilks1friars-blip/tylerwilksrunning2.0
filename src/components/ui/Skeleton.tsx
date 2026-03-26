/**
 * Skeleton screen components for loading states.
 * Match the visual style of the app (dark, monochrome).
 */

export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        backgroundColor: '#1e1b18',
        borderRadius: '2px',
        ...style,
      }}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{ height: '12px', width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
    >
      <Skeleton style={{ height: '10px', width: '30%', marginBottom: '12px' }} />
      <Skeleton style={{ height: '32px', width: '60%', marginBottom: '8px' }} />
      <Skeleton style={{ height: '10px', width: '40%' }} />
    </div>
  )
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 ${className}`}
    >
      <div className="flex-1 space-y-1.5">
        <Skeleton style={{ height: '12px', width: '50%' }} />
        <Skeleton style={{ height: '10px', width: '30%' }} />
      </div>
      <Skeleton style={{ height: '12px', width: '50px' }} />
      <Skeleton style={{ height: '12px', width: '50px' }} />
      <Skeleton style={{ height: '12px', width: '40px' }} />
    </div>
  )
}

/** Spinner for inline / button loading states */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
