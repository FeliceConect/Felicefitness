'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Loader2, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const y = useMotionValue(0)

  const opacity = useTransform(y, [0, threshold], [0, 1])
  const scale = useTransform(y, [0, threshold], [0.5, 1])
  const rotate = useTransform(y, [0, threshold], [0, 180])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      if (containerRef.current?.scrollTop !== 0) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current

      if (diff > 0) {
        y.set(Math.min(diff * 0.5, threshold * 1.5))
      }
    },
    [isRefreshing, y, threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    if (y.get() >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      y.set(threshold)

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        y.set(0)
      }
    } else {
      y.set(0)
    }
  }, [y, threshold, isRefreshing, onRefresh])

  return (
    <div
      ref={containerRef}
      className={cn('h-full overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ height: y, opacity }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div
          style={{ scale }}
          className="text-primary"
        >
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <motion.div style={{ rotate }}>
              <ArrowDown className="w-6 h-6" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {children}
    </div>
  )
}
