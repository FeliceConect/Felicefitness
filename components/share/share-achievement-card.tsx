'use client'

import { ShareCard, CardDate } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, AchievementShareData } from '@/types/share'

interface ShareAchievementCardProps {
  data: AchievementShareData
  theme: ShareTheme
  format: ShareFormat
  showDate?: boolean
}

export function ShareAchievementCard({
  data,
  theme,
  format,
  showDate = true,
}: ShareAchievementCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  const rarityConfig = {
    common: { color: '#ae9b89', label: 'Comum', glow: 'rgba(174, 155, 137, 0.3)' },
    rare: { color: '#c29863', label: 'Rara', glow: 'rgba(194, 152, 99, 0.4)' },
    epic: { color: '#8B5CF6', label: 'Epica', glow: 'rgba(139, 92, 246, 0.4)' },
    legendary: { color: '#F59E0B', label: 'Lendaria', glow: 'rgba(245, 158, 11, 0.5)' },
  }

  const rarity = rarityConfig[data.rarity]

  return (
    <ShareCard theme={theme} format={format}>
      {/* Rarity glow — subtle radial behind icon */}
      <div
        className="absolute"
        style={{
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${rarity.glow} 0%, transparent 70%)`,
          opacity: 0.6,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        {/* Top label */}
        <span
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: colors.accent, opacity: 0.8 }}
        >
          Conquista Desbloqueada
        </span>

        {/* Badge Icon — large with ring */}
        <div className="mt-6 relative">
          {/* Outer ring */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: isDark
                ? `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`
                : `linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 100%)`,
              borderWidth: 2,
              borderColor: `${rarity.color}50`,
              boxShadow: `0 0 30px ${rarity.glow}`,
            }}
          >
            <span className="text-5xl">{data.icon}</span>
          </div>
        </div>

        {/* Rarity pill */}
        <div
          className="mt-4 px-3.5 py-1 rounded-full"
          style={{
            backgroundColor: `${rarity.color}18`,
            borderWidth: 1,
            borderColor: `${rarity.color}30`,
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: rarity.color }}
          >
            {rarity.label}
          </span>
        </div>

        {/* Achievement Name */}
        <h2
          className="mt-5 text-2xl font-heading font-bold text-center leading-tight"
          style={{ color: colors.text }}
        >
          {data.name}
        </h2>

        {/* Description */}
        <p
          className="mt-2.5 text-center text-sm max-w-[240px] leading-relaxed"
          style={{ color: colors.secondary, opacity: 0.8 }}
        >
          {data.description}
        </p>

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
