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

      if (!user) {
        console.error('Usuário não autenticado')
        return false
      }

      // Dados para inserir no Supabase
      const dbData = {
        user_id: user.id,
        data: input.data,
        peso: input.peso,
        altura_cm: input.altura,
        // Composição corporal
        agua_corporal_l: input.agua_total || null,
        proteina_kg: input.proteina || null,
        minerais_kg: input.minerais || null,
        massa_gordura_kg: input.gordura_corporal || null,
        // Análise músculo-gordura
        massa_muscular_esqueletica_kg: input.massa_muscular_esqueletica || null,
        massa_livre_gordura_kg: input.massa_magra || null,
        // Índices
        imc: input.imc || (input.peso / ((input.altura / 100) ** 2)),
        percentual_gordura: input.percentual_gordura || null,
        taxa_metabolica_basal: input.taxa_metabolica_basal || null,
        gordura_visceral: input.nivel_gordura_visceral || null,
        pontuacao_inbody: input.pontuacao_inbody || null,
        // Controle
        peso_ideal: input.peso_ideal || null,
        controle_peso: input.controle_peso || null,
        controle_gordura: input.controle_gordura || null,
        controle_muscular: input.controle_muscular || null,
        // Segmental - massa magra
        massa_magra_braco_direito: input.massa_magra_braco_direito || null,
        massa_magra_braco_esquerdo: input.massa_magra_braco_esquerdo || null,
        massa_magra_tronco: input.massa_magra_tronco || null,
        massa_magra_perna_direita: input.massa_magra_perna_direita || null,
        massa_magra_perna_esquerda: input.massa_magra_perna_esquerda || null,
        // Segmental - gordura
        gordura_braco_direito: input.gordura_braco_direito || null,
        gordura_braco_esquerdo: input.gordura_braco_esquerdo || null,
        gordura_tronco: input.gordura_tronco || null,
        gordura_perna_direita: input.gordura_perna_direita || null,
        gordura_perna_esquerda: input.gordura_perna_esquerda || null,
        // Medidas circunferenciais
        circ_torax: input.circ_torax || null,
        circ_abdome: input.circ_abdome || null,
        circ_braco_d: input.circ_braco_d || null,
        circ_braco_e: input.circ_braco_e || null,
        circ_antebraco_d: input.circ_antebraco_d || null,
        circ_antebraco_e: input.circ_antebraco_e || null,
        circ_coxa_d: input.circ_coxa_d || null,
        circ_coxa_e: input.circ_coxa_e || null,
        circ_panturrilha_d: input.circ_panturrilha_d || null,
        circ_panturrilha_e: input.circ_panturrilha_e || null,
        // Metadados
        fonte: input.fonte,
        notas: input.notas || null,
        foto_url: input.foto_url || null,
      }

      // Salvar no Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_body_compositions')
        .insert(dbData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar no Supabase:', error)
        throw error
      }

      // Criar objeto de medição para o state local
      const newMeasurement: BodyCompositionMeasurement = {
        id: data?.id || `med-${Date.now()}`,
        user_id: user.id,
        data: input.data,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        peso: input.peso,
        altura: input.altura,
        idade: 44,

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

        segmental: {
          braco_esquerdo: { massa_magra: input.massa_magra_braco_esquerdo || 0, percentual_gordura: 0, avaliacao: 'normal' },
          braco_direito: { massa_magra: input.massa_magra_braco_direito || 0, percentual_gordura: 0, avaliacao: 'normal' },
          tronco: { massa_magra: input.massa_magra_tronco || 0, percentual_gordura: 0, avaliacao: 'normal' },
          perna_esquerda: { massa_magra: input.massa_magra_perna_esquerda || 0, percentual_gordura: 0, avaliacao: 'normal' },
          perna_direita: { massa_magra: input.massa_magra_perna_direita || 0, percentual_gordura: 0, avaliacao: 'normal' }
        },

        score: {
          pontuacao: input.pontuacao_inbody || 0,
          categoria: input.pontuacao_inbody && input.pontuacao_inbody >= 90 ? 'excelente' :
                     input.pontuacao_inbody && input.pontuacao_inbody >= 80 ? 'bom' :
                     input.pontuacao_inbody && input.pontuacao_inbody >= 70 ? 'normal' :
                     input.pontuacao_inbody && input.pontuacao_inbody >= 60 ? 'abaixo_media' : 'fraco'
        },

        fonte: input.fonte,
        notas: input.notas,
        created_at: new Date().toISOString()
      }

      // Update local state
      setMeasurements(prev => [newMeasurement, ...prev])

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
