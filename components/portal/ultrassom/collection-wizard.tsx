'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useUnsavedWarning } from '@/hooks/use-unsaved-warning'
import { useScreenWakeLock } from '@/hooks/use-screen-wake-lock'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { DraftRestoreBanner } from '@/components/ui/draft-restore-banner'
import { DraftStatusIndicator } from '@/components/ui/draft-status-indicator'
import { SetupStep } from './setup-step'
import { SiteCaptureStep, MAX_REPETICOES_UI, mediana } from './site-capture-step'
import { ReviewStep } from './review-step'
import { ProtocolSheet } from './protocol-sheet'
import { collectionOrder, USG_SITES } from '@/lib/usg/protocols'
import { USG_REP_TOLERANCE_MM } from '@/lib/usg/config'
import { encontrarMedida } from '@/lib/usg/series'
import { getTodayDateSP } from '@/lib/utils/date'
import type {
  UsgAssessmentWithSites,
  UsgProtocolCode,
  UsgSexo,
  UsgSiteCode,
} from '@/lib/usg/types'

export interface WizardState {
  protocolo: UsgProtocolCode
  momento: string
  data: string
  peso: string
  sexo: UsgSexo | ''
  idade: string
  equipamento: string
  medirMusculo: boolean
  passo: number
  /** Chave `site|tecido` → repetições em mm, na ordem medida. */
  medidas: Record<string, number[]>
}

interface PacientePrefill {
  nome: string | null
  sexo: string | null
  idade: number | null
  altura_cm: number | null
  peso_kg: number | null
}

interface CollectionWizardProps {
  patientId: string
}

const chave = (site: UsgSiteCode, tecido: string) => `${site}|${tecido}`

function estadoInicial(): WizardState {
  return {
    protocolo: 'jp7',
    momento: '',
    data: getTodayDateSP(),
    peso: '',
    sexo: '',
    idade: '',
    equipamento: 'Butterfly iQ',
    medirMusculo: false,
    passo: 0,
    medidas: {},
  }
}

/**
 * Coleta de uma avaliação por ultrassom, ponto a ponto.
 *
 * Decisões que valem para o ambiente clínico:
 * - entre o setup e o salvar, NADA toca a rede. Queda de conexão no meio da
 *   coleta é irrelevante por construção;
 * - o estado inteiro (inclusive o passo atual) vai para o rascunho local a cada
 *   digitação, e o botão de salvar só limpa o rascunho depois do 200;
 * - a tela não apaga durante a coleta (wake lock), porque a nutricionista fica
 *   com as duas mãos ocupadas por minutos seguidos.
 */
