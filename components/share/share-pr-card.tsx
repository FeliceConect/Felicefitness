'use client'

import { ShareCard, CardTitle, CardDate } from './share-card'
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
      {/* Celebration particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: colors.accent,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Trophy */}
        <div className="text-6xl mb-4">🏆</div>

        {/* Title */}
        <CardTitle text="Novo Recorde!" theme={theme} size="lg" />

        {/* Exercise Name */}
        <div className="mt-6 text-2xl font-bold uppercase tracking-wide" style={{ color: colors.text }}>
          {data.exercise}
        </div>

        {/* New Weight */}
        <div className="mt-4">
          <span className="text-6xl font-black" style={{ color: colors.primary }}>
            {data.weight}
          </span>
          <span className="text-3xl font-bold ml-2" style={{ color: colors.text }}>
            kg
          </span>
        </div>

        {/* Previous / Improvement */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-lg" style={{ color: colors.secondary }}>
            Anterior: {data.previousWeight}kg
          </span>
          <span
            className="text-2xl font-bold px-4 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
            }}
          >
            +{data.improvement}kg 💪
          </span>
        </div>

        {/* Date */}
        {showDate && (
          <div className="mt-8">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
