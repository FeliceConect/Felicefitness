'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, CardDate } from './share-card'
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
    common: { color: '#ae9b89', label: 'Comum', glow: 'rgba(174, 155, 137, 0.25)' },
    rare: { color: '#c29863', label: 'Rara', glow: 'rgba(194, 152, 99, 0.35)' },
    epic: { color: '#8B5CF6', label: 'Epica', glow: 'rgba(139, 92, 246, 0.35)' },
    legendary: { color: '#F59E0B', label: 'Lendaria', glow: 'rgba(245, 158, 11, 0.4)' },
  }

  const rarity = rarityConfig[data.rarity]

  return (
    <ShareCard theme={theme} format={format}>
      {/* Rarity glow behind icon area */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 180,
          height: 180,
          background: `radial-gradient(circle, ${rarity.glow} 0%, transparent 70%)`,
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
          <CardLabel text="Conquista" theme={theme} />
        </div>

        {/* Badge Icon — with ring */}
        <div className="mt-4 relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: isDark
                ? `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)`
                : `linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.005) 100%)`,
              borderWidth: 1.5,
              borderColor: `${rarity.color}45`,
              boxShadow: `0 0 25px ${rarity.glow}`,
            }}
          >
            <span className="text-4xl">{data.icon}</span>
          </div>
        </div>

        {/* Rarity pill */}
        <div
          className="mt-3 px-3 py-1 rounded-full"
          style={{
            backgroundColor: `${rarity.color}15`,
            borderWidth: 1,
            borderColor: `${rarity.color}25`,
          }}
        >
          <span
            className="text-[8px] font-bold uppercase tracking-[0.2em]"
            style={{ color: rarity.color }}
          >
            {rarity.label}
          </span>
        </div>

        {/* Achievement Name */}
        <h2
          className="mt-3.5 text-xl font-heading font-bold text-center leading-tight"
          style={{ color: colors.text }}
        >
          {data.name}
        </h2>

        {/* Description */}
        <p
          className="mt-2 text-center text-[11px] leading-relaxed max-w-[200px]"
          style={{ color: colors.secondary, opacity: 0.7 }}
        >
          {data.description}
        </p>

        {/* Date */}
        {showDate && (
          <div className="mt-4">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
