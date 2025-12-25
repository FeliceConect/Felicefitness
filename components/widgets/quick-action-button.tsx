'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { QuickAction } from '@/types/widgets'

interface QuickActionButtonProps {
  action: QuickAction
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showLabel?: boolean
}

export function QuickActionButton({
  action,
  onClick,
  size = 'md',
  variant = 'outline',
  showLabel = true,
}: QuickActionButtonProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  }

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={variant}
        size="icon"
        className={cn(
          'rounded-full relative transition-transform hover:scale-105 active:scale-95',
          sizeClasses[size],
          variant === 'default' && 'bg-purple-600 hover:bg-purple-700 text-white border-0',
          variant === 'outline' && 'border-purple-500/30 hover:bg-purple-500/10'
        )}
        onClick={onClick}
      >
        <span className={iconSizes[size]}>{action.icon}</span>

        {action.badge && action.badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {action.badge > 99 ? '99+' : action.badge}
          </span>
        )}
      </Button>

      {showLabel && (
        <span className="text-xs text-muted-foreground">{action.shortLabel || action.label}</span>
      )}
    </div>
  )
}
