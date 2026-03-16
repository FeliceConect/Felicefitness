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
        borderColor: a(0.12),
      }}
    >
      {/* ═══ LAYER 1: CW MONOGRAM WATERMARK ═══ */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 160,
          fontFamily: 'Butler, serif',
          fontWeight: 900,
          color: a(0.045),
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        CW
      </div>

      {/* ═══ LAYER 2: SIGNATURE GOLDEN ARCS ═══ */}

      {/* Arc 1 — Bold sweep from upper-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%',
          right: '-18%',
          width: '88%',
          height: '88%',
          borderRadius: '50%',
          border: `3px solid ${a(0.38)}`,
          boxShadow: `0 0 40px ${a(0.12)}, inset 0 0 30px ${a(0.06)}`,
        }}
      />

      {/* Arc 2 — Complementary from lower-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-15%',
          left: '-10%',
          width: '55%',
          height: '55%',
          borderRadius: '50%',
          border: `2.5px solid ${a(0.28)}`,
          boxShadow: `0 0 25px ${a(0.08)}`,
        }}
      />

      {/* ═══ LAYER 3: THE GOLDEN RING — focal frame ═══ */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '44%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '48%',
          aspectRatio: '1',
          borderRadius: '50%',
          border: `2.5px solid ${a(0.22)}`,
          boxShadow: `0 0 35px ${a(0.1)}, inset 0 0 25px ${a(0.04)}`,
        }}
      />

      {/* ═══ LAYER 4: GOLDEN ATMOSPHERE ═══ */}

      {/* Warm pool rising from bottom */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: '-15%',
          right: '-15%',
          height: '45%',
          background: `linear-gradient(to top, ${a(0.12)} 0%, ${a(0.04)} 50%, transparent 100%)`,
          clipPath: 'ellipse(70% 100% at 50% 100%)',
        }}
      />

      {/* Glow from main arc area */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-5%',
          right: '-5%',
          width: '50%',
          height: '50%',
          background: `radial-gradient(circle at center, ${a(0.07)} 0%, transparent 70%)`,
          borderRadius: '50%',
        }}
      />

      {/* ═══ CONTENT ═══ */}
      {children}

      {/* ═══ BOTTOM BRAND ═══ */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-3">
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

// ═══ BRAND MARK — Complexo logo representation ═══
export function BrandMark({ theme }: { theme: ShareTheme }) {
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
        className="text-[7px] tracking-[0.4em] mt-0.5 uppercase"
        style={{ color: colors.secondary, opacity: 0.55 }}
      >
        Wellness
      </span>
    </div>
  )
}

// ═══ ORNAMENTAL DIVIDER ═══
export function OrnamentalDivider({ theme }: { theme: ShareTheme }) {
  const colors = getThemeColors(theme)
  return (
    <div className="w-10 h-[0.5px]" style={{ backgroundColor: withAlpha(colors.accent, 0.3) }} />
  )
}

// ═══ STAT ROW — horizontal stats with gold vertical dividers ═══
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
