'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { QuickAction } from '@/types/widgets'

interface FloatingActionMenuProps {
  actions: QuickAction[]
  onAction: (action: QuickAction) => void
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  className?: string
}

export function FloatingActionMenu({
  actions,
  onAction,
  position = 'bottom-right',
  className,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const enabledActions = actions.filter((a) => a.enabled !== false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  const handleAction = (action: QuickAction) => {
    onAction(action)
    setIsOpen(false)
  }

  const positionClasses = {
    'bottom-right': 'right-4 bottom-20',
    'bottom-left': 'left-4 bottom-20',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div
        className={cn(
          'fixed z-50 pb-safe',
          positionClasses[position],
          className
        )}
      >
        {/* Action buttons */}
        <div
          className={cn(
            'flex flex-col-reverse gap-3 mb-4 items-center',
            isOpen ? 'pointer-events-auto' : 'pointer-events-none'
          )}
        >
          {enabledActions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                'flex items-center gap-3 transition-all duration-300',
                position === 'bottom-right' && 'flex-row-reverse',
                isOpen && isAnimating
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : `${(enabledActions.length - index - 1) * 30}ms`,
              }}
            >
              <span className="text-sm font-medium text-white bg-black/70 px-3 py-1.5 rounded-full whitespace-nowrap">
                {action.label}
              </span>

              <Button
                size="icon"
                className={cn(
                  'w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95',
                  'bg-purple-600 hover:bg-purple-700 text-white'
                )}
                onClick={() => handleAction(action)}
              >
                <span className="text-xl">{action.icon}</span>
              </Button>
            </div>
          ))}
        </div>

        {/* Main FAB button */}
        <Button
          size="icon"
          className={cn(
            'w-14 h-14 rounded-full shadow-lg transition-all duration-300',
            'bg-purple-600 hover:bg-purple-700 text-white',
            isOpen && 'rotate-45'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      </div>
    </>
  )
}
