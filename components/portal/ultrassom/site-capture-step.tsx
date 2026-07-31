'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Info, SkipForward, X } from 'lucide-react'
import { NumericKeypad } from './numeric-keypad'
import { SiteIllustration } from '@/components/ultrassom'
import { USG_SITES } from '@/lib/usg/protocols'
import { USG_REP_TOLERANCE_MM, USG_DELTA_WARN_RATIO } from '@/lib/usg/config'
import { formatarMm } from '@/lib/usg/series'
import type { UsgSiteCode, UsgTecido } from '@/lib/usg/types'
import { cn } from '@/lib/utils'

export const MAX_REPETICOES_UI = 3

interface SiteCaptureStepProps {
  site: UsgSiteCode
  tecido: UsgTecido
  passo: number
  total: number
  repeticoes: number[]
  /** Valor do mesmo sítio na avaliação anterior, para servir de referência. */
  valorAnterior: number | null
  rotuloAvaliacaoAnterior: string | null
  onAddRepeticao: (valor: number) => void
  /** Registra a medida digitada E avança, mesmo que ela seja a primeira. */
  onAddRepeticaoEAvancar: (valor: number) => void
  onRemoveRepeticao: (indice: number) => void
  onProximo: () => void
  onPular: () => void
  onAbrirInstrucoes: () => void
}

/** Converte o buffer de dígitos em milímetros: o último dígito é o decimal. */
export function bufferParaMm(buffer: string): number | null {
  if (buffer.length === 0) return null
  const valor = Number(buffer) / 10
  return Number.isFinite(valor) ? valor : null
}

