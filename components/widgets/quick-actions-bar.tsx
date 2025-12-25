'use client'

import { cn } from '@/lib/utils'
import { QuickActionButton } from './quick-action-button'
import type { QuickAction } from '@/types/widgets'

interface QuickActionsBarProps {
  actions: QuickAction[]
  onAction: (action: QuickAction) => void
  position?: 'top' | 'bottom' | 'inline'
  className?: string
}

export function QuickActionsBar({
  actions,
  onAction,
  position = 'inline',
  className,
}: QuickActionsBarProps) {
  const enabledActions = actions.filter((a) => a.enabled !== false)

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        position === 'top' && 'fixed top-0 left-0 right-0 z-40 py-4 bg-gradient-to-b from-background/90 to-transparent backdrop-blur-sm',
        position === 'bottom' && 'fixed bottom-0 left-0 right-0 z-40 py-4 pb-safe bg-gradient-to-t from-background/90 to-transparent backdrop-blur-sm',
        className
      )}
    >
      {enabledActions.map((action) => (
        <QuickActionButton
          key={action.id}
          action={action}
          onClick={() => onAction(action)}
          size="md"
          variant="outline"
        />
      ))}
    </div>
  )
}
