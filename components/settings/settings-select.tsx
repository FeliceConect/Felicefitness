'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
  description?: string
}

interface SettingsSelectProps {
  icon?: React.ReactNode
  title: string
  description?: string
  value: string
  options: Option[]
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function SettingsSelect({
  icon,
  title,
  description,
  value,
  options,
  onValueChange,
  disabled = false,
  className
}: SettingsSelectProps) {
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

      {/* Select */}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-auto min-w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div>
                <span>{option.label}</span>
                {option.description && (
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
