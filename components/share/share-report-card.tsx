'use client'

import { ShareCard, StatBox, CardTitle, CardDate } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, WeeklyShareData } from '@/types/share'

interface ShareReportCardProps {
  data: WeeklyShareData
  theme: ShareTheme
  format: ShareFormat
  showDate?: boolean
}

export function ShareReportCard({
  data,
  theme,
  format,
  showDate = true,
}: ShareReportCardProps) {
  const colors = getThemeColors(theme)
  const isStory = format === 'story'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Title */}
        <CardTitle icon="📊" text="Resumo Semanal" theme={theme} />

        {/* Week Range */}
        <div
          className="mt-2 text-sm font-medium"
          style={{ color: colors.secondary }}
        >
          {data.weekStart} — {data.weekEnd}
        </div>

        {/* Main Stat — Workouts */}
        <div className="mt-6 flex flex-col items-center">
          <span className="text-6xl font-black" style={{ color: colors.primary }}>
            {data.workoutsCompleted}
          </span>
          <span className="text-lg font-medium mt-1" style={{ color: colors.text }}>
            {data.workoutsCompleted === 1 ? 'treino' : 'treinos'}
          </span>
        </div>

        {/* Highlights as pills */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.highlights.map((highlight, index) => (
              <div
                key={index}
                className="px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                {highlight}
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid — only if there's extra data */}
        {(data.totalCalories > 0 || data.totalSets > 0 || data.prsSet > 0) && (
          <div className={`grid ${isStory ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-2'} mt-6 w-full max-w-xs`}>
            {data.totalCalories > 0 && (
              <StatBox label="Calorias" value={`${data.totalCalories}`} theme={theme} />
            )}
            {data.totalSets > 0 && (
              <StatBox label="Series" value={String(data.totalSets)} theme={theme} />
            )}
            {data.prsSet > 0 && (
              <StatBox label="PRs" value={String(data.prsSet)} theme={theme} />
            )}
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-6">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
