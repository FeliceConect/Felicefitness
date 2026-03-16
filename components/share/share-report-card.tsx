'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, StatRow, CardDate, withAlpha } from './share-card'
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

  // Build stat row dynamically
  const statItems: { label: string; value: string | number }[] = []
  if (data.totalCalories > 0) statItems.push({ label: 'Calorias', value: data.totalCalories })
  if (data.totalSets > 0) statItems.push({ label: 'Series', value: data.totalSets })
  if (data.prsSet > 0) statItems.push({ label: 'PRs', value: data.prsSet })

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        <BrandMark theme={theme} />

        <div className="mt-3">
          <OrnamentalDivider theme={theme} />
        </div>

        <div className="mt-3.5">
          <CardLabel text="Resumo Semanal" theme={theme} />
        </div>

        {/* Week Range */}
        <span
          className="mt-1.5 text-[9px] tracking-[0.1em]"
          style={{ color: colors.secondary, opacity: 0.5 }}
        >
          {data.weekStart} — {data.weekEnd}
        </span>

        {/* Hero workout count */}
        <div className="mt-4 flex flex-col items-center">
          <span
            className="text-7xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.accent, textShadow: `0 0 45px ${withAlpha(colors.accent, 0.4)}` }}
          >
            {data.workoutsCompleted}
          </span>
          <span
            className="text-sm font-heading font-medium mt-1"
            style={{ color: colors.secondary }}
          >
            {data.workoutsCompleted === 1 ? 'treino' : 'treinos'}
          </span>
        </div>

        {/* Highlights pills */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {data.highlights.map((h, i) => (
              <div
                key={i}
                className="px-2.5 py-0.5 rounded-full text-[8px] font-semibold"
                style={{
                  backgroundColor: `${colors.accent}12`,
                  color: colors.accent,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: `${colors.accent}18`,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        )}

        {/* Stats row */}
        {statItems.length > 0 && (
          <div className="mt-5">
            <StatRow stats={statItems} theme={theme} />
          </div>
        )}

        {showDate && (
          <div className="mt-4">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
