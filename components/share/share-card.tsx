'use client'

import { cn } from '@/lib/utils'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat } from '@/types/share'

// Convert hex color to rgba
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface ShareCardProps {
  theme: ShareTheme
  format: ShareFormat
  children: React.ReactNode
  className?: string
}

export function ShareCard({ theme, format, children, className }: ShareCardProps) {
  const colors = getThemeColors(theme)
  const a = (alpha: number) => withAlpha(colors.accent, alpha)
  const isGradient = colors.background.includes('gradient')

  const aspectRatios = {
    square: 'aspect-square',
    story: 'aspect-[9/16]',
    wide: 'aspect-[1.91/1]',
  }

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
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: a(0.15),
      }}
    >
      {/* ═══ SIGNATURE GOLDEN ARCS ═══ */}

      {/* Arc 1 — Large, sweeping from upper-right corner */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-28%',
          right: '-22%',
          width: '92%',
          height: '92%',
          borderRadius: '50%',
          border: `2.5px solid ${a(0.32)}`,
          boxShadow: `0 0 30px ${a(0.1)}, inset 0 0 30px ${a(0.05)}`,
        }}
      />

      {/* Arc 2 — Complementary, from lower-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-18%',
          left: '-12%',
          width: '58%',
          height: '58%',
          borderRadius: '50%',
          border: `2px solid ${a(0.22)}`,
          boxShadow: `0 0 20px ${a(0.06)}`,
        }}
      />

      {/* Arc 3 — Subtle third ring, depth detail */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '8%',
          right: '-38%',
          width: '72%',
          height: '72%',
          borderRadius: '50%',
          border: `1px solid ${a(0.1)}`,
        }}
      />

      {/* Golden atmospheric pool — warm glow rising from bottom */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: '-15%',
          right: '-15%',
          height: '50%',
          background: `linear-gradient(to top, ${a(0.14)} 0%, ${a(0.05)} 50%, transparent 100%)`,
          clipPath: 'ellipse(70% 100% at 50% 100%)',
        }}
      />

      {/* Upper-right warm glow — light source from arc */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-8%',
          right: '-8%',
          width: '55%',
          height: '55%',
          background: `radial-gradient(circle at center, ${a(0.06)} 0%, transparent 70%)`,
          borderRadius: '50%',
        }}
      />

      {/* Subtle diagonal texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 14px, ${a(0.03)} 14px, ${a(0.03)} 14.5px)`,
        }}
      />

      {/* Content */}
      {children}

      {/* Bottom brand — COMPLEXO WELLNESS */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-3.5">
        <span
          className="text-[7px] font-semibold tracking-[0.3em] uppercase"
          style={{ color: colors.accent, opacity: 0.4 }}
        >
          Complexo Wellness
        </span>
      </div>
    </div>
  )
}

// ═══ BRAND MARK — The Complexo logo ═══
interface BrandMarkProps {
  theme: ShareTheme
}

export function BrandMark({ theme }: BrandMarkProps) {
  const colors = getThemeColors(theme)
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-sm font-heading font-bold tracking-[0.3em]"
        style={{ color: colors.accent }}
      >
        COMPLEXO
      </span>
      <span
        className="text-[8px] tracking-[0.4em] mt-0.5"
        style={{ color: colors.secondary, opacity: 0.6 }}
      >
        WELLNESS
      </span>
    </div>
  )
}

// ═══ ORNAMENTAL DIVIDER — thin gold line ═══
interface OrnamentalDividerProps {
  theme: ShareTheme
}

export function OrnamentalDivider({ theme }: OrnamentalDividerProps) {
  const colors = getThemeColors(theme)
  return (
    <div className="w-10 h-[0.5px]" style={{ backgroundColor: withAlpha(colors.accent, 0.3) }} />
  )
}

// ═══ STAT ROW — horizontal stats with vertical dividers ═══
interface StatRowProps {
  stats: { label: string; value: string | number }[]
  theme: ShareTheme
}

export function StatRow({ stats, theme }: StatRowProps) {
  const colors = getThemeColors(theme)
  const a = (alpha: number) => withAlpha(colors.accent, alpha)

  return (
    <div className="flex items-center justify-center">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <div
              className="w-[1px] h-7 mx-3.5"
              style={{ backgroundColor: a(0.18) }}
            />
          )}
          <div className="flex flex-col items-center min-w-[48px]">
            <span
              className="text-lg font-heading font-bold leading-none"
              style={{ color: colors.text }}
            >
              {stat.value}
            </span>
            <span
              className="text-[7px] uppercase tracking-[0.12em] mt-1"
              style={{ color: colors.secondary, opacity: 0.55 }}
            >
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══ CARD LABEL — type identifier ═══
interface CardLabelProps {
  text: string
  theme: ShareTheme
}

export function CardLabel({ text, theme }: CardLabelProps) {
  const colors = getThemeColors(theme)
  return (
    <span
      className="text-[10px] font-semibold tracking-[0.2em] uppercase"
      style={{ color: colors.accent }}
    >
      {text}
    </span>
  )
}

// ═══ CARD DATE ═══
interface CardDateProps {
  date: string
  theme: ShareTheme
}

export function CardDate({ date, theme }: CardDateProps) {
  const colors = getThemeColors(theme)
  return (
    <span
      className="text-[9px] tracking-[0.1em]"
      style={{ color: colors.secondary, opacity: 0.45 }}
    >
      {date}
    </span>
  )
}
