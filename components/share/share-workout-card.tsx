'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, StatBox, CardDate } from './share-card'
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
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        {/* Brand mark */}
        <BrandMark theme={theme} />

        {/* Ornamental divider */}
        <div className="mt-2.5">
          <OrnamentalDivider theme={theme} />
        </div>

        {/* Card type label */}
        <div className="mt-4">
          <CardLabel text="Treino Completo" theme={theme} />
        </div>

        {/* Workout Name — hero */}
        <h2
          className="mt-3 text-2xl font-heading font-bold text-center leading-tight"
          style={{ color: colors.text }}
        >
          {data.workoutName}
        </h2>

        {/* Duration hero number */}
        <div className="mt-4 flex flex-col items-center">
          <span
            className="text-5xl font-heading font-black tracking-tight leading-none"
            style={{ color: colors.primary }}
          >
            {data.duration}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.2em] mt-1.5"
            style={{ color: colors.secondary, opacity: 0.6 }}
          >
            de treino
          </span>
        </div>

        {/* Stats Grid */}
        {showStats && (
          <div className="grid grid-cols-3 gap-2 mt-5 w-full">
            <StatBox label="Exercicios" value={data.exercises} theme={theme} />
            <StatBox label="Series" value={data.sets} theme={theme} />
            <StatBox label="Calorias" value={`${data.calories}`} theme={theme} />
          </div>
        )}

        {/* PRs badge */}
        {data.prs > 0 && (
          <div
            className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: isDark ? 'rgba(194, 152, 99, 0.12)' : 'rgba(194, 152, 99, 0.1)',
              borderWidth: 1,
              borderColor: `${colors.accent}25`,
            }}
          >
            <span className="text-sm">🏆</span>
            <span
              className="text-[10px] font-bold tracking-[0.1em] uppercase"
              style={{ color: colors.accent }}
            >
              {data.prs} {data.prs === 1 ? 'Recorde' : 'Recordes'}
            </span>
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-4">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
