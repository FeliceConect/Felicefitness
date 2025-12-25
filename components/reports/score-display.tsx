'use client'

import { cn } from '@/lib/utils'
import { ProgressRing } from '@/components/charts/progress-ring'

interface ScoreDisplayProps {
  score: number
  max?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showGrade?: boolean
  className?: string
}

function getScoreGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 95) return { grade: 'S', label: 'Excepcional', color: '#a855f7' }
  if (score >= 90) return { grade: 'A+', label: 'Excelente', color: '#22c55e' }
  if (score >= 85) return { grade: 'A', label: 'Ótimo', color: '#22c55e' }
  if (score >= 80) return { grade: 'B+', label: 'Muito Bom', color: '#84cc16' }
  if (score >= 75) return { grade: 'B', label: 'Bom', color: '#84cc16' }
  if (score >= 70) return { grade: 'C+', label: 'Regular+', color: '#eab308' }
  if (score >= 65) return { grade: 'C', label: 'Regular', color: '#eab308' }
  if (score >= 60) return { grade: 'D', label: 'Pode Melhorar', color: '#f97316' }
  return { grade: 'F', label: 'Precisa Focar', color: '#ef4444' }
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 75) return '#84cc16'
  if (score >= 60) return '#eab308'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

export function ScoreDisplay({
  score,
  max = 100,
  label,
  size = 'md',
  showGrade = true,
  className
}: ScoreDisplayProps) {
  const sizeConfig = {
    sm: { ring: 80, stroke: 6 },
    md: { ring: 120, stroke: 8 },
    lg: { ring: 160, stroke: 10 }
  }[size]

  const { grade, label: gradeLabel, color } = getScoreGrade(score)

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <ProgressRing
        value={score}
        max={max}
        size={sizeConfig.ring}
        strokeWidth={sizeConfig.stroke}
        color={getScoreColor(score)}
        showValue={!showGrade}
        valueFormatter={(v) => `${Math.round(v)}`}
        label={label}
      />
      {showGrade && (
        <div className="text-center -mt-[calc(var(--ring-size)/2+1.5rem)]" style={{ '--ring-size': `${sizeConfig.ring}px` } as React.CSSProperties}>
          <div className="text-3xl font-bold" style={{ color }}>{grade}</div>
          <div className="text-xs text-muted-foreground">{gradeLabel}</div>
        </div>
      )}
      {label && !showGrade && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  )
}

// Simple score badge
interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const { grade, color } = getScoreGrade(score)

  const sizeClass = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }[size]

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold',
        sizeClass,
        className
      )}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {grade}
    </div>
  )
}

// Daily score indicator
interface DailyScoreProps {
  score: number
  date: string
  isToday?: boolean
  className?: string
}

export function DailyScore({ score, date, isToday, className }: DailyScoreProps) {
  const color = getScoreColor(score)

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
          isToday && 'ring-2 ring-primary ring-offset-2'
        )}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {score}
      </div>
      <span className="text-[10px] text-muted-foreground">{date}</span>
    </div>
  )
}
