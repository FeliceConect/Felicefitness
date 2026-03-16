'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, CardDate } from './share-card'
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
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  return (
    <ShareCard theme={theme} format={format}>
      {/* Celebration glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 220,
          height: 220,
          background: `radial-gradient(circle, rgba(194, 152, 99, 0.18) 0%, transparent 65%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        {/* Brand mark */}
        <BrandMark theme={theme} />

        {/* Ornamental divider */}
        <div className="mt-2.5">
          <OrnamentalDivider theme={theme} />
        </div>

        {/* Card type label */}
        <div className="mt-4">
          <CardLabel text="Recorde Pessoal" theme={theme} />
        </div>

        {/* Trophy */}
        <div className="mt-3 text-3xl">🏆</div>

        {/* Exercise Name */}
        <h2
          className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-center"
          style={{ color: colors.secondary }}
        >
          {data.exercise}
        </h2>

        {/* Hero Weight */}
        <div className="mt-3 flex items-baseline gap-1">
          <span
            className="text-6xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.text }}
          >
            {data.weight}
          </span>
          <span
            className="text-xl font-heading font-bold"
            style={{ color: colors.secondary, opacity: 0.7 }}
          >
            kg
          </span>
        </div>

        {/* Improvement chip */}
        <div
          className="mt-4 flex items-center gap-3 px-4 py-2 rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(125, 173, 106, 0.1)' : 'rgba(125, 173, 106, 0.08)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(125, 173, 106, 0.18)' : 'rgba(125, 173, 106, 0.15)',
          }}
        >
          <span
            className="text-[10px] tracking-wide"
            style={{ color: colors.secondary, opacity: 0.6 }}
          >
            {data.previousWeight}kg
          </span>
          <span
            className="text-[10px]"
            style={{ color: colors.accent, opacity: 0.4 }}
          >
            →
          </span>
          <span
            className="text-[11px] font-bold"
            style={{ color: '#7dad6a' }}
          >
            +{data.improvement}kg
          </span>
        </div>

        {/* Date */}
        {showDate && (
          <div className="mt-5">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
