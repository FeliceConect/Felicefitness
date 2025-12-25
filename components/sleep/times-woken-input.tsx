'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TimesWokenInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

const OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
]

export function TimesWokenInput({ value, onChange, className }: TimesWokenInputProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
