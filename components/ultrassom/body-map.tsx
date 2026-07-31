'use client'

import { useMemo } from 'react'
import { USG_SITES } from '@/lib/usg/protocols'
import type { UsgSiteCode } from '@/lib/usg/types'
import { cn } from '@/lib/utils'

export interface BodyMapPonto {
  site: UsgSiteCode
  /** Espessura em mm. null quando o sítio ainda não foi medido. */
  valor: number | null
  /** Variação contra a avaliação anterior, em mm. */
  delta?: number | null
  /** true quando a variação é favorável ao paciente. */
  favoravel?: boolean | null
  destaque?: boolean
}

interface BodyMapProps {
  pontos: BodyMapPonto[]
  /** 'pro' mostra o nome clínico; 'paciente' mostra o nome leigo. */
  variante?: 'pro' | 'paciente'
  onSiteTap?: (site: UsgSiteCode) => void
  className?: string
}

// Silhueta simples de traço. Deliberadamente esquemática: o que importa é
// localizar o ponto, não representar anatomia. O viewBox é 0–100 nos dois
// eixos, e as coordenadas dos sítios vivem no catálogo (lib/usg/protocols.ts).
const TORSO = 'M 35,18 L 34,32 L 37,46 L 42,53 L 58,53 L 63,46 L 66,32 L 65,18 Z'
const BRACO_ESQ = 'M 34,19 L 30,32 L 27,46 L 31,47 L 33,33 L 37,20 Z'
const BRACO_DIR = 'M 66,19 L 70,32 L 73,46 L 69,47 L 67,33 L 63,20 Z'
const PERNA_ESQ = 'M 42,53 L 39,72 L 37.5,90 L 44,90 L 45,72 L 48,53 Z'
const PERNA_DIR = 'M 58,53 L 61,72 L 62.5,90 L 56,90 L 55,72 L 52,53 Z'

const COR_TRACO = '#d4cbc2'
const COR_PREENCHIMENTO = '#f2ece5'
const COR_NEUTRA = '#ae9b89'
const COR_FAVORAVEL = '#7dad6a'
const COR_DESFAVORAVEL = '#663739'
const COR_DOURADO = '#c29863'

function corDoPonto(ponto: BodyMapPonto): string {
  if (ponto.valor === null) return COR_TRACO
  if (ponto.destaque) return COR_DOURADO
  if (ponto.favoravel === true) return COR_FAVORAVEL
  if (ponto.favoravel === false) return COR_DESFAVORAVEL
  return COR_NEUTRA
}

export function Silhueta({ vista }: { vista: 'frente' | 'costas' }) {
  return (
    <g fill={COR_PREENCHIMENTO} stroke={COR_TRACO} strokeWidth={0.8} strokeLinejoin="round">
      <circle cx={50} cy={8} r={6} />
      <rect x={47.5} y={13} width={5} height={5} />
      <path d={TORSO} />
      <path d={BRACO_ESQ} />
      <path d={BRACO_DIR} />
      <path d={PERNA_ESQ} />
      <path d={PERNA_DIR} />
      {vista === 'costas' && (
        // Linha da coluna, só para o avaliador distinguir a vista de costas.
        <line x1={50} y1={20} x2={50} y2={50} stroke={COR_TRACO} strokeWidth={0.6} />
      )}
    </g>
  )
}

/**
 * Mapa corporal com a espessura medida em cada ponto.
 *
 * Duas silhuetas lado a lado (frente e costas) porque tríceps e subescapular
 * ficam nas costas — desenhar tudo de frente colocaria o marcador num lugar
 * onde a nutricionista não encosta o transdutor.
 */
