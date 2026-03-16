'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, StatBox, CardDate } from './share-card'
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
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        {/* Brand mark */}
        <BrandMark theme={theme} />

        {/* Ornamental divider */}
        <div className="mt-2.5">
          <OrnamentalDivider theme={theme} />
        </div>

        {/* Card type label */}
        <div className="mt-4">
          <CardLabel text="Resumo Semanal" theme={theme} />
        </div>

        {/* Week Range */}
        <span
          className="mt-1.5 text-[9px] tracking-[0.1em]"
          style={{ color: colors.secondary, opacity: 0.5 }}
        >
          {data.weekStart} — {data.weekEnd}
        </span>

        {/* Hero — Workout count */}
        <div className="mt-4 flex flex-col items-center">
          <span
            className="text-6xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.text }}
          >
            {data.workoutsCompleted}
          </span>
          <span
            className="text-base font-heading font-medium mt-1"
            style={{ color: colors.secondary }}
          >
            {data.workoutsCompleted === 1 ? 'treino' : 'treinos'}
          </span>
        </div>

        {/* Highlights pills */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {data.highlights.map((highlight, index) => (
              <div
                key={index}
                className="px-3 py-1 rounded-full text-[9px] font-semibold"
                style={{
                  backgroundColor: `${colors.accent}12`,
                  color: colors.accent,
                  borderWidth: 1,
                  borderColor: `${colors.accent}18`,
                }}
              >
                {highlight}
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {(data.totalCalories > 0 || data.totalSets > 0 || data.prsSet > 0) && (
          <div className={`grid ${isStory ? 'grid-cols-2 gap-2.5' : 'grid-cols-3 gap-2'} mt-5 w-full`}>
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
          <div className="mt-4">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
