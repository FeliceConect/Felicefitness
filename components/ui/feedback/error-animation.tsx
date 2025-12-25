'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface ErrorAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onComplete?: () => void
}

export function ErrorAnimation({
  size = 'md',
  className,
  onComplete,
}: ErrorAnimationProps) {
  const prefersReducedMotion = useReducedMotion()

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  if (prefersReducedMotion) {
    return (
      <div className={cn('flex items-center justify-center', sizes[size], className)}>
        <div className="bg-error rounded-full p-2">
          <X size={iconSizes[size]} className="text-error-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center', sizes[size], className)}>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        onAnimationComplete={onComplete}
        className="bg-error rounded-full p-2"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <X size={iconSizes[size]} className="text-error-foreground" />
        </motion.div>
      </motion.div>
    </div>
  )
}

// SVG version with animated X
export function ErrorX({
  size = 64,
  className,
}: {
  size?: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn('text-error', className)}
    >
      {/* Circle */}
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
      />
      {/* X */}
      <motion.path
        d="M22 22 L42 42 M42 22 L22 42"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.3 }}
      />
    </svg>
  )
}