export function SiteCaptureStep({
  site,
  tecido,
  passo,
  total,
  repeticoes,
  valorAnterior,
  rotuloAvaliacaoAnterior,
  onAddRepeticao,
  onAddRepeticaoEAvancar,
  onRemoveRepeticao,
  onProximo,
  onPular,
  onAbrirInstrucoes,
}: SiteCaptureStepProps) {
  const [buffer, setBuffer] = useState('')
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const definicao = USG_SITES[site]

  // Ao trocar de sítio, zera o que estava digitado e leva o foco para o
  // título — sem isso o leitor de tela continuaria anunciando o passo anterior.
  useEffect(() => {
    setBuffer('')
    tituloRef.current?.focus()
  }, [site, tecido])

  const valorDigitado = bufferParaMm(buffer)
  const [minFaixa, maxFaixa] = definicao.faixaPlausivelMm

  const amplitude =
    repeticoes.length > 1 ? Math.max(...repeticoes) - Math.min(...repeticoes) : 0
  const repeticoesDivergem = amplitude > USG_REP_TOLERANCE_MM

  const valorConsolidado = mediana(repeticoes)
  const variouMuito =
    valorConsolidado !== null &&
    valorAnterior !== null &&
    valorAnterior > 0 &&
    Math.abs(valorConsolidado - valorAnterior) / valorAnterior > USG_DELTA_WARN_RATIO

  const foraDaFaixa =
    valorDigitado !== null && (valorDigitado < minFaixa || valorDigitado > maxFaixa)

  const confirmar = () => {
    if (valorDigitado === null || valorDigitado <= 0) return
    if (repeticoes.length >= MAX_REPETICOES_UI) return
    onAddRepeticao(valorDigitado)
    setBuffer('')
  }

  // "Próximo" com algo digitado e não confirmado registra o valor em vez de
  // descartá-lo em silêncio — perder uma medida já feita no paciente é pior do
  // que qualquer economia de toque.
  const seguir = () => {
    if (valorDigitado !== null && valorDigitado > 0 && repeticoes.length < MAX_REPETICOES_UI) {
      onAddRepeticaoEAvancar(valorDigitado)
      setBuffer('')
      return
    }
    onProximo()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Ponto anatômico */}
        <div className="flex items-start gap-3 py-3">
          <SiteIllustration site={site} size={64} />
          <div className="flex-1 min-w-0">
            <h2
              ref={tituloRef}
              tabIndex={-1}
              className="font-heading text-title-sm text-foreground focus:outline-none"
            >
              {definicao.label}
            </h2>
            <p className="text-label-sm text-foreground-secondary">
              {definicao.instrucaoCurta}
            </p>
            <button
              type="button"
              onClick={onAbrirInstrucoes}
              className="mt-1 inline-flex items-center gap-1 text-label-sm text-dourado-texto hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado rounded"
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
              Como medir
            </button>
          </div>
        </div>

        {/* Rótulo do tecido + referência anterior */}
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-label text-foreground-muted uppercase tracking-wide">
            {tecido === 'gordura' ? 'Gordura (mm)' : 'Músculo (mm)'}
          </span>
          {valorAnterior !== null && (
            <span className="text-label-sm text-foreground-muted">
              {rotuloAvaliacaoAnterior ?? 'Anterior'}: {formatarMm(valorAnterior)} mm
            </span>
          )}
        </div>

        {/* Leitura grande */}
        <div
          className={cn(
            'mt-1 h-24 rounded-xl border flex items-center justify-center',
            foraDaFaixa ? 'border-vinho/40 bg-vinho/5' : 'border-border bg-background-input'
          )}
        >
          <output
            aria-label={
              valorDigitado === null
                ? 'Nenhum valor digitado'
                : `${formatarMm(valorDigitado)} milímetros`
            }
            className="font-heading text-[3.5rem] leading-none text-foreground tabular-nums"
          >
            {valorDigitado === null ? '—' : formatarMm(valorDigitado)}
          </output>
        </div>

        {/* Repetições registradas */}
        <div className="flex flex-wrap gap-2 mt-3">
          {repeticoes.map((valor, indice) => (
            <span
              key={`${indice}-${valor}`}
              className="inline-flex items-center gap-1.5 h-12 px-3 rounded-lg bg-dourado/10 border border-dourado/30 text-foreground"
            >
              <span className="text-label-sm text-foreground-muted">
                {indice + 1}ª
              </span>
              <span className="font-medium tabular-nums">{formatarMm(valor)}</span>
              <button
                type="button"
                onClick={() => onRemoveRepeticao(indice)}
                aria-label={`Remover a ${indice + 1}ª medida de ${definicao.label}`}
                className="w-11 h-11 -mr-2 flex items-center justify-center rounded text-foreground-muted hover:text-vinho focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </span>
          ))}
          {repeticoes.length < MAX_REPETICOES_UI ? (
            <span className="inline-flex items-center h-12 px-3 rounded-lg border border-dashed border-border text-label-sm text-foreground-muted">
              {repeticoes.length + 1}ª medida
            </span>
          ) : (
            <span className="inline-flex items-center h-12 px-3 text-label-sm text-foreground-muted">
              Limite de {MAX_REPETICOES_UI} medidas — remova uma para registrar
              outra.
            </span>
          )}
        </div>

        {/* O readout muda a cada dígito; o que importa anunciar é a medida
            REGISTRADA e o ponto em que estamos. */}
        <p className="sr-only" aria-live="polite">
          {`Ponto ${passo} de ${total}: ${definicao.label}. ${
            repeticoes.length === 0
              ? 'nenhuma medida registrada'
              : `${repeticoes.length} medida${repeticoes.length > 1 ? 's' : ''} registrada${repeticoes.length > 1 ? 's' : ''}`
          }`}
        </p>

        {/* Avisos — nunca bloqueiam, sempre dispensáveis pelo simples "seguir" */}
        <div className="mt-3 space-y-2" aria-live="polite">
          {foraDaFaixa && (
            <Aviso>
              {formatarMm(valorDigitado)} mm está fora do esperado para{' '}
              {definicao.label} ({minFaixa}–{maxFaixa} mm). Confira a pressão do
              transdutor antes de confirmar.
            </Aviso>
          )}
          {repeticoesDivergem && (
            <Aviso>
              As medidas variaram {formatarMm(amplitude)} mm entre si. Vale uma
              terceira — o app usa a mediana.
            </Aviso>
          )}
          {variouMuito && (
            <Aviso>
              Variação grande em relação à avaliação anterior (
              {formatarMm(valorAnterior)} mm). Confirme se o ponto é o mesmo.
            </Aviso>
          )}
        </div>
      </div>

      {/* Zona do polegar */}
      <div className="px-4 pb-2 pt-2 border-t border-border bg-background-card safe-bottom">
        <NumericKeypad
          onDigit={(digito) =>
            setBuffer((atual) => (atual.length >= 4 ? atual : atual + digito))
          }
          onBackspace={() => setBuffer((atual) => atual.slice(0, -1))}
          onConfirm={confirmar}
          confirmDisabled={
            valorDigitado === null || repeticoes.length >= MAX_REPETICOES_UI
          }
        />

        <div className="flex gap-2 mt-2 pb-2">
          <button
            type="button"
            onClick={onPular}
            className="h-14 px-4 rounded-xl border border-border text-foreground-secondary inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
          >
            <SkipForward className="w-4 h-4" aria-hidden="true" />
            Pular
          </button>
          <button
            type="button"
            onClick={seguir}
            disabled={repeticoes.length === 0 && valorDigitado === null}
            className="flex-1 h-14 rounded-xl btn-gradient text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
          >
            {passo >= total ? 'Revisar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 rounded-lg border border-[#d4850f]/40 bg-[#d4850f]/5">
      <AlertTriangle
        className="w-4 h-4 text-[#d4850f] shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-label-sm text-foreground-secondary">{children}</p>
    </div>
  )
}

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1] + ordenados[meio]) / 2
    : ordenados[meio]
}
