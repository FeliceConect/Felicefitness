'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface SuccessAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onComplete?: () => void
}

export function SuccessAnimation({
  size = 'md',
  className,
  onComplete,
}: SuccessAnimationProps) {
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
        <div className="bg-success rounded-full p-2">
          <Check size={iconSizes[size]} className="text-success-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center', sizes[size], className)}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        onAnimationComplete={onComplete}
        className="bg-success rounded-full p-2"
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Check size={iconSizes[size]} className="text-success-foreground" />
        </motion.div>
      </motion.div>
    </div>
  )
}

// SVG version with animated checkmark
export function SuccessCheckmark({
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
      className={cn('text-success', className)}
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
      {/* Checkmark */}
      <motion.path
        d="M20 32 L28 40 L44 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.3 }}
      />
    </svg>
  )
}
