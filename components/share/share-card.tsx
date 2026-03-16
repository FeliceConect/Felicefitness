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
  const accentColor = colors.accent

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
      {/* Diagonal stripe pattern — luxury texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, ${accentColor}08 10px, ${accentColor}08 10.5px)`,
        }}
      />

      {/* Subtle radial glow in center */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${accentColor}08 0%, transparent 70%)`,
        }}
      />

      {/* Inner rectangular frame — Art Deco style */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 14,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: `${accentColor}25`,
        }}
      />

      {/* Corner brackets — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 10,
          left: 10,
          width: 24,
          height: 24,
          borderTop: `1.5px solid ${accentColor}60`,
          borderLeft: `1.5px solid ${accentColor}60`,
        }}
      />
      {/* Corner brackets — top right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 10,
          right: 10,
          width: 24,
          height: 24,
          borderTop: `1.5px solid ${accentColor}60`,
          borderRight: `1.5px solid ${accentColor}60`,
        }}
      />
      {/* Corner brackets — bottom left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 10,
          left: 10,
          width: 24,
          height: 24,
          borderBottom: `1.5px solid ${accentColor}60`,
          borderLeft: `1.5px solid ${accentColor}60`,
        }}
      />
      {/* Corner brackets — bottom right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 10,
          right: 10,
          width: 24,
          height: 24,
          borderBottom: `1.5px solid ${accentColor}60`,
          borderRight: `1.5px solid ${accentColor}60`,
        }}
      />

      {/* Children content */}
      {children}

      {/* Bottom brand watermark — membership feel */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-[0.5px]" style={{ backgroundColor: `${accentColor}30` }} />
          <div
            className="w-1 h-1 rotate-45"
            style={{ backgroundColor: `${accentColor}40` }}
          />
          <span
            className="text-[7px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: accentColor, opacity: 0.45 }}
          >
            Membro Complexo Wellness
          </span>
          <div
            className="w-1 h-1 rotate-45"
            style={{ backgroundColor: `${accentColor}40` }}
          />
          <div className="w-3 h-[0.5px]" style={{ backgroundColor: `${accentColor}30` }} />
        </div>
      </div>
    </div>
  )
}

// Brand mark — COMPLEXO text for top of cards
interface BrandMarkProps {
  theme: ShareTheme
}

export function BrandMark({ theme }: BrandMarkProps) {
  const colors = getThemeColors(theme)
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-[10px] font-heading font-bold tracking-[0.35em] uppercase"
        style={{ color: colors.accent, opacity: 0.7 }}
      >
        Complexo
      </span>
    </div>
  )
}

// Ornamental divider — ── ◆ ── pattern
interface OrnamentalDividerProps {
  theme: ShareTheme
  width?: string
}

export function OrnamentalDivider({ theme, width = 'max-w-[100px]' }: OrnamentalDividerProps) {
  const colors = getThemeColors(theme)
  return (
    <div className={cn('flex items-center gap-1.5 w-full', width)}>
      <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `${colors.accent}30` }} />
      <div
        className="w-[5px] h-[5px] rotate-45"
        style={{ backgroundColor: `${colors.accent}40` }}
      />
      <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `${colors.accent}30` }} />
    </div>
  )
}

// Stat Box Component — glass morphism with accent top line
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
    sm: { value: 'text-lg', label: 'text-[8px]' },
    md: { value: 'text-xl', label: 'text-[8px]' },
    lg: { value: 'text-3xl', label: 'text-[9px]' },
  }

  return (
    <div
      className="flex flex-col items-center py-2.5 px-2 rounded-lg relative overflow-hidden"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      }}
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 inset-x-0 h-[1.5px]"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${colors.accent}50 50%, transparent 90%)`,
        }}
      />
      <span
        className={cn('font-bold font-heading', sizes[size].value)}
        style={{ color: accent ? colors.accent : colors.text }}
      >
        {value}
      </span>
      <span
        className={cn('uppercase tracking-[0.15em] mt-0.5', sizes[size].label)}
        style={{ color: colors.secondary, opacity: 0.6 }}
      >
        {label}
      </span>
    </div>
  )
}

// Card type label — small uppercase tag
interface CardLabelProps {
  text: string
  theme: ShareTheme
}

export function CardLabel({ text, theme }: CardLabelProps) {
  const colors = getThemeColors(theme)
  return (
    <span
      className="text-[10px] font-semibold tracking-[0.2em] uppercase"
      style={{ color: colors.accent, opacity: 0.9 }}
    >
      {text}
    </span>
  )
}

// Date Component — minimal
interface CardDateProps {
  date: string
  theme: ShareTheme
}

export function CardDate({ date, theme }: CardDateProps) {
  const colors = getThemeColors(theme)
  return (
    <span
      className="text-[9px] tracking-[0.1em]"
      style={{ color: colors.secondary, opacity: 0.5 }}
    >
      {date}
    </span>
  )
}
