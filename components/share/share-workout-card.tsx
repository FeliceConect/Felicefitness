'use client'

import { ShareCard, StatBox, CardTitle, CardDate } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, WorkoutShareData } from '@/types/share'

interface ShareWorkoutCardProps {
  data: WorkoutShareData
  theme: ShareTheme
  format: ShareFormat
  showStats?: boolean
  showDate?: boolean
}

export function ShareWorkoutCard({
  data,
  theme,
  format,
  showStats = true,
  showDate = true,
}: ShareWorkoutCardProps) {
  const colors = getThemeColors(theme)
  const isStory = format === 'story'
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        {/* Top label */}
        <CardTitle text="Treino Completo" theme={theme} size="sm" />

        {/* Workout Name — hero element */}
        <h2
          className="mt-4 text-3xl font-heading font-bold text-center leading-tight tracking-tight"
          style={{ color: colors.text }}
        >
          {data.workoutName}
        </h2>

        {/* Thin decorative divider */}
        <div className="mt-5 flex items-center gap-3">
          <div className="w-8 h-[1px]" style={{ backgroundColor: colors.accent, opacity: 0.4 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.6 }} />
          <div className="w-8 h-[1px]" style={{ backgroundColor: colors.accent, opacity: 0.4 }} />
        </div>

        {/* Hero duration */}
        <div className="mt-5 flex items-baseline gap-1">
          <span
            className="text-5xl font-heading font-black tracking-tight"
            style={{ color: colors.primary }}
          >
            {data.duration}
          </span>
        </div>
        <span
          className="text-[11px] uppercase tracking-[0.2em] mt-1"
          style={{ color: colors.secondary, opacity: 0.7 }}
        >
          de treino
        </span>

        {/* Stats Grid — glass morphism */}
        {showStats && (
          <div className={`grid ${isStory ? 'grid-cols-3 gap-3' : 'grid-cols-3 gap-2.5'} mt-7 w-full max-w-[280px]`}>
            <StatBox label="Exercicios" value={data.exercises} theme={theme} />
            <StatBox label="Series" value={data.sets} theme={theme} />
            <StatBox label="Calorias" value={`${data.calories}`} theme={theme} />
          </div>
        )}

        {/* PRs badge — only if PRs were hit */}
        {data.prs > 0 && (
          <div
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: isDark ? 'rgba(194, 152, 99, 0.15)' : 'rgba(194, 152, 99, 0.12)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(194, 152, 99, 0.25)' : 'rgba(194, 152, 99, 0.2)',
            }}
          >
            <span className="text-base">🏆</span>
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: colors.accent }}
            >
              {data.prs} {data.prs === 1 ? 'PR' : 'PRs'}
            </span>
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-5">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
