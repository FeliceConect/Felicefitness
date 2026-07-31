'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Minus,
  Trash2,
} from 'lucide-react'
import { LineChart } from '@/components/charts'
import { AcsmScale, BodyMap } from '@/components/ultrassom'
import type { BodyMapPonto } from '@/components/ultrassom'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { DraftRestoreBanner } from '@/components/ui/draft-restore-banner'
import {
  buildSomaSeries,
  compararSitios,
  encontrarAnteriorComparavel,
  formatarDelta,
  formatarMm,
  resumoComparativo,
} from '@/lib/usg/series'
import { getProtocol } from '@/lib/usg/protocols'
import type { UsgAssessmentWithSites, UsgSexo, UsgWarning } from '@/lib/usg/types'
import { cn } from '@/lib/utils'

interface AssessmentResultProps {
  patientId: string
  avaliacao: UsgAssessmentWithSites
  /** Histórico completo, da mais recente para a mais antiga. */
  historico: UsgAssessmentWithSites[]
  onAtualizada: (avaliacao: UsgAssessmentWithSites) => void
  onRemovida: () => void
}

const COR_DOURADO = '#c29863'

export function AssessmentResult({
  patientId,
  avaliacao,
  historico,
  onAtualizada,
  onRemovida,
}: AssessmentResultProps) {
  const [interpretacao, setInterpretacao] = useState(avaliacao.interpretacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  const { status, lastSavedAt, pendingDraft, clearDraft, dismissPending } =
    useDraftAutosave<string>(
      `ultrassom-interpretacao:${avaliacao.id}`,
      interpretacao,
      { isEmpty: (v) => v.trim().length === 0 }
    )

  // Só compara com avaliação do MESMO protocolo: somar 7 sítios contra 3
  // apareceria na tela como uma melhora enorme que é só troca de protocolo.
  const anterior = useMemo(
    () => encontrarAnteriorComparavel(historico, avaliacao),
    [historico, avaliacao]
  )

  const resumo = useMemo(
    () => resumoComparativo(avaliacao, anterior),
    [avaliacao, anterior]
  )
  const deltas = useMemo(() => compararSitios(avaliacao, anterior), [avaliacao, anterior])

  const serieSoma = useMemo(
    () =>
      buildSomaSeries(historico, avaliacao.protocolo).map((p) => ({
        date: p.data,
        value: p.valor,
      })),
    [historico, avaliacao.protocolo]
  )

  const pontosMapa: BodyMapPonto[] = useMemo(
    () =>
      deltas.map((d) => ({
        site: d.site,
        valor: d.atual,
        delta: d.delta,
        favoravel: d.favoravel,
      })),
    [deltas]
  )

  const avisos: UsgWarning[] = Array.isArray(avaliacao.calculo_avisos)
    ? avaliacao.calculo_avisos
    : []

  const salvarInterpretacao = async () => {
    setSalvando(true)
    try {
      const resposta = await fetch(
        `/api/professional/clients/${patientId}/ultrassom/${avaliacao.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interpretacao }),
        }
      )
      const dados = await resposta.json().catch(() => null)
      if (!resposta.ok || !dados?.success) {
        toast.error(dados?.error ?? 'Não foi possível salvar')
        return
      }
      clearDraft()
      onAtualizada(dados.assessment)
      toast.success('Interpretação salva — o paciente já consegue ler')
    } catch {
      toast.error('Falha de conexão ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const remover = async () => {
    if (
      !window.confirm(
        'Remover esta avaliação? As medidas em milímetros serão apagadas e não há como recuperá-las.'
      )
    ) {
      return
    }
    setRemovendo(true)
    try {
      const resposta = await fetch(
        `/api/professional/clients/${patientId}/ultrassom/${avaliacao.id}`,
        { method: 'DELETE' }
      )
      const dados = await resposta.json().catch(() => null)
      if (!resposta.ok || !dados?.success) {
        toast.error(dados?.error ?? 'Não foi possível remover')
        return
      }
      toast.success('Avaliação removida')
      onRemovida()
    } catch {
      toast.error('Falha de conexão')
    } finally {
      setRemovendo(false)
    }
  }

  const sexo = (avaliacao.sexo ?? 'feminino') as UsgSexo

  return (
    <div className="space-y-4">
      {/* Números principais */}
      <section className="grid grid-cols-2 gap-3">
        {resumo.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-xl border p-3',
              item.id === 'soma'
                ? 'border-dourado/40 bg-dourado/5 col-span-2'
                : 'border-border bg-background-card'
            )}
          >
            <p className="text-label text-foreground-muted uppercase tracking-wide">
              {item.label}
            </p>
            <p className="font-heading text-title-md text-foreground tabular-nums mt-0.5">
              {item.atual === null
                ? '—'
                : `${formatarMm(item.atual, item.decimais)}${item.unidade === '%' ? '' : ' '}${item.unidade}`}
            </p>
            {item.delta !== null && (
              <p
                className={cn(
                  'inline-flex items-center gap-1 text-label-sm mt-0.5 tabular-nums',
                  item.favoravel === true && 'text-[#7dad6a]',
                  item.favoravel === false && 'text-vinho',
                  item.favoravel === null && 'text-foreground-muted'
                )}
              >
                {item.delta < 0 ? (
                  <ArrowDown className="w-3 h-3" aria-hidden="true" />
                ) : item.delta > 0 ? (
                  <ArrowUp className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Minus className="w-3 h-3" aria-hidden="true" />
                )}
                {formatarDelta(item.delta, item.decimais)} {item.unidade} vs.{' '}
                {anterior?.momento_avaliacao ?? 'anterior'}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Rótulo do método — nunca aparece um percentual sem ele */}
      <p className="text-label-sm text-foreground-muted">
        Percentual e massas são <strong>estimativa</strong> por{' '}
        {getProtocol(avaliacao.protocolo).label} com fórmula de{' '}
        {avaliacao.formula_percentual === 'siri' ? 'Siri' : 'Brozek'}. A medida
        direta e mais confiável é a soma em milímetros.
      </p>

      {/* Avisos do cálculo */}
      {avisos.length > 0 && (
        <section className="rounded-xl border border-[#d4850f]/40 bg-[#d4850f]/5 p-3">
          <h2 className="flex items-center gap-2 text-label text-foreground uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-[#d4850f]" aria-hidden="true" />
            Pontos de atenção
          </h2>
          <ul className="mt-2 space-y-1.5">
            {avisos.map((aviso, i) => (
              <li
                key={`${aviso.code}-${aviso.site ?? i}`}
                className="text-label-sm text-foreground-secondary"
              >
                {aviso.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Classificação */}
      {avaliacao.percentual_gordura !== null && (
        <section className="rounded-xl border border-border bg-background-card p-4">
          <AcsmScale percentual={Number(avaliacao.percentual_gordura)} sexo={sexo} />
        </section>
      )}

      {/* Mapa corporal */}
      <section className="rounded-xl border border-border bg-background-card p-4">
        <h2 className="text-label text-foreground-muted uppercase tracking-wide mb-3">
          Espessura por ponto
        </h2>
        <BodyMap pontos={pontosMapa} variante="pro" />
      </section>

      {/* Delta por sítio */}
      <section className="rounded-xl border border-border bg-background-card overflow-hidden">
        <h2 className="text-label text-foreground-muted uppercase tracking-wide p-3 pb-2">
          Comparação ponto a ponto
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-label-sm text-foreground-muted border-b border-border">
                <th className="text-left font-normal px-3 py-2">Ponto</th>
                <th className="text-right font-normal px-3 py-2">Anterior</th>
                <th className="text-right font-normal px-3 py-2">Atual</th>
                <th className="text-right font-normal px-3 py-2">Variação</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((d) => (
                <tr key={`${d.site}-${d.tecido}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-foreground">
                    {d.label}
                    {d.tecido === 'musculo' && (
                      <span className="text-label-sm text-foreground-muted"> (músculo)</span>
                    )}
                    {d.foraDeTolerancia && (
                      <AlertTriangle
                        className="inline w-3.5 h-3.5 text-[#d4850f] ml-1"
                        aria-label="Medidas divergentes entre repetições"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground-muted tabular-nums">
                    {formatarMm(d.anterior)}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground tabular-nums">
                    {formatarMm(d.atual)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right tabular-nums',
                      d.favoravel === true && 'text-[#7dad6a]',
                      d.favoravel === false && 'text-vinho',
                      d.favoravel === null && 'text-foreground-muted'
                    )}
                  >
                    {formatarDelta(d.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Evolução da soma */}
      {serieSoma.length > 1 && (
        <section className="rounded-xl border border-border bg-background-card p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-label text-foreground-muted uppercase tracking-wide">
              Evolução da soma (mm)
            </h2>
            <span className="text-label-sm px-2 py-0.5 rounded-full bg-dourado/10 text-dourado-texto">
              Ultrassom
            </span>
          </div>
          <LineChart
            data={serieSoma}
            color={COR_DOURADO}
            height={180}
            valueFormatter={(v) => `${formatarMm(v)} mm`}
          />
          <p className="text-label-sm text-foreground-muted mt-2">
            Só avaliações por ultrassom no protocolo{' '}
            {getProtocol(avaliacao.protocolo).label}. Bioimpedância e outros
            protocolos não entram nesta série — não são intercambiáveis.
          </p>
        </section>
      )}

      {/* Interpretação */}
      <section className="rounded-xl border border-border bg-background-card p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-label text-foreground-muted uppercase tracking-wide">
            Interpretação e conduta
          </h2>
          <DraftStatus status={status} lastSavedAt={lastSavedAt} />
        </div>
        <p className="text-label-sm text-foreground-muted mb-2">
          O paciente lê este texto junto do resultado.
        </p>

        {/* Sem este banner, o indicador de "rascunho guardado" seria mentira:
            o texto ia para o localStorage e ninguém o lia de volta. */}
        {pendingDraft && pendingDraft.value !== interpretacao && (
          <DraftRestoreBanner
            savedAt={pendingDraft.savedAt}
            label="Interpretação escrita e não salva"
            onRestore={() => {
              setInterpretacao(pendingDraft.value)
              dismissPending()
            }}
            onDiscard={() => {
              clearDraft()
              dismissPending()
            }}
          />
        )}
        <textarea
          value={interpretacao}
          onChange={(e) => setInterpretacao(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="O que estes números significam para o paciente e qual a conduta."
          className="input-default w-full resize-y"
        />
        <button
          type="button"
          onClick={salvarInterpretacao}
          disabled={salvando}
          className="mt-3 h-12 px-5 rounded-xl btn-gradient text-white font-medium inline-flex items-center gap-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
        >
          {salvando && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Salvar interpretação
        </button>
      </section>

      <button
        type="button"
        onClick={remover}
        disabled={removendo}
        className="inline-flex items-center gap-2 text-label-sm text-vinho hover:underline disabled:opacity-40"
      >
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        Remover avaliação
      </button>
    </div>
  )
}

function DraftStatus({
  status,
  lastSavedAt,
}: {
  status: string
  lastSavedAt: number | null
}) {
  if (status !== 'saved' || !lastSavedAt) return null
  return (
    <span className="text-label-sm text-foreground-muted">rascunho local guardado</span>
  )
}
