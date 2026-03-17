'use client'

import { ShareCard, BrandMark, OrnamentalDivider, StatRow, withAlpha } from './share-card'
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
}: ShareWorkoutCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-7 pt-8 pb-10">

        {/* === TOP: Brand === */}
        <div className="flex flex-col items-center">
          <BrandMark theme={theme} />

          <div className="mt-4">
            <OrnamentalDivider theme={theme} />
          </div>

          {/* Type label */}
          <span
            className="mt-4 text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: colors.accent }}
          >
            Treino Completo
          </span>
        </div>

        {/* === MIDDLE: Hero === */}
        <div className="flex flex-col items-center">
          {/* Workout Name */}
          <h2
            className="text-sm font-semibold uppercase tracking-[0.12em] text-center leading-tight"
            style={{ color: colors.secondary, opacity: 0.6 }}
          >
            {data.workoutName}
          </h2>

          {/* Hero Duration */}
          <span
            className="mt-2 text-[9px] font-bold tracking-[0.3em] uppercase"
            style={{ color: colors.secondary, opacity: 0.5 }}
          >
            Duração
          </span>
          <div className="flex items-baseline gap-0.5 mt-1">
            <span
              className="text-7xl font-heading font-black tracking-tighter leading-none"
              style={{
                color: colors.accent,
                textShadow: `0 0 45px ${withAlpha(colors.accent, 0.35)}`,
              }}
            >
              {data.duration}
            </span>
          </div>
          <span
            className="text-[8px] uppercase tracking-[0.2em] mt-1"
            style={{ color: colors.secondary, opacity: 0.5 }}
          >
            minutos
          </span>

          {/* PRs badge */}
          {data.prs > 0 && (
            <div
              className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
              style={{
                backgroundColor: withAlpha(colors.accent, isDark ? 0.1 : 0.07),
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

          {/* Gold filete separator */}
          <div className="mt-5">
            <OrnamentalDivider theme={theme} />
          </div>

          {/* Stats Row */}
          {showStats && (
            <div className="mt-4">
              <StatRow
                stats={[
                  { label: 'Exercícios', value: data.exercises },
                  { label: 'Séries', value: data.sets },
                  { label: 'Calorias', value: data.calories },
                ]}
                theme={theme}
              />
            </div>
          )}
        </div>

        {/* === BOTTOM: Tagline === */}
        <div className="flex flex-col items-center">
          <span
            className="text-[19px] font-heading font-bold italic"
            style={{
              color: colors.accent,
              textShadow: `0 0 30px ${withAlpha(colors.accent, 0.25)}`,
            }}
          >
            Vivendo Felice!
          </span>
          <span
            className="mt-1.5 text-[7px] font-bold tracking-[0.2em] uppercase"
            style={{ color: colors.secondary, opacity: 0.35 }}
          >
            #VivendoFelice
          </span>
        </div>
      </div>
    </ShareCard>
  )
}
