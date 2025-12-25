'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Goals, Recommendations, GoalProgress, UseGoalsReturn } from '@/types/settings'
import { defaultGoals } from '@/lib/settings/defaults'
import { calculateMacroRecommendations } from '@/lib/settings/validators'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goals | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendations>({
    calorias: { min: 2400, max: 2600 },
    proteina: { min: 144, max: 180 },
    carboidratos: { min: 250, max: 310 },
    gordura: { min: 65, max: 81 },
    agua: 2835
  })
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchGoals = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile with goals from fitness_profiles
      const { data: profileData } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const profile = profileData as unknown as SupabaseRow

      if (profile) {
        // Map profile fields to goals format
        const goalsData: Goals = {
          calorias: profile.meta_calorias_diarias ?? defaultGoals.calorias,
          proteina: profile.meta_proteina_g ?? defaultGoals.proteina,
          carboidratos: profile.meta_carboidrato_g ?? defaultGoals.carboidratos,
          gordura: profile.meta_gordura_g ?? defaultGoals.gordura,
          agua: profile.meta_agua_ml ?? defaultGoals.agua,
          treinos_semana: profile.meta_treinos_semana ?? defaultGoals.treinos_semana,
          minutos_treino: profile.meta_minutos_treino ?? defaultGoals.minutos_treino,
          peso_meta: profile.meta_peso ?? defaultGoals.peso_meta,
          gordura_meta: profile.meta_percentual_gordura ?? defaultGoals.gordura_meta,
          musculo_meta: profile.meta_massa_muscular ?? defaultGoals.musculo_meta,
          horas_sono: profile.meta_horas_sono ?? defaultGoals.horas_sono
        }
        setGoals(goalsData)

        // Calculate recommendations based on profile
        if (profile.altura_cm && profile.peso_atual) {
          const recs = calculateMacroRecommendations(
            profile.peso_atual,
            profile.altura_cm,
            profile.data_nascimento ? calculateAge(profile.data_nascimento) : 44,
            profile.sexo || 'masculino',
            profile.nivel_atividade || 'intenso',
            'manter'
          )
          setRecommendations(recs)
        }

        // Try to fetch latest body composition for progress (optional - table may not exist)
        try {
          const { data: bodyData, error: bodyError } = await supabase
            .from('fitness_body_compositions')
            .select('peso, massa_gordura_kg, massa_muscular_kg')
            .eq('user_id', user.id)
            .order('data', { ascending: false })
            .limit(1)
            .single()

          if (!bodyError && bodyData) {
            const body = bodyData as unknown as SupabaseRow
            const currentWeight = body.peso || profile.peso_atual || 0
            const currentFat = body.massa_gordura_kg ? (body.massa_gordura_kg / currentWeight) * 100 : 0
            const currentMuscle = body.massa_muscular_kg || 0

            setProgress({
              weight: {
                current: currentWeight,
                target: goalsData.peso_meta,
                percent: currentWeight
                  ? Math.round((1 - Math.abs(currentWeight - goalsData.peso_meta) / currentWeight) * 100)
                  : 0,
                remaining: goalsData.peso_meta - currentWeight
              },
              fat: {
                current: currentFat,
                target: goalsData.gordura_meta,
                percent: currentFat
                  ? Math.round((1 - Math.abs(currentFat - goalsData.gordura_meta) / currentFat) * 100)
                  : 0,
                remaining: goalsData.gordura_meta - currentFat
              },
              muscle: {
                current: currentMuscle,
                target: goalsData.musculo_meta,
                percent: currentMuscle
                  ? Math.round((currentMuscle / goalsData.musculo_meta) * 100)
                  : 0,
                remaining: goalsData.musculo_meta - currentMuscle
              }
            })
          } else {
            // Use profile data as fallback for progress
            const currentWeight = profile.peso_atual || 0
            setProgress({
              weight: {
                current: currentWeight,
                target: goalsData.peso_meta,
                percent: currentWeight
                  ? Math.round((1 - Math.abs(currentWeight - goalsData.peso_meta) / currentWeight) * 100)
                  : 0,
                remaining: goalsData.peso_meta - currentWeight
              },
              fat: { current: 0, target: goalsData.gordura_meta, percent: 0, remaining: goalsData.gordura_meta },
              muscle: { current: 0, target: goalsData.musculo_meta, percent: 0, remaining: goalsData.musculo_meta }
            })
          }
        } catch {
          // Table doesn't exist, use profile data as fallback
          const currentWeight = profile.peso_atual || 0
          setProgress({
            weight: {
              current: currentWeight,
              target: goalsData.peso_meta,
              percent: currentWeight
                ? Math.round((1 - Math.abs(currentWeight - goalsData.peso_meta) / currentWeight) * 100)
                : 0,
              remaining: goalsData.peso_meta - currentWeight
            },
            fat: { current: 0, target: goalsData.gordura_meta, percent: 0, remaining: goalsData.gordura_meta },
            muscle: { current: 0, target: goalsData.musculo_meta, percent: 0, remaining: goalsData.musculo_meta }
          })
        }
      } else {
        setGoals(defaultGoals)
      }
    } catch (err) {
      console.error('Error fetching goals:', err)
      setGoals(defaultGoals)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const updateGoals = useCallback(async (newGoals: Partial<Goals>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updatedGoals = { ...goals, ...newGoals }

      // Map goals to profile fields and update fitness_profiles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('fitness_profiles')
        .update({
          meta_calorias_diarias: updatedGoals.calorias,
          meta_proteina_g: updatedGoals.proteina,
          meta_carboidrato_g: updatedGoals.carboidratos,
          meta_gordura_g: updatedGoals.gordura,
          meta_agua_ml: updatedGoals.agua,
          meta_treinos_semana: updatedGoals.treinos_semana,
          meta_minutos_treino: updatedGoals.minutos_treino,
          meta_peso: updatedGoals.peso_meta,
          meta_percentual_gordura: updatedGoals.gordura_meta,
          meta_massa_muscular: updatedGoals.musculo_meta,
          meta_horas_sono: updatedGoals.horas_sono,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setGoals(updatedGoals as Goals)
    } catch (err) {
      console.error('Error updating goals:', err)
      throw err
    }
  }, [goals, supabase])

// Helper function to calculate age from birth date
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

  const calculateRecommendationsFunc = useCallback((
    peso: number,
    altura: number,
    idade: number,
    genero: string
  ): Recommendations => {
    return calculateMacroRecommendations(
      peso,
      altura,
      idade,
      genero as 'masculino' | 'feminino',
      'intenso',
      'manter'
    )
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return {
    goals,
    recommendations,
    progress,
    loading,
    updateGoals,
    calculateRecommendations: calculateRecommendationsFunc
  }
}
