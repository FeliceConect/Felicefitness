'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface ScaleInProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> {
  children: React.ReactNode
  delay?: number
  duration?: number
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  ...props
}: ScaleInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