export function BodyMap({
  pontos,
  variante = 'pro',
  onSiteTap,
  className,
}: BodyMapProps) {
  const { frente, costas, musculo } = useMemo(() => {
    const frente: BodyMapPonto[] = []
    const costas: BodyMapPonto[] = []
    const musculo: BodyMapPonto[] = []
    for (const ponto of pontos) {
      const site = USG_SITES[ponto.site]
      if (!site) continue
      // Músculo ganha silhueta própria: reto femoral, vasto lateral e coxa
      // ficam a poucos milímetros uns dos outros no desenho, e as áreas de
      // toque se cobririam.
      if (site.tecido === 'musculo') musculo.push(ponto)
      else if (site.mapa.vista === 'costas') costas.push(ponto)
      else frente.push(ponto)
    }
    return { frente, costas, musculo }
  }, [pontos])

  const renderPontos = (lista: BodyMapPonto[]) =>
    lista.map((ponto) => {
      const site = USG_SITES[ponto.site]
      const cor = corDoPonto(ponto)
      const nome = variante === 'paciente' ? site.labelLeigo : site.label
      const texto =
        ponto.valor === null
          ? `${nome}: não medido`
          : `${nome}: ${ponto.valor.toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} milímetros`

      return (
        <g
          key={`${ponto.site}-${site.mapa.vista}`}
          onClick={onSiteTap ? () => onSiteTap(ponto.site) : undefined}
          className={onSiteTap ? 'cursor-pointer group' : undefined}
          role={onSiteTap ? 'button' : undefined}
          tabIndex={onSiteTap ? 0 : undefined}
          aria-label={texto}
          onKeyDown={
            onSiteTap
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSiteTap(ponto.site)
                  }
                }
              : undefined
          }
        >
          {/* Área de toque generosa, invisível: o marcador visível tem 2,6 de
              raio no viewBox, pequeno demais para o dedo. */}
          <circle cx={site.mapa.x} cy={site.mapa.y} r={6} fill="transparent" />
          <circle
            cx={site.mapa.x}
            cy={site.mapa.y}
            r={2.6}
            fill={cor}
            stroke="#ffffff"
            strokeWidth={0.8}
          />
          {/* Anel de foco: no SVG o outline padrão do navegador some. */}
          <circle
            cx={site.mapa.x}
            cy={site.mapa.y}
            r={5}
            fill="none"
            stroke="#8a6432"
            strokeWidth={1}
            className="opacity-0 group-focus-visible:opacity-100"
          />
          {ponto.valor !== null && (
            <text
              x={site.mapa.x}
              y={site.mapa.y - 4}
              textAnchor="middle"
              fontSize={3.6}
              fill="#322b29"
              fontWeight={600}
            >
              {ponto.valor.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </text>
          )}
        </g>
      )
    })

  const temCostas = costas.length > 0
  const temMusculo = musculo.length > 0

  // O desenho é redundante: o dado precisa existir em texto para quem usa
  // leitor de tela ou não enxerga a diferença de cor entre favorável e não.
  const resumoTextual = pontos
    .map((ponto) => {
      const site = USG_SITES[ponto.site]
      if (!site) return null
      const nome = variante === 'paciente' ? site.labelLeigo : site.label
      if (ponto.valor === null) return `${nome}: não medido`
      const valor = ponto.valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
      const variacao =
        ponto.delta === null || ponto.delta === undefined
          ? ''
          : `, ${ponto.delta > 0 ? 'aumento' : 'redução'} de ${Math.abs(
              ponto.delta
            ).toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} milímetros`
      return `${nome}: ${valor} milímetros${variacao}`
    })
    .filter((linha): linha is string => linha !== null)

  return (
    <div className={cn('flex flex-col', className)}>
      <ul className="sr-only">
        {resumoTextual.map((linha) => (
          <li key={linha}>{linha}</li>
        ))}
      </ul>

      <div className="flex items-start justify-center gap-2">
      <figure className="flex-1 max-w-[220px]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-auto"
          role={onSiteTap ? 'group' : 'img'}
          aria-label={`Vista de frente com ${frente.length} ponto(s) de medição`}
        >
          <Silhueta vista="frente" />
          {renderPontos(frente)}
        </svg>
        <figcaption className="text-center text-label-sm text-foreground-muted mt-1">
          Frente
        </figcaption>
      </figure>

      {temCostas && (
        <figure className="flex-1 max-w-[220px]">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-auto"
            role={onSiteTap ? 'group' : 'img'}
            aria-label={`Vista de costas com ${costas.length} ponto(s) de medição`}
          >
            <Silhueta vista="costas" />
            {renderPontos(costas)}
          </svg>
          <figcaption className="text-center text-label-sm text-foreground-muted mt-1">
            Costas
          </figcaption>
        </figure>
      )}

      {temMusculo && (
        <figure className="flex-1 max-w-[220px]">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-auto"
            role={onSiteTap ? 'group' : 'img'}
            aria-label={`Espessura muscular em ${musculo.length} ponto(s)`}
          >
            <Silhueta vista="frente" />
            {renderPontos(musculo)}
          </svg>
          <figcaption className="text-center text-label-sm text-foreground-muted mt-1">
            Músculo
          </figcaption>
        </figure>
      )}
      </div>
    </div>
  )
}
