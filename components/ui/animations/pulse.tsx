'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PulseProps {
  children: React.ReactNode
  isActive?: boolean
  color?: string
  className?: string
}

export function Pulse({
  children,
  isActive = true,
  color = 'rgba(139, 92, 246, 0.5)',
  className
}: PulseProps) {
  if (!isActive) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{
          scale: [1, 1.5, 1.5],
          opacity: [0.5, 0.2, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut'
        }}
      />
    </div>
  )
}

// Pulse para notificações/badges
export function NotificationPulse({
  count,
  className
}: {
  count: number
  className?: string
}) {
  if (count === 0) return null

  return (
    <Pulse isActive={count > 0} color="rgba(239, 68, 68, 0.5)">
      <span
        className={cn(
          'flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full',
          className
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    </Pulse>
  )
}

// Pulse para indicar ação necessária
export function ActionPulse({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <motion.div
        className="absolute -inset-1 rounded-lg bg-violet-500/20"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.2, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  )
}

// Ripple effect para botões
export function Ripple({
  color = 'rgba(255, 255, 255, 0.3)'
}: {
  color?: string
}) {
  return (
    <motion.span
      className="absolute inset-0 rounded-inherit overflow-hidden"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ backgroundColor: color }}
    />
  )
}
