'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, StatRow, CardDate, withAlpha } from './share-card'
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

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        {/* Logo mark */}
        <BrandMark theme={theme} />

        {/* Divider */}
        <div className="mt-3">
          <OrnamentalDivider theme={theme} />
        </div>

        {/* Type label */}
        <div className="mt-3.5">
          <CardLabel text="Treino Completo" theme={theme} />
        </div>

        {/* Workout Name */}
        <h2
          className="mt-2.5 text-xl font-heading font-bold text-center leading-tight"
          style={{ color: colors.text }}
        >
          {data.workoutName}
        </h2>

        {/* Hero Duration — the focal point */}
        <div className="mt-5 flex items-baseline gap-0.5">
          <span
            className="text-6xl font-heading font-black tracking-tight leading-none"
            style={{ color: colors.accent }}
          >
            {data.duration}
          </span>
        </div>
        <span
          className="text-[8px] uppercase tracking-[0.2em] mt-1.5"
          style={{ color: colors.secondary, opacity: 0.5 }}
        >
          de treino
        </span>

        {/* Stats Row with vertical dividers */}
        {showStats && (
          <div className="mt-6">
            <StatRow
              stats={[
                { label: 'Exercicios', value: data.exercises },
                { label: 'Series', value: data.sets },
                { label: 'Calorias', value: data.calories },
              ]}
              theme={theme}
            />
          </div>
        )}

        {/* PRs badge */}
        {data.prs > 0 && (
          <div
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: withAlpha(colors.accent, 0.1),
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: withAlpha(colors.accent, 0.2),
            }}
          >
            <span className="text-sm">🏆</span>
            <span
              className="text-[9px] font-bold tracking-[0.1em] uppercase"
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
