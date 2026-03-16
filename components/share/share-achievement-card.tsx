'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, CardDate, withAlpha } from './share-card'
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
    common: { color: '#ae9b89', label: 'Comum' },
    rare: { color: '#c29863', label: 'Rara' },
    epic: { color: '#8B5CF6', label: 'Epica' },
    legendary: { color: '#F59E0B', label: 'Lendaria' },
  }
  const rarity = rarityConfig[data.rarity]

  return (
    <ShareCard theme={theme} format={format}>
      {/* Extra glow for the icon area */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '28%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 160,
          height: 160,
          background: `radial-gradient(circle, ${withAlpha(rarity.color, 0.2)} 0%, transparent 70%)`,
          borderRadius: '50%',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        {/* Logo */}
        <BrandMark theme={theme} />

        <div className="mt-3">
          <OrnamentalDivider theme={theme} />
        </div>

        <div className="mt-3.5">
          <CardLabel text="Conquista" theme={theme} />
        </div>

        {/* Icon badge with glowing ring */}
        <div className="mt-4 relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: isDark
                ? `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)`
                : `linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.005) 100%)`,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: withAlpha(rarity.color, 0.4),
              boxShadow: `0 0 25px ${withAlpha(rarity.color, 0.2)}`,
            }}
          >
            <span className="text-4xl">{data.icon}</span>
          </div>
        </div>

        {/* Rarity pill */}
        <div
          className="mt-3 px-3 py-0.5 rounded-full"
          style={{
            backgroundColor: withAlpha(rarity.color, 0.12),
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: withAlpha(rarity.color, 0.22),
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
          className="mt-3 text-xl font-heading font-bold text-center leading-tight"
          style={{ color: colors.text }}
        >
          {data.name}
        </h2>

        {/* Description */}
        <p
          className="mt-2 text-center text-[10px] leading-relaxed max-w-[200px]"
          style={{ color: colors.secondary, opacity: 0.65 }}
        >
          {data.description}
        </p>

        {showDate && (
          <div className="mt-4">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
