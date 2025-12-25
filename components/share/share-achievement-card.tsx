'use client'

import { ShareCard, CardTitle, CardDate } from './share-card'
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

  const rarityColors = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  }

  const rarityLabels = {
    common: 'Comum',
    rare: 'Rara',
    epic: 'Epica',
    legendary: 'Lendaria',
  }

  const rarityColor = rarityColors[data.rarity]

  return (
    <ShareCard theme={theme} format={format}>
      {/* Sparkle effect for legendary */}
      {data.rarity === 'legendary' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Badge Icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            backgroundColor: `${rarityColor}20`,
            boxShadow: `0 0 40px ${rarityColor}40`,
          }}
        >
          {data.icon}
        </div>

        {/* Rarity Badge */}
        <div
          className="mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${rarityColor}20`,
            color: rarityColor,
          }}
        >
          {rarityLabels[data.rarity]}
        </div>

        {/* Title */}
        <div className="mt-4">
          <CardTitle text="Conquista Desbloqueada!" theme={theme} />
        </div>

        {/* Achievement Name */}
        <div
          className="mt-4 text-3xl font-bold text-center"
          style={{ color: colors.primary }}
        >
          {data.name}
        </div>

        {/* Description */}
        <div
          className="mt-3 text-center max-w-xs text-lg"
          style={{ color: colors.secondary }}
        >
          {data.description}
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
