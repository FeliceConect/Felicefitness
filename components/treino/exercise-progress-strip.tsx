"use client"

import { useEffect, useMemo, useRef } from 'react'
import { Check, Link2 } from 'lucide-react'
import type { ExerciseStatus } from '@/hooks/use-workout-execution'
import { cn } from '@/lib/utils'

interface ExerciseProgressStripProps {
  exercises: ExerciseStatus[]
  currentIndex: number
  onJump: (index: number) => void
}

// Agrupa membros consecutivos do mesmo circuit_group num único chip — assim
// biset/triset aparece como UMA bolinha, não uma por exercício.
type StripItem = {
  key: string
  label: string
  fullLabel: string
  firstIndex: number
  memberIndexes: number[]
  status: 'pending' | 'in_progress' | 'completed'
  isCircuit: boolean
  circuitSize: number
}

function buildItems(exercises: ExerciseStatus[]): StripItem[] {
  const items: StripItem[] = []
  let i = 0
  while (i < exercises.length) {
    const ex = exercises[i]
    const group = ex.circuitGroup
    if (group != null) {
      let j = i
      while (j < exercises.length && exercises[j].circuitGroup === group) j++
      const members = exercises.slice(i, j)
      const totalSets = members.reduce((acc, m) => acc + m.totalSets, 0)
      const completedSets = members.reduce((acc, m) => acc + m.completedSets, 0)
      let status: StripItem['status'] = 'pending'
      if (completedSets >= totalSets && totalSets > 0) status = 'completed'
      else if (completedSets > 0) status = 'in_progress'
      const label = members.map(m => m.name.split(' ')[0]).join(' + ')
      const fullLabel = members.map(m => m.name).join(' + ')
      items.push({
        key: `circuit-${group}-${i}`,
        label,
        fullLabel,
        firstIndex: members[0].index,
        memberIndexes: members.map(m => m.index),
        status,
        isCircuit: true,
        circuitSize: members.length,
      })
      i = j
    } else {
      items.push({
        key: ex.exerciseId,
        label: ex.name,
        fullLabel: ex.name,
        firstIndex: ex.index,
        memberIndexes: [ex.index],
        status: ex.status === 'completed' ? 'completed' : ex.status === 'in_progress' ? 'in_progress' : 'pending',
        isCircuit: false,
        circuitSize: 1,
      })
      i++
    }
  }
  return items
}

export function ExerciseProgressStrip({
  exercises,
  currentIndex,
  onJump
}: ExerciseProgressStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const items = useMemo(() => buildItems(exercises), [exercises])

  const currentItemIdx = useMemo(
    () => items.findIndex(it => it.memberIndexes.includes(currentIndex)),
    [items, currentIndex]
  )

  useEffect(() => {
    const current = itemRefs.current[currentItemIdx]
    if (current) {
      current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentItemIdx])

  if (items.length === 0) return null

  return (
    <div className="border-b border-border/60 bg-card/50">
      <div
        ref={containerRef}
        className="flex items-start gap-1 overflow-x-auto px-3 py-2.5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((it, idx) => {
          const isCurrent = idx === currentItemIdx
          const isCompleted = it.status === 'completed'
          const isInProgress = it.status === 'in_progress'

          return (
            <button
              key={it.key}
              ref={(el) => { itemRefs.current[idx] = el }}
              onClick={() => onJump(it.firstIndex)}
              className={cn(
                'flex-1 min-w-[64px] max-w-[112px] flex flex-col items-center gap-1 px-1 py-1 rounded-lg transition-all',
                isCurrent && 'bg-dourado/10'
              )}
              aria-label={`Ir para ${it.fullLabel}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={cn(
                  'rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
                  it.isCircuit ? 'h-9 px-3 gap-1' : 'w-9 h-9',
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
                ) : it.isCircuit ? (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="text-xs">×{it.circuitSize}</span>
                  </>
                ) : (
                  it.firstIndex + 1
                )}
              </div>

              <span
                className={cn(
                  'text-[10px] font-medium leading-tight truncate w-full text-center',
                  isCurrent
                    ? 'text-dourado font-semibold'
                    : isCompleted
                      ? 'text-emerald-700'
                      : 'text-foreground-secondary'
                )}
                title={it.fullLabel}
              >
                {it.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
