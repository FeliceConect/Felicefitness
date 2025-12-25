'use client'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface SettingsToggleProps {
  icon?: React.ReactNode
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function SettingsToggle({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className
}: SettingsToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Toggle */}
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
