'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, CardDate, withAlpha } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, PRShareData } from '@/types/share'

interface SharePRCardProps {
  data: PRShareData
  theme: ShareTheme
  format: ShareFormat
  showDate?: boolean
}

export function SharePRCard({
  data,
  theme,
  format,
  showDate = true,
}: SharePRCardProps) {
  const colors = getThemeColors(theme)

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        <BrandMark theme={theme} />

        <div className="mt-3">
          <OrnamentalDivider theme={theme} />
        </div>

        <div className="mt-3.5">
          <CardLabel text="Recorde Pessoal" theme={theme} />
        </div>

        {/* Trophy */}
        <div className="mt-3 text-4xl">🏆</div>

        {/* Exercise */}
        <h2
          className="mt-2.5 text-sm font-semibold uppercase tracking-[0.15em] text-center"
          style={{ color: colors.secondary }}
        >
          {data.exercise}
        </h2>

        {/* Hero Weight */}
        <div className="mt-3 flex items-baseline gap-1">
          <span
            className="text-7xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.accent, textShadow: `0 0 45px ${withAlpha(colors.accent, 0.4)}` }}
          >
            {data.weight}
          </span>
          <span
            className="text-xl font-heading font-bold"
            style={{ color: colors.secondary, opacity: 0.6 }}
          >
            kg
          </span>
        </div>

        {/* Improvement chip */}
        <div
          className="mt-4 flex items-center gap-3 px-4 py-2 rounded-full"
          style={{
            backgroundColor: withAlpha('#7dad6a', 0.08),
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: withAlpha('#7dad6a', 0.15),
          }}
        >
          <span
            className="text-[10px] tracking-wide"
            style={{ color: colors.secondary, opacity: 0.5 }}
          >
            {data.previousWeight}kg
          </span>
          <span style={{ color: colors.accent, opacity: 0.3 }}>→</span>
          <span
            className="text-[11px] font-bold"
            style={{ color: '#7dad6a' }}
          >
            +{data.improvement}kg
          </span>
        </div>

        {showDate && (
          <div className="mt-5">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
