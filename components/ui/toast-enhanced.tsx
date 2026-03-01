'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/use-haptic'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle }> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircle
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertCircle
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: AlertTriangle
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Info
  }
}

const toastIconColors: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const { haptic } = useHaptic()

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Haptic feedback based on type
    if (toast.type === 'success') haptic('success')
    else if (toast.type === 'error') haptic('error')
    else if (toast.type === 'warning') haptic('warning')
    else haptic('light')

    // Auto remove after duration
    const duration = toast.duration || 4000
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [haptic])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastEnhanced() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastEnhanced must be used within ToastProvider')
  }
  return context
}

function ToastContainer({
  toasts,
  onRemove
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({
  toast,
  onRemove
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const styles = toastStyles[toast.type]
  const Icon = styles.icon
  const iconColor = toastIconColors[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 40
      }}
      className={cn(
        'pointer-events-auto rounded-xl border p-4 shadow-lg backdrop-blur-sm',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-foreground-secondary mt-0.5">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                onRemove(toast.id)
              }}
              className={cn('text-sm font-medium mt-2', iconColor)}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Componente standalone para uso rápido
export function ToastNotification({
  type,
  title,
  description,
  isVisible,
  onClose
}: {
  type: ToastType
  title: string
  description?: string
  isVisible: boolean
  onClose: () => void
}) {
  const styles = toastStyles[type]
  const Icon = styles.icon
  const iconColor = toastIconColors[type]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={cn(
            'fixed bottom-20 left-4 right-4 z-50 rounded-xl border p-4 shadow-lg',
            styles.bg,
            styles.border
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn('w-5 h-5 flex-shrink-0', iconColor)} />
            <div className="flex-1">
              <p className="font-medium text-foreground">{title}</p>
              {description && (
                <p className="text-sm text-foreground-secondary mt-0.5">{description}</p>
              )}
            </div>
            <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
