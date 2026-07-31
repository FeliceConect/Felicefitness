'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, Plus, Waves } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart } from '@/components/charts'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { getProtocol } from '@/lib/usg/protocols'
import {
  buildSomaSeries,
  encontrarAnteriorComparavel,
  formatarDelta,
  formatarMm,
} from '@/lib/usg/series'
import type { UsgAssessmentWithSites } from '@/lib/usg/types'

interface TabUltrassomProps {
  patientId: string
  canEdit: boolean
  /**
   * De onde a aba está sendo aberta. O wizard e o resultado vivem no portal,
   * então sem isto quem entra pelo painel admin não tem como voltar.
   */
  origem?: 'portal' | 'admin'
}

const COR_DOURADO = '#c29863'

export function TabUltrassom({
  patientId,
  canEdit,
  origem = 'portal',
}: TabUltrassomProps) {
  const sufixoOrigem = origem === 'admin' ? '?origem=admin' : ''
  const [avaliacoes, setAvaliacoes] = useState<UsgAssessmentWithSites[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro(false)
    fetch(`/api/professional/clients/${patientId}/ultrassom?limit=30`)
      .then((r) => r.json())
      .then((dados) => {
        if (dados?.success) setAvaliacoes(dados.assessments ?? [])
        else setErro(true)
      })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [patientId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const ultima = avaliacoes[0] ?? null

  // Comparação e gráfico ficam presos ao protocolo da última avaliação:
  // misturar JP7 com JP3 mostraria uma queda de dezenas de milímetros que é só
  // troca de protocolo.
  const anterior = ultima ? encontrarAnteriorComparavel(avaliacoes, ultima) : null

  const serie = ultima
    ? buildSomaSeries(avaliacoes, ultima.protocolo).map((p) => ({
        date: p.data,
        value: p.valor,
      }))
    : []

  const deltaSoma =
    ultima?.soma_gordura_mm != null && anterior?.soma_gordura_mm != null
      ? Number(ultima.soma_gordura_mm) - Number(anterior.soma_gordura_mm)
      : null

  if (carregando) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-dourado" aria-label="Carregando" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-title-sm text-foreground">
            Avaliação por ultrassom
          </h2>
          <p className="text-label-sm text-foreground-muted">
            Espessura de gordura e músculo em milímetros
          </p>
        </div>
        {canEdit && (
          <Link
            href={`/portal/clients/${patientId}/ultrassom/nova${sufixoOrigem}`}
            className="h-12 px-4 rounded-xl btn-gradient text-white font-medium inline-flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nova
          </Link>
        )}
      </div>

      {erro ? (
        // Sem isto, uma falha de rede diria "nenhuma avaliação" — e a
        // nutricionista poderia refazer uma coleta que já existe.
        <ErrorState
          title="Não consegui carregar as avaliações"
          description="Pode ser a conexão. Tente de novo antes de concluir que o paciente não tem avaliação."
          onRetry={carregar}
        />
      ) : avaliacoes.length === 0 ? (
        <EmptyState
          icon="🩻"
          title="Nenhuma avaliação por ultrassom"
          description={
            canEdit
              ? 'Meça os pontos no Butterfly e lance aqui. A soma em milímetros é a métrica mais estável que temos para acompanhar evolução.'
              : 'Este paciente ainda não tem avaliação por ultrassom registrada.'
          }
        />
      ) : (
        <>
          {/* Resumo da última */}
          {ultima && (
            <Link
              href={`/portal/clients/${patientId}/ultrassom/${ultima.id}${sufixoOrigem}`}
              className="block rounded-xl border border-dourado/40 bg-dourado/5 p-4 hover:border-dourado transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label text-foreground-muted uppercase tracking-wide">
                    Última · {format(parseISO(ultima.data), 'dd/MM/yyyy')}
                    {ultima.momento_avaliacao ? ` · ${ultima.momento_avaliacao}` : ''}
                  </p>
                  <p className="font-heading text-title-md text-foreground tabular-nums mt-1">
                    {ultima.soma_gordura_mm === null
                      ? '—'
                      : `${formatarMm(ultima.soma_gordura_mm)} mm`}
                    {deltaSoma !== null && (
                      <span
                        className={
                          deltaSoma < 0
                            ? 'text-[#7dad6a] text-body-lg ml-2'
                            : 'text-vinho text-body-lg ml-2'
                        }
                      >
                        {formatarDelta(deltaSoma)}
                      </span>
                    )}
                  </p>
                  <p className="text-label-sm text-foreground-secondary">
                    soma das espessuras ·{' '}
                    {ultima.percentual_gordura === null
                      ? 'percentual não estimado'
                      : `${formatarMm(ultima.percentual_gordura)}% de gordura (estimativa)`}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-foreground-muted shrink-0"
                  aria-hidden="true"
                />
              </div>
            </Link>
          )}

          {/* Histórico em outro protocolo não entra no gráfico — dizer isso
              evita a nutricionista achar que os dados sumiram. */}
          {serie.length <= 1 && avaliacoes.length > 1 && (
            <p className="text-label-sm text-foreground-muted px-1">
              Há avaliações anteriores em outro protocolo. Elas não entram neste
              gráfico porque as somas não são comparáveis entre protocolos.
            </p>
          )}

          {/* Evolução */}
          {serie.length > 1 && (
            <div className="rounded-xl border border-border bg-background-card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-label text-foreground-muted uppercase tracking-wide">
                  Evolução da soma (mm) · {getProtocol(ultima!.protocolo).label}
                </h3>
                <span className="text-label-sm px-2 py-0.5 rounded-full bg-dourado/10 text-dourado-texto">
                  Ultrassom
                </span>
              </div>
              <LineChart
                data={serie}
                color={COR_DOURADO}
                height={160}
                valueFormatter={(v) => `${formatarMm(v)} mm`}
              />
            </div>
          )}

          {/* Histórico */}
          <div className="rounded-xl border border-border bg-background-card overflow-hidden">
            <h3 className="text-label text-foreground-muted uppercase tracking-wide p-3 pb-2">
              Histórico
            </h3>
            {avaliacoes.map((avaliacao) => (
              <Link
                key={avaliacao.id}
                href={`/portal/clients/${patientId}/ultrassom/${avaliacao.id}${sufixoOrigem}`}
                className="flex items-center gap-3 p-3 border-t border-border hover:bg-background-elevated min-h-[56px]"
              >
                <Waves className="w-4 h-4 text-dourado shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-foreground">
                    {format(parseISO(avaliacao.data), "d 'de' MMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                    {avaliacao.momento_avaliacao
                      ? ` · ${avaliacao.momento_avaliacao}`
                      : ''}
                  </span>
                  <span className="block text-label-sm text-foreground-muted truncate">
                    {getProtocol(avaliacao.protocolo).label}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-foreground tabular-nums">
                    {avaliacao.soma_gordura_mm === null
                      ? '—'
                      : `${formatarMm(avaliacao.soma_gordura_mm)} mm`}
                  </span>
                  <span className="block text-label-sm text-foreground-muted tabular-nums">
                    {avaliacao.percentual_gordura === null
                      ? '—'
                      : `${formatarMm(avaliacao.percentual_gordura)}%`}
                  </span>
                </span>
                <ChevronRight
                  className="w-4 h-4 text-foreground-muted shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
