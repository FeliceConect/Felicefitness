'use client'

import { ShareCard, CardDate } from './share-card'
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
        className="absolute"
        style={{
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 260,
          height: 260,
          background: `radial-gradient(circle, rgba(194, 152, 99, 0.25) 0%, transparent 65%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        {/* Top label */}
        <span
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: colors.accent, opacity: 0.8 }}
        >
          Novo Recorde Pessoal
        </span>

        {/* Trophy */}
        <div className="mt-4 text-4xl">🏆</div>

        {/* Exercise Name */}
        <h2
          className="mt-4 text-lg font-semibold uppercase tracking-[0.1em] text-center"
          style={{ color: colors.secondary }}
        >
          {data.exercise}
        </h2>

        {/* Hero Weight */}
        <div className="mt-4 flex items-baseline gap-1">
          <span
            className="text-7xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.text }}
          >
            {data.weight}
          </span>
          <span
            className="text-2xl font-heading font-bold"
            style={{ color: colors.secondary }}
          >
            kg
          </span>
        </div>

        {/* Improvement badge */}
        <div
          className="mt-5 flex items-center gap-3 px-5 py-2.5 rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(125, 173, 106, 0.12)' : 'rgba(125, 173, 106, 0.1)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(125, 173, 106, 0.2)' : 'rgba(125, 173, 106, 0.18)',
          }}
        >
          <div className="flex flex-col items-center">
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: colors.secondary, opacity: 0.6 }}
            >
              Anterior
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: colors.secondary }}
            >
              {data.previousWeight}kg
            </span>
          </div>
          <span style={{ color: colors.accent, opacity: 0.4 }}>→</span>
          <div className="flex flex-col items-center">
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: '#7dad6a', opacity: 0.8 }}
            >
              Melhoria
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: '#7dad6a' }}
            >
              +{data.improvement}kg
            </span>
          </div>
        </div>

        {/* Date */}
        {showDate && (
          <div className="mt-6">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
