'use client'

import { ShareCard, BrandMark, OrnamentalDivider, StatRow, withAlpha } from './share-card'
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
}: ShareReportCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  // Build stat row dynamically
  const statItems: { label: string; value: string | number }[] = []
  if (data.totalCalories > 0) statItems.push({ label: 'Calorias', value: data.totalCalories })
  if (data.totalSets > 0) statItems.push({ label: 'Séries', value: data.totalSets })
  if (data.prsSet > 0) statItems.push({ label: 'Recordes', value: data.prsSet })

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-7 pt-8 pb-10">

        {/* === TOP: Brand === */}
        <div className="flex flex-col items-center">
          <BrandMark theme={theme} />

          <div className="mt-4">
            <OrnamentalDivider theme={theme} />
          </div>

          <span
            className="mt-4 text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: colors.accent }}
          >
            Resumo Semanal
          </span>

          {/* Week Range */}
          <span
            className="mt-1.5 text-[9px] tracking-[0.1em]"
            style={{ color: colors.secondary, opacity: 0.5 }}
          >
            {data.weekStart} — {data.weekEnd}
          </span>
        </div>

        {/* === MIDDLE: Hero === */}
        <div className="flex flex-col items-center">
          {/* Hero workout count */}
          <span
            className="text-8xl font-heading font-black tracking-tighter leading-none"
            style={{
              color: colors.accent,
              textShadow: `0 0 45px ${withAlpha(colors.accent, 0.35)}`,
            }}
          >
            {data.workoutsCompleted}
          </span>
          <span
            className="text-sm font-heading font-medium mt-1"
            style={{ color: colors.secondary }}
          >
            {data.workoutsCompleted === 1 ? 'treino' : 'treinos'}
          </span>

          {/* Gold filete separator */}
          <div className="mt-5">
            <OrnamentalDivider theme={theme} />
          </div>

          {/* Highlights pills */}
          {data.highlights && data.highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {data.highlights.map((h, i) => (
                <div
                  key={i}
                  className="px-2.5 py-0.5 rounded-full text-[8px] font-semibold"
                  style={{
                    backgroundColor: withAlpha(colors.accent, isDark ? 0.1 : 0.07),
                    color: colors.accent,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: withAlpha(colors.accent, 0.15),
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          )}

          {/* Stats row */}
          {statItems.length > 0 && (
            <div className="mt-4">
              <StatRow stats={statItems} theme={theme} />
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
