'use client'

import { useCallback, useEffect, useState } from 'react'
import { getUsgAssessments } from '@/lib/services/ultrasound'
import { encontrarAnteriorComparavel } from '@/lib/usg/series'
import type { UsgAssessmentWithSites } from '@/lib/usg/types'

interface UseUltrasoundAssessments {
  avaliacoes: UsgAssessmentWithSites[]
  ultima: UsgAssessmentWithSites | null
  anterior: UsgAssessmentWithSites | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Leitura das avaliações por ultrassom pelo próprio paciente.
 *
 * Só leitura: a RLS não concede escrita a ninguém pelo cliente — o dado é
 * produzido por profissional com equipamento.
 */
export function useUltrasoundAssessments(limite = 20): UseUltrasoundAssessments {
  const [avaliacoes, setAvaliacoes] = useState<UsgAssessmentWithSites[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setAvaliacoes(await getUsgAssessments(limite))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar as avaliações')
    } finally {
      setIsLoading(false)
    }
  }, [limite])

  useEffect(() => {
    carregar()
  }, [carregar])

  const ultima = avaliacoes[0] ?? null

  return {
    avaliacoes,
    ultima,
    // A "anterior" precisa ser do mesmo protocolo: comparar a soma de 7 sítios
    // com a de 3 mostraria uma queda enorme que é só troca de protocolo.
    anterior: ultima ? encontrarAnteriorComparavel(avaliacoes, ultima) : null,
    isLoading,
    error,
    refresh: carregar,
  }
}
