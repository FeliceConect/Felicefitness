'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Moon, Sun } from 'lucide-react'

interface SleepTimePickerProps {
  value: string
  onChange: (value: string) => void
  type: 'bedtime' | 'wake'
  quickOptions?: string[]
  className?: string
}

const DEFAULT_BEDTIME_OPTIONS = ['21:30', '22:00', '22:30', '23:00']
const DEFAULT_WAKE_OPTIONS = ['04:30', '05:00', '05:30', '06:00']

export function SleepTimePicker({
  value,
  onChange,
  type,
  quickOptions,
  className,
}: SleepTimePickerProps) {
  const options = quickOptions || (type === 'bedtime' ? DEFAULT_BEDTIME_OPTIONS : DEFAULT_WAKE_OPTIONS)
  const Icon = type === 'bedtime' ? Moon : Sun
  const label = type === 'bedtime' ? 'Hora de dormir' : 'Hora de acordar'

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-2xl font-mono text-center h-14"
      />

      <div className="flex gap-2">
        {options.map((time) => (
          <Button
            key={time}
            type="button"
            variant={value === time ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onChange(time)}
          >
            {time}
          </Button>
        ))}
      </div>
    </div>
  )
}
