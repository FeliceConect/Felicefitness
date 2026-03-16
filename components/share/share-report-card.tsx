'use client'

import { ShareCard, StatBox, CardDate } from './share-card'
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
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        {/* Top label */}
        <span
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: colors.accent, opacity: 0.8 }}
        >
          Resumo Semanal
        </span>

        {/* Week Range */}
        <span
          className="mt-2 text-xs font-medium tracking-wide"
          style={{ color: colors.secondary, opacity: 0.6 }}
        >
          {data.weekStart} — {data.weekEnd}
        </span>

        {/* Hero — Workout count */}
        <div className="mt-5 flex flex-col items-center">
          <span
            className="text-7xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.text }}
          >
            {data.workoutsCompleted}
          </span>
          <span
            className="text-lg font-medium mt-1"
            style={{ color: colors.secondary }}
          >
            {data.workoutsCompleted === 1 ? 'treino' : 'treinos'}
          </span>
        </div>

        {/* Highlights as elegant pills */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.highlights.map((highlight, index) => (
              <div
                key={index}
                className="px-3.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${colors.accent}15`,
                  color: colors.accent,
                  borderWidth: 1,
                  borderColor: `${colors.accent}20`,
                }}
              >
                {highlight}
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {(data.totalCalories > 0 || data.totalSets > 0 || data.prsSet > 0) && (
          <div className={`grid ${isStory ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-2.5'} mt-6 w-full max-w-[280px]`}>
            {data.totalCalories > 0 && (
              <StatBox label="Calorias" value={`${data.totalCalories}`} theme={theme} />
            )}
            {data.totalSets > 0 && (
              <StatBox label="Series" value={String(data.totalSets)} theme={theme} />
            )}
            {data.prsSet > 0 && (
              <StatBox label="PRs" value={String(data.prsSet)} theme={theme} accent />
            )}
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-5">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
