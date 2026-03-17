'use client'

import { ShareCard, BrandMark, OrnamentalDivider, withAlpha } from './share-card'
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
}: SharePRCardProps) {
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

          <span
            className="mt-4 text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: colors.accent }}
          >
            Recorde Pessoal
          </span>
        </div>

        {/* === MIDDLE: Hero === */}
        <div className="flex flex-col items-center">
          {/* Trophy */}
          <div className="text-4xl mb-2">🏆</div>

          {/* Exercise */}
          <h2
            className="text-sm font-semibold uppercase tracking-[0.15em] text-center"
            style={{ color: colors.secondary }}
          >
            {data.exercise}
          </h2>

          {/* Hero Weight */}
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className="text-8xl font-heading font-black tracking-tighter leading-none"
              style={{
                color: colors.accent,
                textShadow: `0 0 45px ${withAlpha(colors.accent, 0.35)}`,
              }}
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

          {/* Gold filete separator */}
          <div className="mt-5">
            <OrnamentalDivider theme={theme} />
          </div>

          {/* Improvement chip */}
          <div
            className="mt-4 flex items-center gap-3 px-4 py-2 rounded-full"
            style={{
              backgroundColor: withAlpha('#7dad6a', isDark ? 0.1 : 0.07),
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
