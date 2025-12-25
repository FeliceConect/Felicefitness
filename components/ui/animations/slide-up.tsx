'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface SlideUpProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> {
  children: React.ReactNode
  delay?: number
  duration?: number
  distance?: number
}

export function SlideUp({
  children,
  delay = 0,
  duration = 0.3,
  distance = 20,
  ...props
}: SlideUpProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
