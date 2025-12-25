'use client'

import { useState, useRef } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SwipeAction {
  icon: React.ReactNode
  color: string
  onAction: () => void
}

interface SwipeActionsProps {
  children: React.ReactNode
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  threshold?: number
  className?: string
}

export function SwipeActions({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  className,
}: SwipeActionsProps) {
  const [dragX, setDragX] = useState(0)
  const constraintsRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > threshold && leftAction) {
      leftAction.onAction()
    } else if (info.offset.x < -threshold && rightAction) {
      rightAction.onAction()
    }
    setDragX(0)
  }

  return (
    <div ref={constraintsRef} className={cn('relative overflow-hidden', className)}>
      {/* Left action background */}
      {leftAction && dragX > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-start px-4"
          style={{ backgroundColor: leftAction.color, width: Math.abs(dragX) }}
        >
          {leftAction.icon}
        </div>
      )}

      {/* Right action background */}
      {rightAction && dragX < 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4"
          style={{ backgroundColor: rightAction.color, width: Math.abs(dragX) }}
        >
          {rightAction.icon}
        </div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className="relative bg-background-card z-10"
      >
        {children}
      </motion.div>
    </div>
  )
}
