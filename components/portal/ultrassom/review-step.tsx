'use client'

import { useMemo } from 'react'
import { AlertTriangle, Loader2, Pencil } from 'lucide-react'
import type { WizardState } from './collection-wizard'
import { USG_SITES, getProtocol } from '@/lib/usg/protocols'
import { computeUsgAssessment } from '@/lib/usg/engine'
import { formatarMm } from '@/lib/usg/series'
import { encontrarMedida } from '@/lib/usg/series'
import type {
  UsgAssessmentWithSites,
  UsgSexo,
  UsgSiteCode,
  UsgTecido,
} from '@/lib/usg/types'

interface ReviewStepProps {
  estado: WizardState
  sitios: readonly UsgSiteCode[]
  medianaPorSitio: (site: UsgSiteCode, tecido: UsgTecido) => number | null
  anterior: UsgAssessmentWithSites | null
  salvando: boolean
  onEditarSitio: (indice: number) => void
  onSalvar: () => void
  onEditarDados: () => void
}

/**
 * Revisão antes de salvar.
 *
 * O resultado exibido aqui vem do MESMO motor puro que o servidor usa para
 * gravar — não existe rota de preview e não existe segunda implementação do
 * cálculo que possa divergir.
 */
export function ReviewStep({
  estado,
  sitios,
  medianaPorSitio,
  anterior,
  salvando,
  onEditarSitio,
  onSalvar,
  onEditarDados,
}: ReviewStepProps) {
  const protocolo = getProtocol(estado.protocolo)

  const previa = useMemo(() => {
    const medidas = Object.entries(estado.medidas)
      .filter(([, reps]) => reps.length > 0)
      .map(([k, reps]) => {
        const [site, tecido] = k.split('|')
        return {
          site: site as UsgSiteCode,
          tecido: tecido as UsgTecido,
          lado: 'D' as const,
          repeticoes_mm: reps,
        }
      })

    if (medidas.length === 0) return null

    return computeUsgAssessment({
      protocolo: estado.protocolo,
      sexo: (estado.sexo || 'feminino') as UsgSexo,
      idade: estado.idade ? Number(estado.idade) : 0,
      peso_kg: estado.peso ? Number(estado.peso.replace(',', '.')) : null,
      altura_cm: null,
      medidas,
    })
  }, [estado])

  const medidos = sitios.filter(
    (site) => medianaPorSitio(site, USG_SITES[site].tecido) !== null
  ).length

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      <h2 className="font-heading text-title-sm text-foreground">
        Confira antes de salvar
      </h2>
      <p className="text-label-sm text-foreground-muted mt-0.5">
        {protocolo.label} · {medidos} de {sitios.length} pontos medidos
      </p>

      <button
        type="button"
        onClick={onEditarDados}
        className="mt-3 h-12 px-4 rounded-xl border border-border text-foreground-secondary inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
        Editar data, peso e momento
      </button>

      {/* Tabela de sítios */}
      <div className="mt-4 rounded-xl border border-border bg-background-card overflow-hidden">
        {sitios.map((site, indice) => {
          const definicao = USG_SITES[site]
          const valor = medianaPorSitio(site, definicao.tecido)
          const reps = estado.medidas[`${site}|${definicao.tecido}`] ?? []
          const amplitude =
            reps.length > 1 ? Math.max(...reps) - Math.min(...reps) : 0

          const medidaAnterior = anterior
            ? encontrarMedida(anterior.medidas, site, definicao.tecido)
            : null
          const delta =
            valor !== null && medidaAnterior
              ? valor - Number(medidaAnterior.valor_mm)
              : null

          return (
            <button
              key={site}
              type="button"
              onClick={() => onEditarSitio(indice)}
              className="w-full flex items-center gap-3 p-3 text-left border-b border-border last:border-b-0 hover:bg-background-elevated min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-inset"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-foreground truncate">
                  {definicao.label}
                </span>
                <span className="block text-label-sm text-foreground-muted">
                  {reps.length === 0
                    ? 'não medido'
                    : `${reps.length} medida${reps.length > 1 ? 's' : ''}: ${reps
                        .map((r) => formatarMm(r))
                        .join(' · ')}`}
                </span>
              </span>

              {amplitude > 1.5 && (
                <AlertTriangle
                  className="w-4 h-4 text-[#d4850f] shrink-0"
                  aria-label="Medidas divergentes"
                />
              )}

              <span className="text-right shrink-0">
                <span className="block font-medium text-foreground tabular-nums">
                  {valor === null ? '—' : `${formatarMm(valor)} mm`}
                </span>
                {delta !== null && (
                  <span className="block text-label-sm text-foreground-muted tabular-nums">
                    {delta > 0 ? '+' : ''}
                    {formatarMm(delta)}
                  </span>
                )}
              </span>

              <Pencil
                className="w-4 h-4 text-foreground-muted shrink-0"
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>

      {/* Resultado prévio */}
      {previa && (
        <div className="mt-4 rounded-xl border border-dourado/30 bg-dourado/5 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-label text-foreground-muted uppercase tracking-wide">
              Soma das espessuras
            </span>
            <span className="font-heading text-title-md text-foreground tabular-nums">
              {previa.soma_gordura_mm === null
                ? '—'
                : `${formatarMm(previa.soma_gordura_mm)} mm`}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-dourado/20">
            <span className="text-label text-foreground-muted uppercase tracking-wide">
              Gordura estimada
            </span>
            <span className="font-heading text-title-sm text-foreground tabular-nums">
              {previa.percentual_gordura === null
                ? '—'
                : `${formatarMm(previa.percentual_gordura)}%`}
            </span>
          </div>
          <p className="text-label-sm text-foreground-muted mt-1">
            Estimativa por {rotuloEquacao(previa.equacao_densidade)} ·{' '}
            {previa.formula_percentual === 'siri' ? 'Siri' : 'Brozek'}
          </p>

          {previa.avisos.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {previa.avisos.map((aviso, i) => (
                <li
                  key={`${aviso.code}-${aviso.site ?? i}`}
                  className="flex gap-2 text-label-sm text-foreground-secondary"
                >
                  <AlertTriangle
                    className="w-3.5 h-3.5 text-[#d4850f] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  {aviso.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 p-4 bg-background-card border-t border-border safe-bottom">
        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando || medidos === 0}
          className="w-full h-14 rounded-xl btn-gradient text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
        >
          {salvando && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {salvando ? 'Salvando…' : 'Salvar avaliação'}
        </button>
      </div>
    </div>
  )
}

function rotuloEquacao(id: string | null): string {
  if (!id) return 'protocolo sem equação'
  if (id.startsWith('jp7')) return 'Jackson & Pollock 7 sítios'
  if (id.startsWith('jp3')) return 'Jackson & Pollock 3 sítios'
  return id
}
