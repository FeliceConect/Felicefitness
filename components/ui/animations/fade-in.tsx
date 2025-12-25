'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  direction = 'up',
  ...props
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  }

  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
