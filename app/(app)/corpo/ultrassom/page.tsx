'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Info, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart } from '@/components/charts'
import { ErrorState } from '@/components/ui/states'
import { BodyMap } from '@/components/ultrassom'
import type { BodyMapPonto } from '@/components/ultrassom'
import { useUltrasoundAssessments } from '@/hooks/use-ultrasound-assessments'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { USG_SITES } from '@/lib/usg/protocols'
import {
  buildSomaSeries,
  compararSitios,
  formatarDelta,
  formatarMm,
} from '@/lib/usg/series'
import type { UsgSiteCode } from '@/lib/usg/types'

const COR_DOURADO = '#c29863'

export default function UltrassomPacientePage() {
  const { avaliacoes, ultima, anterior, isLoading, error, refresh } =
    useUltrasoundAssessments()
  const prefereMenosMovimento = useReducedMotion()
  const [sitioAberto, setSitioAberto] = useState<UsgSiteCode | null>(null)
  const [explicacaoAberta, setExplicacaoAberta] = useState(false)

  const deltas = useMemo(
    () => (ultima ? compararSitios(ultima, anterior) : []),
    [ultima, anterior]
  )

  const pontos: BodyMapPonto[] = useMemo(
    () =>
      deltas.map((d) => ({
        site: d.site,
        valor: d.atual,
        delta: d.delta,
        // Verde só reforça o que foi bem. Variação desfavorável fica neutra:
        // número de gordura em vermelho no app do paciente vira ansiedade,
        // não mudança de comportamento.
        favoravel: d.favoravel === true ? true : null,
      })),
    [deltas]
  )

  const serie = useMemo(
    () =>
      ultima
        ? buildSomaSeries(avaliacoes, ultima.protocolo).map((p) => ({
            date: p.data,
            value: p.valor,
          }))
        : [],
    [avaliacoes, ultima]
  )

  const deltaSoma =
    ultima?.soma_gordura_mm != null && anterior?.soma_gordura_mm != null
      ? Number(ultima.soma_gordura_mm) - Number(anterior.soma_gordura_mm)
      : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-12 space-y-4">
          <div className="h-8 w-2/3 rounded-lg bg-background-elevated animate-pulse" />
          <div className="h-32 rounded-2xl bg-background-elevated animate-pulse" />
          <div className="h-24 rounded-2xl bg-background-elevated animate-pulse" />
          <div className="h-48 rounded-2xl bg-background-elevated animate-pulse" />
        </div>
      </div>
    )
  }

  // Sem isto, uma falha de rede diria ao paciente que o exame não existe.
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-24 px-4 pt-12">
        <ErrorState
          title="Não consegui carregar sua avaliação"
          description="Pode ser a conexão. Tente de novo em instantes."
          onRetry={refresh}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-12 pb-4">
        <Link
          href="/corpo"
          className="inline-flex items-center gap-2 text-foreground-secondary mb-3"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Composição corporal
        </Link>
        <h1 className="font-heading text-2xl text-foreground">Avaliação por ultrassom</h1>
        <p className="text-foreground-secondary mt-1">
          Mede em milímetros a camada de gordura logo abaixo da pele. É mais estável
          que a balança e que a bioimpedância, porque não muda com o que você comeu
          ou bebeu no dia.
        </p>
      </header>

      {!ultima ? (
        <div className="px-4">
          <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
            <p className="text-foreground-secondary">
              Você ainda não tem uma avaliação por ultrassom. Ela é feita pela
              nutricionista durante a consulta.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Número principal: a soma em milímetros */}
          <motion.section
            initial={prefereMenosMovimento ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dourado/30 bg-gradient-to-br from-dourado/10 to-dourado/5 p-5"
          >
            <p className="text-label text-foreground-muted uppercase tracking-wide">
              Soma das espessuras ·{' '}
              {format(parseISO(ultima.data), "d 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="font-heading text-4xl text-foreground tabular-nums mt-1">
              {ultima.soma_gordura_mm === null
                ? '—'
                : `${formatarMm(ultima.soma_gordura_mm)} mm`}
            </p>
            {deltaSoma !== null && (
              <p className="text-body-lg text-foreground-secondary mt-1">
                {deltaSoma < 0 ? (
                  <>
                    <span className="text-[#7dad6a] font-medium">
                      {formatarDelta(deltaSoma)} mm
                    </span>{' '}
                    desde a avaliação anterior — é gordura subcutânea real
                    diminuindo.
                  </>
                ) : deltaSoma > 0 ? (
                  <>
                    {formatarDelta(deltaSoma)} mm desde a avaliação anterior.
                    Converse com a nutricionista sobre o que ajustar.
                  </>
                ) : (
                  'Estável desde a avaliação anterior.'
                )}
              </p>
            )}
          </motion.section>

          {/* Estimativas, em segundo plano e sempre rotuladas */}
          {ultima.percentual_gordura !== null && (
            <section className="rounded-2xl border border-border bg-background-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Gordura corporal</span>
                <button
                  type="button"
                  onClick={() => setExplicacaoAberta((v) => !v)}
                  className="inline-flex items-center gap-1 text-label-sm text-dourado-texto"
                  aria-expanded={explicacaoAberta}
                >
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  estimativa
                </button>
              </div>
              <p className="font-heading text-2xl text-foreground tabular-nums">
                {formatarMm(ultima.percentual_gordura)}%
              </p>

              {explicacaoAberta && (
                <p className="mt-2 text-label-sm text-foreground-secondary bg-background-elevated rounded-lg p-3">
                  Este percentual é <strong>calculado</strong> a partir das medidas em
                  milímetros por uma fórmula, não medido diretamente. Ele serve para
                  dar contexto, mas o número que acompanha sua evolução com mais
                  precisão é a soma em milímetros acima.
                </p>
              )}

              {(ultima.massa_gorda_kg !== null || ultima.massa_magra_kg !== null) && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-label-sm text-foreground-muted">Massa gorda</p>
                    <p className="text-foreground tabular-nums">
                      {ultima.massa_gorda_kg === null
                        ? '—'
                        : `${formatarMm(ultima.massa_gorda_kg, 2)} kg`}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-foreground-muted">Massa magra</p>
                    <p className="text-foreground tabular-nums">
                      {ultima.massa_magra_kg === null
                        ? '—'
                        : `${formatarMm(ultima.massa_magra_kg, 2)} kg`}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Mapa do corpo */}
          <section className="rounded-2xl border border-border bg-background-card p-4">
            <h2 className="text-foreground font-medium mb-1">Onde foi medido</h2>
            <p className="text-label-sm text-foreground-muted mb-3">
              Toque em um ponto para ver a medida.
            </p>
            <BodyMap
              pontos={pontos}
              variante="paciente"
              onSiteTap={(site) => setSitioAberto(site)}
            />

            {sitioAberto && (
              <div className="mt-3 p-3 rounded-lg bg-background-elevated flex items-start justify-between gap-3">
                <div>
                  <p className="text-foreground font-medium">
                    {USG_SITES[sitioAberto].labelLeigo}
                  </p>
                  {(() => {
                    const d = deltas.find((x) => x.site === sitioAberto)
                    if (!d) return null
                    return (
                      <p className="text-label-sm text-foreground-secondary">
                        {formatarMm(d.atual)} mm
                        {d.delta !== null &&
                          ` · ${formatarDelta(d.delta)} mm desde a última`}
                      </p>
                    )
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setSitioAberto(null)}
                  aria-label="Fechar detalhe do ponto"
                  className="p-1 text-foreground-muted"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </section>

          {/* Histórico existe, mas em outro protocolo: sem esta nota o gráfico
              simplesmente sumiria e o paciente acharia que perdeu os dados. */}
          {serie.length <= 1 && avaliacoes.length > 1 && (
            <section className="rounded-2xl border border-border bg-background-card p-4">
              <p className="text-label-sm text-foreground-secondary">
                Você tem outras avaliações, mas feitas por um conjunto de pontos
                diferente deste. Elas não entram no mesmo gráfico porque não são
                comparáveis entre si — a nutricionista pode explicar na consulta.
              </p>
            </section>
          )}

          {/* Evolução — série exclusiva do ultrassom */}
          {serie.length > 1 && (
            <section className="rounded-2xl border border-border bg-background-card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-foreground font-medium">Sua evolução</h2>
                <span className="text-label-sm px-2 py-0.5 rounded-full bg-dourado/10 text-dourado-texto">
                  Ultrassom
                </span>
              </div>
              <LineChart
                data={serie}
                color={COR_DOURADO}
                height={180}
                valueFormatter={(v) => `${formatarMm(v)} mm`}
              />
              <p className="text-label-sm text-foreground-muted mt-2">
                Este gráfico mostra só as avaliações por ultrassom. Os dados da
                bioimpedância ficam em uma tela separada porque são medidos de outro
                jeito e não podem ser comparados diretamente.
              </p>
            </section>
          )}

          {/* Interpretação da nutricionista */}
          {ultima.interpretacao && (
            <section className="rounded-2xl border border-dourado/30 bg-dourado/5 p-4">
              <h2 className="text-label text-foreground-muted uppercase tracking-wide mb-2">
                O que a nutricionista escreveu
              </h2>
              <p className="text-foreground-secondary whitespace-pre-wrap">
                {ultima.interpretacao}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
