'use client'

import { cn } from '@/lib/utils'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat } from '@/types/share'

interface ShareCardProps {
  theme: ShareTheme
  format: ShareFormat
  children: React.ReactNode
  className?: string
}

export function ShareCard({ theme, format, children, className }: ShareCardProps) {
  const colors = getThemeColors(theme)

  const aspectRatios = {
    square: 'aspect-square',
    story: 'aspect-[9/16]',
    wide: 'aspect-[1.91/1]',
  }

  const isGradient = colors.background.includes('gradient')

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl w-full',
        aspectRatios[format],
        className
      )}
      style={{
        background: isGradient ? colors.background : undefined,
        backgroundColor: !isGradient ? colors.background : undefined,
      }}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 opacity-[0.07]"
        style={{ background: `radial-gradient(circle at 0% 0%, ${colors.accent} 0%, transparent 70%)` }}
      />
      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.07]"
        style={{ background: `radial-gradient(circle at 100% 100%, ${colors.accent} 0%, transparent 70%)` }}
      />

      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />

      {children}

      {/* Brand watermark — elegant bottom bar */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-[1px] opacity-30" style={{ backgroundColor: colors.accent }} />
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-40"
            style={{ color: colors.accent }}
          >
            Complexo Wellness
          </span>
          <div className="w-4 h-[1px] opacity-30" style={{ backgroundColor: colors.accent }} />
        </div>
      </div>
    </div>
  )
}

// Stat Box Component — glass morphism style
interface StatBoxProps {
  label: string
  value: string | number
  theme: ShareTheme
  size?: 'sm' | 'md' | 'lg'
  accent?: boolean
}

export function StatBox({ label, value, theme, size = 'md', accent }: StatBoxProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  const sizes = {
    sm: { value: 'text-lg', label: 'text-[10px]' },
    md: { value: 'text-xl', label: 'text-[10px]' },
    lg: { value: 'text-3xl', label: 'text-xs' },
  }

  return (
    <div
      className="flex flex-col items-center py-2.5 px-2 rounded-xl"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }}
    >
      <span
        className={cn('font-bold font-heading', sizes[size].value)}
        style={{ color: accent ? colors.accent : colors.text }}
      >
        {value}
      </span>
      <span
        className={cn('uppercase tracking-wider mt-0.5', sizes[size].label)}
        style={{ color: colors.secondary, opacity: 0.7 }}
      >
        {label}
      </span>
    </div>
  )
}

// Title Component
interface CardTitleProps {
  icon?: string
  text: string
  theme: ShareTheme
  size?: 'sm' | 'md' | 'lg'
}

export function CardTitle({ icon, text, theme, size = 'md' }: CardTitleProps) {
  const colors = getThemeColors(theme)

  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {icon && <span className={sizes[size]}>{icon}</span>}
      <span className={cn('font-semibold tracking-[0.15em] uppercase', sizes[size])}
        style={{ color: colors.accent }}
      >
        {text}
      </span>
    </div>
  )
}

// Subtitle Component
interface CardSubtitleProps {
  text: string
  theme: ShareTheme
  size?: 'sm' | 'md' | 'lg'
}

export function CardSubtitle({ text, theme, size = 'md' }: CardSubtitleProps) {
  const colors = getThemeColors(theme)

  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <span
      className={cn('font-heading font-bold', sizes[size])}
      style={{ color: colors.text }}
    >
      {text}
    </span>
  )
}

// Date Component
interface CardDateProps {
  date: string
  theme: ShareTheme
}

export function CardDate({ date, theme }: CardDateProps) {
  const colors = getThemeColors(theme)

  return (
    <span
      className="text-xs tracking-wide"
      style={{ color: colors.secondary, opacity: 0.6 }}
    >
      {date}
    </span>
  )
}
