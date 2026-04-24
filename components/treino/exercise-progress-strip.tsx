"use client"

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import type { ExerciseStatus } from '@/hooks/use-workout-execution'
import { cn } from '@/lib/utils'

interface ExerciseProgressStripProps {
  exercises: ExerciseStatus[]
  currentIndex: number
  onJump: (index: number) => void
}

export function ExerciseProgressStrip({
  exercises,
  currentIndex,
  onJump
}: ExerciseProgressStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const current = itemRefs.current[currentIndex]
    if (current) {
      current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentIndex])

  if (exercises.length === 0) return null

  return (
    <div className="border-b border-border/60 bg-card/50">
      <div
        ref={containerRef}
        className="flex items-start gap-1 overflow-x-auto px-3 py-2.5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {exercises.map((ex, idx) => {
          const isCurrent = idx === currentIndex
          const isCompleted = ex.status === 'completed'
          const isInProgress = ex.status === 'in_progress'

          return (
            <button
              key={ex.exerciseId}
              ref={(el) => { itemRefs.current[idx] = el }}
              onClick={() => onJump(idx)}
              className={cn(
                'flex-1 min-w-[56px] max-w-[96px] flex flex-col items-center gap-1 px-1 py-1 rounded-lg transition-all',
                isCurrent && 'bg-dourado/10'
              )}
              aria-label={`Ir para ${ex.name}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Chip circular com número/check */}
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : isCurrent
                      ? 'bg-gradient-to-br from-dourado to-vinho text-white ring-2 ring-dourado/30 ring-offset-2 ring-offset-card scale-110'
                      : isInProgress
                        ? 'bg-white border-2 border-dourado text-dourado'
                        : 'bg-background-elevated border border-border/80 text-foreground-muted'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Nome — 1 linha truncada */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight truncate w-full text-center',
                  isCurrent
                    ? 'text-dourado font-semibold'
                    : isCompleted
                      ? 'text-emerald-700'
                      : 'text-foreground-secondary'
                )}
                title={ex.name}
              >
                {ex.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
