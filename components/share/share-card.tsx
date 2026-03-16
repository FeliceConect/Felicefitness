'use client'

import { cn } from '@/lib/utils'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat } from '@/types/share'

// Convert hex to rgba
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Mesh gradient per theme — creates rich, warm, living backgrounds
function getMeshGradient(theme: ShareTheme): string {
  switch (theme) {
    case 'power':
      // Vinho glow bottom-left + dourado glow top-right + nude center
      return [
        'radial-gradient(ellipse at 12% 82%, rgba(102, 55, 57, 0.5) 0%, transparent 55%)',
        'radial-gradient(ellipse at 88% 18%, rgba(194, 152, 99, 0.35) 0%, transparent 50%)',
        'radial-gradient(ellipse at 50% 50%, rgba(174, 155, 137, 0.08) 0%, transparent 55%)',
      ].join(', ')
    case 'light':
      // Subtle gold + vinho tints on cream
      return [
        'radial-gradient(ellipse at 12% 85%, rgba(194, 152, 99, 0.18) 0%, transparent 50%)',
        'radial-gradient(ellipse at 88% 12%, rgba(102, 55, 57, 0.1) 0%, transparent 50%)',
        'radial-gradient(ellipse at 50% 50%, rgba(194, 152, 99, 0.06) 0%, transparent 60%)',
      ].join(', ')
    case 'gradient':
      // Dourado glow on vinho
      return [
        'radial-gradient(ellipse at 25% 75%, rgba(194, 152, 99, 0.25) 0%, transparent 50%)',
        'radial-gradient(ellipse at 75% 25%, rgba(221, 213, 199, 0.12) 0%, transparent 50%)',
      ].join(', ')
    case 'fire':
      // White + cream glow on gold-to-vinho
      return [
        'radial-gradient(ellipse at 50% 25%, rgba(255, 255, 255, 0.18) 0%, transparent 55%)',
        'radial-gradient(ellipse at 20% 80%, rgba(221, 213, 199, 0.12) 0%, transparent 50%)',
      ].join(', ')
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
      {/* ═══ MESH GRADIENT — living, warm background ═══ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: getMeshGradient(theme) }}
      />

      {/* ═══ FILM GRAIN TEXTURE — tactile quality ═══ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          opacity: 0.045,
        }}
      />

      {/* ═══ CW MONOGRAM WATERMARK ═══ */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 170,
          fontFamily: 'Butler, serif',
          fontWeight: 900,
          color: a(0.055),
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        CW
      </div>

      {/* ═══ SIGNATURE GOLDEN ARCS ═══ */}

      {/* Arc 1 — Bold sweep from upper-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-22%',
          right: '-15%',
          width: '85%',
          height: '85%',
          borderRadius: '50%',
          border: `3px solid ${a(0.42)}`,
          boxShadow: `0 0 50px ${a(0.14)}, inset 0 0 35px ${a(0.07)}`,
        }}
      />

      {/* Arc 2 — Complementary from lower-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-12%',
          left: '-8%',
          width: '52%',
          height: '52%',
          borderRadius: '50%',
          border: `2.5px solid ${a(0.32)}`,
          boxShadow: `0 0 30px ${a(0.1)}`,
        }}
      />

      {/* ═══ THE GOLDEN RING — focal frame ═══ */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '44%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '48%',
          aspectRatio: '1',
          borderRadius: '50%',
          border: `2.5px solid ${a(0.28)}`,
          boxShadow: `0 0 50px ${a(0.14)}, 0 0 100px ${a(0.06)}, inset 0 0 30px ${a(0.05)}`,
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

// ═══ BRAND MARK ═══
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
