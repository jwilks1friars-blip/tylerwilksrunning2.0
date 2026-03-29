'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

export default function PullToRefreshWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const containerRef = useRef<HTMLElement | null>(null)

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: () => router.refresh(),
    containerRef,
  })

  const showIndicator = isPulling || isRefreshing
  const indicatorOpacity = Math.min(pullDistance / 80, 1)
  const THRESHOLD = 80

  return (
    <main
      ref={containerRef}
      className="flex-1 p-6 pb-24 md:pb-8 md:p-8 overflow-auto"
    >
      {/* Pull indicator — mobile only */}
      <div
        className="md:hidden flex items-center justify-center pointer-events-none"
        style={{
          height: showIndicator ? `${Math.max(pullDistance * 0.5, isRefreshing ? 32 : 0)}px` : '0px',
          overflow: 'hidden',
          transition: isPulling ? 'none' : 'height 0.2s ease',
          opacity: isRefreshing ? 1 : indicatorOpacity,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid #fc4c02',
            borderTopColor: isRefreshing || pullDistance >= THRESHOLD ? '#fc4c02' : 'transparent',
            animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
          }}
        />
      </div>

      {/* Spin keyframe via inline style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {children}
    </main>
  )
}
