"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getMockMeasurements,
  getLatestMeasurement,
  calculateBodyStats,
  calculateBodySummary,
  LEONARDO_GOALS,
  type BodyCompositionMeasurement,
  type BodyStats,
  type BodyCompositionSummary,
  type BodyGoals,
  type NewMeasurementInput
} from '@/lib/body'

interface UseBodyCompositionReturn {
  // Dados
  measurements: BodyCompositionMeasurement[]
  latestMeasurement: BodyCompositionMeasurement | null
  stats: BodyStats
  summary: BodyCompositionSummary
  goals: BodyGoals

  // Estados
  isLoading: boolean
  error: Error | null

  // Ações
  addMeasurement: (input: NewMeasurementInput) => Promise<boolean>
  deleteMeasurement: (id: string) => Promise<boolean>
  updateGoals: (goals: Partial<BodyGoals>) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useBodyComposition(): UseBodyCompositionReturn {
  const [measurements, setMeasurements] = useState<BodyCompositionMeasurement[]>([])
  const [goals, setGoals] = useState<BodyGoals>(LEONARDO_GOALS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar medições
  const loadMeasurements = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usar dados mock do Leonardo
        const mockData = getMockMeasurements()
        setMeasurements(mockData)
        setIsLoading(false)
        return
      }

      // TODO: Implementar busca real do Supabase
      // Por enquanto, usar mock
      const mockData = getMockMeasurements()
      setMeasurements(mockData)
    } catch (err) {
      console.error('Erro ao carregar medições:', err)
      setError(err as Error)
      // Fallback para mock
      const mockData = getMockMeasurements()
      setMeasurements(mockData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMeasurements()
  }, [loadMeasurements])

  // Calcular estatísticas
  const stats = useMemo(() => calculateBodyStats(measurements), [measurements])

  // Calcular resumo
  const summary = useMemo(() => calculateBodySummary(measurements), [measurements])

  // Última medição
  const latestMeasurement = useMemo(() => {
    if (measurements.length === 0) return null
    return measurements.reduce((latest, current) =>
      new Date(current.data) > new Date(latest.data) ? current : latest
    )
  }, [measurements])

  // Adicionar nova medição
  const addMeasurement = useCallback(async (input: NewMeasurementInput): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Criar objeto de medição completo
      const newMeasurement: BodyCompositionMeasurement = {
        id: `med-${Date.now()}`,
        user_id: user?.id || 'mock-user',
        data: input.data,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        peso: input.peso,
        altura: input.altura,
        idade: 44, // TODO: Calcular idade real

        composicao: {
          agua_total: input.agua_total || 0,
          proteina: input.proteina || 0,
          minerais: input.minerais || 0,
          gordura_corporal: input.gordura_corporal || 0
        },

        musculo_gordura: {
          peso: input.peso,
          massa_muscular_esqueletica: input.massa_muscular_esqueletica || 0,
          massa_gordura_corporal: input.gordura_corporal || 0,
          imc: input.imc || (input.peso / ((input.altura / 100) ** 2)),
          percentual_gordura: input.percentual_gordura || 0
        },

        adicional: {
          taxa_metabolica_basal: input.taxa_metabolica_basal || 0,
          nivel_gordura_visceral: input.nivel_gordura_visceral || 0,
          massa_magra: input.massa_magra || 0,
          massa_muscular: input.massa_muscular || 0,
          agua_intracelular: 0,
          agua_extracelular: 0,
          relacao_cintura_quadril: 0,
          altura: input.altura,
          idade: 44
        },

        segmental: input.segmental ? {
          braco_esquerdo: input.segmental.braco_esquerdo || { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          braco_direito: input.segmental.braco_direito || { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          tronco: input.segmental.tronco || { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          perna_esquerda: input.segmental.perna_esquerda || { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          perna_direita: input.segmental.perna_direita || { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' }
        } : {
          braco_esquerdo: { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          braco_direito: { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          tronco: { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          perna_esquerda: { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' },
          perna_direita: { massa_magra: 0, percentual_gordura: 0, avaliacao: 'normal' }
        },

        score: {
          pontuacao: 0, // TODO: Calcular
          categoria: 'normal'
        },

        fonte: input.fonte,
        notas: input.notas,
        created_at: new Date().toISOString()
      }

      // Optimistic update
      setMeasurements(prev => [newMeasurement, ...prev])

      // TODO: Salvar no Supabase
      // const { error } = await supabase.from('fitness_body_measurements').insert(newMeasurement)
      // if (error) throw error

      return true
    } catch (err) {
      console.error('Erro ao adicionar medição:', err)
      setError(err as Error)
      return false
    }
  }, [])

  // Deletar medição
  const deleteMeasurement = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Optimistic update
      setMeasurements(prev => prev.filter(m => m.id !== id))

      // TODO: Deletar do Supabase

      return true
    } catch (err) {
      console.error('Erro ao deletar medição:', err)
      setError(err as Error)
      // Recarregar para reverter
      await loadMeasurements()
      return false
    }
  }, [loadMeasurements])

  // Atualizar metas
  const updateGoals = useCallback(async (newGoals: Partial<BodyGoals>): Promise<boolean> => {
    try {
      setGoals(prev => ({ ...prev, ...newGoals }))

      // TODO: Salvar no Supabase

      return true
    } catch (err) {
      console.error('Erro ao atualizar metas:', err)
      setError(err as Error)
      return false
    }
  }, [])

  return {
    measurements,
    latestMeasurement,
    stats,
    summary,
    goals,
    isLoading,
    error,
    addMeasurement,
    deleteMeasurement,
    updateGoals,
    refresh: loadMeasurements
  }
}
