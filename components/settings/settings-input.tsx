'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SettingsInputProps {
  icon?: React.ReactNode
  title: string
  description?: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'time' | 'email' | 'tel'
  placeholder?: string
  suffix?: string
  min?: number
  max?: number
  disabled?: boolean
  error?: string
  className?: string
}

export function SettingsInput({
  icon,
  title,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
  min,
  max,
  disabled = false,
  error,
  className
}: SettingsInputProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-4">
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

        {/* Input */}
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            min={min}
            max={max}
            disabled={disabled}
            className={cn(
              'w-24 text-right',
              error && 'border-destructive'
            )}
          />
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-destructive ml-14">{error}</p>
      )}
    </div>
  )
}
