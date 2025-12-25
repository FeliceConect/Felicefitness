'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BackdropProps {
  open: boolean
  onClick?: () => void
  blur?: boolean
  className?: string
}

export function Backdrop({
  open,
  onClick,
  blur = true,
  className,
}: BackdropProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClick}
          className={cn(
            'fixed inset-0 bg-black/60 z-40',
            blur && 'backdrop-blur-sm',
            className
          )}
        />
      )}
    </AnimatePresence>
  )
}
