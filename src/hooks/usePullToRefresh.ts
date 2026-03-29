'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const THRESHOLD = 80 // px to pull before triggering refresh
const MAX_PULL = 120  // max visual pull distance

interface UsePullToRefreshOptions {
  onRefresh: () => void
  containerRef: React.RefObject<HTMLElement | null>
}

interface PullToRefreshState {
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
}

export function usePullToRefresh({ onRefresh, containerRef }: UsePullToRefreshOptions): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const touchStartY = useRef<number | null>(null)
  const isRefreshingRef = useRef(false)

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    setPullDistance(0)
    setIsPulling(false)
    onRefresh()
    // Give it a moment for the visual to show, then reset
    await new Promise(r => setTimeout(r, 1000))
    setIsRefreshing(false)
    isRefreshingRef.current = false
  }, [onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || isRefreshingRef.current) return
      if (el.scrollTop > 0) {
        touchStartY.current = null
        return
      }

      const delta = e.touches[0].clientY - touchStartY.current
      if (delta <= 0) return

      e.preventDefault()
      const clamped = Math.min(delta, MAX_PULL)
      setIsPulling(true)
      setPullDistance(clamped)
    }

    const onTouchEnd = () => {
      if (touchStartY.current === null) return
      const current = pullDistance
      touchStartY.current = null

      if (current >= THRESHOLD) {
        handleRefresh()
      } else {
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [containerRef, handleRefresh, pullDistance])

  return { isPulling, pullDistance, isRefreshing }
}