export function CollectionWizard({ patientId }: CollectionWizardProps) {
  const router = useRouter()
  const prefereMenosMovimento = useReducedMotion()
  const wakeLock = useScreenWakeLock()

  const [estado, setEstado] = useState<WizardState>(estadoInicial)
  const [paciente, setPaciente] = useState<PacientePrefill | null>(null)
  const [anterior, setAnterior] = useState<UsgAssessmentWithSites | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sitioInstrucoes, setSitioInstrucoes] = useState<UsgSiteCode | null>(null)
  const [erroPrefill, setErroPrefill] = useState(false)
  // Quando a nutricionista entra num ponto a partir da revisão, terminar de
  // medir devolve para a revisão em vez de empurrar para o ponto seguinte.
  const [editandoDaRevisao, setEditandoDaRevisao] = useState(false)

  const vazio = useCallback(
    (v: WizardState) => Object.values(v.medidas).every((reps) => reps.length === 0),
    []
  )

  const { status, lastSavedAt, pendingDraft, clearDraft, dismissPending } =
    useDraftAutosave<WizardState>(`ultrassom:${patientId}:new`, estado, {
      enabled: true,
      isEmpty: vazio,
    })

  useUnsavedWarning(!vazio(estado) && !salvando)

  // Prefill e valores de referência.
  //
  // Tem timeout curto e nunca prende a coleta: no wi-fi de clínica a requisição
  // pode ficar pendurada, e ficar preso num spinner com o paciente na maca é
  // pior do que coletar sem os valores de referência.
  const carregarPrefill = useCallback(() => {
    setCarregando(true)
    setErroPrefill(false)

    const controlador = new AbortController()
    const timeout = setTimeout(() => controlador.abort(), 5000)

    fetch(`/api/professional/clients/${patientId}/ultrassom?limit=1`, {
      signal: controlador.signal,
    })
      .then((r) => r.json())
      .then((dados) => {
        if (!dados?.success) {
          setErroPrefill(true)
          return
        }
        const perfil: PacientePrefill | null = dados.paciente ?? null
        setPaciente(perfil)
        setAnterior(dados.assessments?.[0] ?? null)

        setEstado((atual) => {
          if (!vazio(atual)) return atual // não sobrescreve rascunho restaurado
          const sexo =
            perfil?.sexo === 'masculino' || perfil?.sexo === 'feminino'
              ? perfil.sexo
              : ''
          return {
            ...atual,
            sexo,
            idade: perfil?.idade != null ? String(perfil.idade) : '',
            peso: perfil?.peso_kg != null ? String(perfil.peso_kg) : '',
            protocolo: sexo === 'feminino' ? 'jp3_mulheres' : 'jp7',
          }
        })
      })
      .catch(() => {
        setErroPrefill(true)
      })
      .finally(() => {
        clearTimeout(timeout)
        setCarregando(false)
      })
  }, [patientId, vazio])

  useEffect(() => {
    carregarPrefill()
  }, [carregarPrefill])

  const sitios = useMemo(
    () => collectionOrder(estado.protocolo, estado.medirMusculo),
    [estado.protocolo, estado.medirMusculo]
  )

  const jaColetou = !vazio(estado)

  const iniciarColeta = () => {
    // Se já mediu, o setup foi aberto para corrigir peso/data/momento: volta
    // para a revisão em vez de recomeçar do primeiro ponto.
    if (jaColetou) {
      setEstado((a) => ({ ...a, passo: sitios.length + 1 }))
      return
    }

    // A tela não pode apagar no meio da coleta: as duas mãos ficam ocupadas
    // por minutos. O hook já trata o caso de o navegador não suportar.
    void wakeLock.request()
    setEstado((a) => ({ ...a, passo: 1 }))
  }

  const irPara = (passo: number) =>
    setEstado((a) => ({ ...a, passo: Math.max(0, Math.min(sitios.length + 1, passo)) }))

  const siteAtual = estado.passo >= 1 && estado.passo <= sitios.length
    ? sitios[estado.passo - 1]
    : null

  const tecidoAtual = siteAtual ? USG_SITES[siteAtual].tecido : 'gordura'
  const repeticoesAtuais = siteAtual ? estado.medidas[chave(siteAtual, tecidoAtual)] ?? [] : []

  const valorAnterior = useMemo(() => {
    if (!siteAtual || !anterior) return null
    const medida = encontrarMedida(anterior.medidas, siteAtual, tecidoAtual)
    return medida ? Number(medida.valor_mm) : null
  }, [siteAtual, tecidoAtual, anterior])

  const adicionarRepeticao = (valor: number, forcarAvanco = false) => {
    if (!siteAtual) return
    const k = chave(siteAtual, tecidoAtual)
    const voltandoParaRevisao = editandoDaRevisao

    setEstado((atual) => {
      const reps = [...(atual.medidas[k] ?? []), valor]
      const proximo = { ...atual, medidas: { ...atual.medidas, [k]: reps } }

      // Avanço automático: com duas medidas concordantes o trabalho naquele
      // ponto acabou. Discordando, fica no mesmo passo para a terceira.
      const amplitude = Math.max(...reps) - Math.min(...reps)
      const podeAvancar =
        forcarAvanco ||
        reps.length >= MAX_REPETICOES_UI ||
        (reps.length >= 2 && amplitude <= USG_REP_TOLERANCE_MM)

      if (podeAvancar) {
        proximo.passo = editandoDaRevisao
          ? sitios.length + 1
          : Math.min(sitios.length + 1, atual.passo + 1)
      }
      return proximo
    })

    if (voltandoParaRevisao) setEditandoDaRevisao(false)
  }

  const removerRepeticao = (indice: number) => {
    if (!siteAtual) return
    const k = chave(siteAtual, tecidoAtual)
    setEstado((atual) => ({
      ...atual,
      medidas: {
        ...atual.medidas,
        [k]: (atual.medidas[k] ?? []).filter((_, i) => i !== indice),
      },
    }))
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const medidas = Object.entries(estado.medidas)
        .filter(([, reps]) => reps.length > 0)
        .map(([k, reps]) => {
          const [site, tecido] = k.split('|')
          return { site, tecido, lado: 'D', repeticoes_mm: reps }
        })

      const resposta = await fetch(
        `/api/professional/clients/${patientId}/ultrassom`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocolo: estado.protocolo,
            data: estado.data,
            momento_avaliacao: estado.momento || null,
            peso_kg: estado.peso ? Number(estado.peso.replace(',', '.')) : null,
            sexo: estado.sexo || null,
            idade: estado.idade ? Number(estado.idade) : null,
            altura_cm: paciente?.altura_cm ?? null,
            equipamento: estado.equipamento || null,
            medidas,
          }),
        }
      )

      const dados = await resposta.json().catch(() => null)

      if (!resposta.ok || !dados?.success) {
        toast.error(dados?.error ?? 'Não foi possível salvar a avaliação')
        return
      }

      // Só limpa o rascunho depois da confirmação do servidor.
      clearDraft()
      toast.success('Avaliação registrada')
      router.replace(
        `/portal/clients/${patientId}/ultrassom/${dados.assessment.id}?nova=1`
      )
    } catch {
      toast.error('Falha de conexão. Os dados continuam salvos no aparelho.')
    } finally {
      setSalvando(false)
    }
  }

  const sair = () => {
    if (
      !vazio(estado) &&
      !window.confirm(
        'Sair da coleta? O que você já mediu fica guardado neste aparelho e aparece para retomar quando você voltar.'
      )
    ) {
      return
    }
    router.push(`/portal/clients/${patientId}`)
  }

  const totalSitios = sitios.length
  const naRevisao = estado.passo > totalSitios && totalSitios > 0

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col safe-top">
      {/* Cabeçalho fixo */}
      <header className="px-4 py-3 border-b border-border bg-background-card">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={sair}
            aria-label="Sair da coleta"
            className="p-2 -ml-2 rounded-lg text-foreground-secondary hover:bg-background-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-body-lg text-foreground truncate">
              {naRevisao
                ? 'Revisão'
                : estado.passo === 0
                  ? 'Nova avaliação'
                  : `${estado.passo} de ${totalSitios}`}
            </p>
            <p className="text-label-sm text-foreground-muted truncate">
              {paciente?.nome ?? 'Paciente não confirmado'}
            </p>
          </div>
          <DraftStatusIndicator status={status} lastSavedAt={lastSavedAt} />
        </div>

        {/* Passos: clicáveis só para trás. O traço é fino, mas o alvo de toque
            tem 44px de altura — voltar para corrigir uma medida é a ação mais
            provável de uma coleta, e não pode exigir mira. */}
        {totalSitios > 0 && estado.passo > 0 && (
          <ul className="flex gap-1.5 mt-1" aria-label="Pontos da coleta">
            {sitios.map((site, indice) => {
              const numero = indice + 1
              const concluido =
                (estado.medidas[chave(site, USG_SITES[site].tecido)] ?? []).length > 0
              const atual = numero === estado.passo
              const bloqueado = numero > estado.passo
              return (
                <li key={site} className="flex-1">
                  <button
                    type="button"
                    aria-current={atual ? 'step' : undefined}
                    aria-label={`${USG_SITES[site].label}${
                      concluido ? ', medido' : ''
                    }${bloqueado ? ', ainda não disponível' : ''}`}
                    disabled={bloqueado}
                    onClick={() => irPara(numero)}
                    className={[
                      'w-full py-4 flex items-center rounded',
                      bloqueado ? 'cursor-default' : 'cursor-pointer',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        'h-1.5 w-full rounded-full transition-colors',
                        atual
                          ? 'bg-dourado'
                          : concluido
                            ? 'bg-dourado/50'
                            : 'bg-border',
                      ].join(' ')}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </header>

      {/* Prefill indisponível: a coleta segue, mas sem valores de referência e
          sem confirmação do nome — a nutricionista precisa saber disso. */}
      {erroPrefill && (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-[#d4850f]/40 bg-[#d4850f]/5">
          <p className="text-label-sm text-foreground-secondary">
            Não consegui carregar os dados deste paciente. Dá para coletar mesmo
            assim, mas confira o nome antes de salvar e preencha sexo, idade e peso
            à mão.
          </p>
          <button
            type="button"
            onClick={carregarPrefill}
            className="mt-2 h-10 px-3 rounded-lg border border-border text-label text-foreground-secondary"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Restauração de rascunho */}
      {pendingDraft && (
        <div className="px-4 pt-3">
          <DraftRestoreBanner
            savedAt={pendingDraft.savedAt}
            label="Coleta iniciada e não salva"
            onRestore={() => {
              setEstado(pendingDraft.value)
              dismissPending()
            }}
            onDiscard={() => {
              clearDraft()
              dismissPending()
            }}
          />
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-hidden">
        {carregando && estado.passo === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-dourado" aria-label="Carregando" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={estado.passo}
              initial={prefereMenosMovimento ? { opacity: 0 } : { opacity: 0, x: 24 }}
              animate={prefereMenosMovimento ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={prefereMenosMovimento ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {estado.passo === 0 && (
                <SetupStep
                  estado={estado}
                  onChange={(parcial) => setEstado((a) => ({ ...a, ...parcial }))}
                  onIniciar={iniciarColeta}
                  temAvaliacaoAnterior={anterior !== null}
                  jaColetou={jaColetou}
                  protocoloDoHistorico={anterior?.protocolo ?? null}
                />
              )}

              {siteAtual && (
                <SiteCaptureStep
                  site={siteAtual}
                  tecido={tecidoAtual}
                  passo={estado.passo}
                  total={totalSitios}
                  repeticoes={repeticoesAtuais}
                  valorAnterior={valorAnterior}
                  rotuloAvaliacaoAnterior={anterior?.momento_avaliacao ?? 'Anterior'}
                  onAddRepeticao={adicionarRepeticao}
                  onAddRepeticaoEAvancar={(valor) => adicionarRepeticao(valor, true)}
                  onRemoveRepeticao={removerRepeticao}
                  onProximo={() => {
                    if (editandoDaRevisao) {
                      setEditandoDaRevisao(false)
                      irPara(sitios.length + 1)
                    } else {
                      irPara(estado.passo + 1)
                    }
                  }}
                  onPular={() => {
                    if (editandoDaRevisao) {
                      setEditandoDaRevisao(false)
                      irPara(sitios.length + 1)
                    } else {
                      irPara(estado.passo + 1)
                    }
                  }}
                  onAbrirInstrucoes={() => setSitioInstrucoes(siteAtual)}
                />
              )}

              {naRevisao && (
                <ReviewStep
                  estado={estado}
                  sitios={sitios}
                  medianaPorSitio={(site, tecido) =>
                    mediana(estado.medidas[chave(site, tecido)] ?? [])
                  }
                  anterior={anterior}
                  salvando={salvando}
                  onEditarSitio={(indice) => {
                    setEditandoDaRevisao(true)
                    irPara(indice + 1)
                  }}
                  onSalvar={salvar}
                  onEditarDados={() => setEstado((a) => ({ ...a, passo: 0 }))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <ProtocolSheet site={sitioInstrucoes} onClose={() => setSitioInstrucoes(null)} />
    </div>
  )
}
