'use client'

import { cn } from '@/lib/utils'
import { getThemeColors } from '@/lib/share/templates'
import { FELICE_ICON_BASE64 } from '@/lib/share/brand-assets'
import type { ShareTheme, ShareFormat } from '@/types/share'

// Convert hex to rgba
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Brandbook geometric pattern — interlocking circles (vesica piscis)
function getPatternSvg(strokeColor: string, opacity: number): string {
  const encoded = encodeURIComponent(
    `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="30" cy="0" r="30" fill="none" stroke="${strokeColor}" stroke-width="0.6" opacity="${opacity}"/>` +
    `<circle cx="60" cy="30" r="30" fill="none" stroke="${strokeColor}" stroke-width="0.6" opacity="${opacity}"/>` +
    `<circle cx="30" cy="60" r="30" fill="none" stroke="${strokeColor}" stroke-width="0.6" opacity="${opacity}"/>` +
    `<circle cx="0" cy="30" r="30" fill="none" stroke="${strokeColor}" stroke-width="0.6" opacity="${opacity}"/>` +
    `</svg>`
  )
  return `url("data:image/svg+xml,${encoded}")`
}

// Pattern config per theme
function getPatternStyle(theme: ShareTheme): { backgroundImage: string; opacity: number } {
  switch (theme) {
    case 'power':
      return { backgroundImage: getPatternSvg('#ae9b89', 0.4), opacity: 0.12 }
    case 'light':
      return { backgroundImage: getPatternSvg('#c29863', 0.5), opacity: 0.1 }
    case 'gradient':
      return { backgroundImage: getPatternSvg('#ddd5c7', 0.4), opacity: 0.1 }
    case 'fire':
      return { backgroundImage: getPatternSvg('#ffffff', 0.3), opacity: 0.1 }
  }
}

interface ShareCardProps {
  theme: ShareTheme
  format: ShareFormat
  children: React.ReactNode
  className?: string
}

export function ShareCard({ theme, format, children, className }: ShareCardProps) {
  const colors = getThemeColors(theme)
  const isGradient = colors.background.includes('gradient')
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'
  const patternStyle = getPatternStyle(theme)

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
      }}
    >
      {/* ═══ GEOMETRIC PATTERN — brandbook identity ═══ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: patternStyle.backgroundImage,
          backgroundSize: '60px 60px',
          opacity: patternStyle.opacity,
        }}
      />

      {/* ═══ LOTUS WATERMARK — Felice symbol ═══ */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FELICE_ICON_BASE64}
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '55%',
          height: 'auto',
          opacity: isDark ? 0.04 : 0.035,
        }}
      />

      {/* ═══ GOLD FILETE — top accent line ═══ */}
      <div
        className="absolute top-0 inset-x-0 pointer-events-none"
        style={{
          height: 2,
          background: `linear-gradient(90deg, transparent, ${withAlpha(colors.accent, 0.5)}, transparent)`,
        }}
      />

      {/* ═══ GOLD FILETE — bottom accent line ═══ */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${withAlpha(colors.accent, 0.4)}, transparent)`,
        }}
      />

      {/* ═══ CONTENT ═══ */}
      {children}

      {/* ═══ BOTTOM BRAND — Felice logo ═══ */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-3 gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FELICE_ICON_BASE64}
          alt=""
          style={{ width: 14, height: 14, opacity: isDark ? 0.5 : 0.4 }}
        />
        <span
          className="text-[7px] font-heading font-bold tracking-[0.25em] uppercase"
          style={{ color: colors.accent, opacity: 0.5 }}
        >
          FELICE
        </span>
        <span
          className="text-[5px] tracking-[0.1em] uppercase"
          style={{ color: colors.secondary, opacity: 0.35 }}
        >
          Wellness
        </span>
      </div>
    </div>
  )
}

// ═══ BRAND MARK — Felice logo with lotus ═══
export function BrandMark({ theme }: { theme: ShareTheme }) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'
  return (
    <div className="flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FELICE_ICON_BASE64}
        alt=""
        style={{ width: 32, height: 32, opacity: isDark ? 0.85 : 0.7 }}
      />
      <span
        className="text-sm font-heading font-bold tracking-[0.3em] mt-1.5"
        style={{ color: colors.accent }}
      >
        FELICE
      </span>
      <span
        className="text-[6px] tracking-[0.35em] mt-0.5 uppercase"
        style={{ color: colors.secondary, opacity: 0.55 }}
      >
        Complexo Wellness
      </span>
    </div>
  )
}

// ═══ ORNAMENTAL DIVIDER — gold filete ═══
export function OrnamentalDivider({ theme }: { theme: ShareTheme }) {
  const colors = getThemeColors(theme)
  return (
    <div
      className="w-12"
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${withAlpha(colors.accent, 0.4)}, transparent)`,
      }}
    />
  )
}

// ═══ STAT ROW ═══
export function StatRow({ stats, theme }: { stats: { label: string; value: string | number }[]; theme: ShareTheme }) {
  const colors = getThemeColors(theme)
  return (
    <div className="flex items-center justify-center">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <div
              className="w-[1px] h-7 mx-3.5"
              style={{ backgroundColor: withAlpha(colors.accent, 0.18) }}
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
              style={{ color: colors.secondary, opacity: 0.5 }}
            >
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══ CARD LABEL ═══
export function CardLabel({ text, theme }: { text: string; theme: ShareTheme }) {
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
export function CardDate({ date, theme }: { date: string; theme: ShareTheme }) {
  const colors = getThemeColors(theme)
  return (
    <span
      className="text-[9px] tracking-[0.1em]"
      style={{ color: colors.secondary, opacity: 0.4 }}
    >
      {date}
    </span>
  )
}
