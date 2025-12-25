'use client'

import { cn } from '@/lib/utils'

interface CoachSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export function CoachSuggestions({
  suggestions,
  onSelect,
  className,
}: CoachSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm',
            'bg-primary/10 text-primary',
            'hover:bg-primary/20 transition-colors',
            'border border-primary/20'
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
