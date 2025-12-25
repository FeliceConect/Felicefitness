'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Simpler fade transition
export function FadeTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
