'use client'

import { Silhueta } from './body-map'
import { USG_SITES } from '@/lib/usg/protocols'
import type { UsgSiteCode } from '@/lib/usg/types'
import { cn } from '@/lib/utils'

interface SiteIllustrationProps {
  site: UsgSiteCode
  /** Lado do tamanho em pixels. 64 é o tamanho usado durante a coleta. */
  size?: number
  className?: string
}

/**
 * Miniatura do ponto anatômico, para acompanhar o campo durante a coleta.
 *
 * Mostra só a vista onde o ponto fica: um marcador do tríceps desenhado de
 * frente mandaria a nutricionista para o lugar errado.
 */
export function SiteIllustration({ site, size = 64, className }: SiteIllustrationProps) {
  const definicao = USG_SITES[site]
  if (!definicao) return null

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role="img"
      aria-label={`Localização do ponto ${definicao.label}, vista de ${definicao.mapa.vista}`}
    >
      <Silhueta vista={definicao.mapa.vista} />
      {/* Halo pulsante para o olho encontrar o ponto sem procurar. */}
      <circle
        cx={definicao.mapa.x}
        cy={definicao.mapa.y}
        r={6}
        fill="#c29863"
        opacity={0.25}
      />
      <circle
        cx={definicao.mapa.x}
        cy={definicao.mapa.y}
        r={3}
        fill="#c29863"
        stroke="#ffffff"
        strokeWidth={1}
      />
    </svg>
  )
}
