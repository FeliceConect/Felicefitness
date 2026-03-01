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
        'relative overflow-hidden rounded-xl',
        aspectRatios[format],
        className
      )}
      style={{
        background: isGradient ? colors.background : undefined,
        backgroundColor: !isGradient ? colors.background : undefined,
      }}
    >
      {children}

      {/* Watermark */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium opacity-70"
        style={{ color: colors.secondary }}
      >
        Complexo Wellness
      </div>
    </div>
  )
}

// Stat Box Component
interface StatBoxProps {
  label: string
  value: string | number
  theme: ShareTheme
  size?: 'sm' | 'md' | 'lg'
}

export function StatBox({ label, value, theme, size = 'md' }: StatBoxProps) {
  const colors = getThemeColors(theme)

  const sizes = {
    sm: { value: 'text-lg', label: 'text-xs' },
    md: { value: 'text-2xl', label: 'text-sm' },
    lg: { value: 'text-4xl', label: 'text-base' },
  }

  return (
    <div
      className="flex flex-col items-center p-3 rounded-xl"
      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
    >
      <span
        className={cn('font-bold', sizes[size].value)}
        style={{ color: colors.text }}
      >
        {value}
      </span>
      <span
        className={sizes[size].label}
        style={{ color: colors.secondary }}
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
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className="flex items-center justify-center gap-2" style={{ color: colors.text }}>
      {icon && <span className={sizes[size]}>{icon}</span>}
      <span className={cn('font-bold uppercase tracking-wide', sizes[size])}>{text}</span>
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
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <span
      className={cn('font-bold', sizes[size])}
      style={{ color: colors.primary }}
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
      className="text-sm"
      style={{ color: colors.secondary }}
    >
      {date}
    </span>
  )
}
