'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AssessmentResult } from '@/components/portal/ultrassom/assessment-result'
import { ErrorState } from '@/components/ui/states'
import { getProtocol } from '@/lib/usg/protocols'
import type { UsgAssessmentWithSites } from '@/lib/usg/types'

export default function ResultadoUltrassomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const patientId = typeof params.id === 'string' ? params.id : ''
  const assessmentId =
    typeof params.assessmentId === 'string' ? params.assessmentId : ''
  const ehNova = searchParams.get('nova') === '1'

  const [avaliacao, setAvaliacao] = useState<UsgAssessmentWithSites | null>(null)
  const [historico, setHistorico] = useState<UsgAssessmentWithSites[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [respostaDetalhe, respostaHistorico] = await Promise.all([
        fetch(`/api/professional/clients/${patientId}/ultrassom/${assessmentId}`),
        fetch(`/api/professional/clients/${patientId}/ultrassom?limit=30`),
      ])

      const detalhe = await respostaDetalhe.json().catch(() => null)
      const lista = await respostaHistorico.json().catch(() => null)

      if (!respostaDetalhe.ok || !detalhe?.success) {
        setErro(detalhe?.error ?? 'Avaliação não encontrada')
        return
      }

      setAvaliacao(detalhe.assessment)
      setHistorico(lista?.success ? (lista.assessments ?? []) : [])
    } catch {
      setErro('Falha de conexão ao carregar a avaliação')
    } finally {
      setCarregando(false)
    }
  }, [patientId, assessmentId])

  useEffect(() => {
    if (patientId && assessmentId) carregar()
  }, [patientId, assessmentId, carregar])

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dourado" aria-label="Carregando" />
      </div>
    )
  }

  if (erro || !avaliacao) {
    return (
      <div className="p-4">
        <ErrorState
          title="Não foi possível abrir a avaliação"
          description={erro ?? 'Avaliação não encontrada'}
          onRetry={carregar}
        />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-start gap-3 mb-4">
        <Link
          href={`/portal/clients/${patientId}`}
          aria-label="Voltar para o paciente"
          className="p-2 -ml-2 rounded-lg text-foreground-secondary hover:bg-background-elevated"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-title-md text-foreground">
            Avaliação por ultrassom
          </h1>
          <p className="text-label-sm text-foreground-muted">
            {format(parseISO(avaliacao.data), "d 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
            {avaliacao.momento_avaliacao ? ` · ${avaliacao.momento_avaliacao}` : ''} ·{' '}
            {getProtocol(avaliacao.protocolo).label}
          </p>
        </div>
      </div>

      {ehNova && (
        <div className="mb-4 p-3 rounded-xl border border-[#7dad6a]/40 bg-[#7dad6a]/10 text-body-md text-foreground-secondary">
          Avaliação registrada. O paciente já consegue ver os números — escreva a
          interpretação abaixo para ele ler junto.
        </div>
      )}

      <AssessmentResult
        patientId={patientId}
        avaliacao={avaliacao}
        historico={historico}
        onAtualizada={(atualizada) => setAvaliacao(atualizada)}
        onRemovida={() => router.push(`/portal/clients/${patientId}`)}
      />
    </div>
  )
}
