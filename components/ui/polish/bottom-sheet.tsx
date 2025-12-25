'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showCloseButton?: boolean
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  const prefersReducedMotion = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  // Close with Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 200) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', damping: 30, stiffness: 300 }
            }
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background-elevated rounded-t-3xl',
              'max-h-[90vh] overflow-hidden',
              className
            )}
          >
            {/* Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                {title && (
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-foreground-muted hover:text-foreground rounded-full"
                    aria-label="Fechar"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-auto max-h-[calc(90vh-80px)] pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
