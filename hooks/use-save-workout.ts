'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

interface CompletedSetData {
  exerciseId: string
  exerciseName: string
  setNumber: number
  reps: number
  weight: number
  isPR: boolean
}

interface WorkoutSaveData {
  workoutId: string // Can be template-based ID or real workout ID
  templateId?: string
  nome: string
  tipo: string
  data: string // YYYY-MM-DD
  duracao: number // minutes
  completedSets: CompletedSetData[]
  difficulty?: number
  energy?: number
  notes?: string
}

interface UseSaveWorkoutReturn {
  saveWorkout: (data: WorkoutSaveData) => Promise<string | null>
  saving: boolean
  error: string | null
}

export function useSaveWorkout(): UseSaveWorkoutReturn {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const saveWorkout = useCallback(async (data: WorkoutSaveData): Promise<string | null> => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Check if this is a template-based workout (ID starts with "template-")
      const isTemplateWorkout = data.workoutId.startsWith('template-')

      // Extract template ID from the workout ID if it's a template workout
      let templateId = data.templateId
      if (isTemplateWorkout && !templateId) {
        // Format: template-YYYY-MM-DD-templateId
        const parts = data.workoutId.split('-')
        if (parts.length >= 5) {
          templateId = parts.slice(4).join('-')
        }
      }

      // Calculate total volume
      const totalVolume = data.completedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0)

      // Estimate calories (rough estimate: 5 calories per minute of strength training)
      const caloriesEstimated = Math.round(data.duracao * 5)

      // Group sets by exercise
      const exerciseMap = new Map<string, CompletedSetData[]>()
      data.completedSets.forEach(set => {
        const existing = exerciseMap.get(set.exerciseName) || []
        existing.push(set)
        exerciseMap.set(set.exerciseName, existing)
      })

      // 1. Create the workout record
      const now = new Date()
      const startTime = new Date(now.getTime() - (data.duracao * 60 * 1000)) // Subtract duration to get start time

      const { data: workoutRecord, error: workoutError } = await (supabase as AnyTable)
        .from('fitness_workouts')
        .insert({
          user_id: user.id,
          template_id: templateId || null,
          nome: data.nome,
          tipo: data.tipo,
          data: data.data,
          hora_inicio: startTime.toISOString(),
          hora_fim: now.toISOString(),
          duracao_minutos: data.duracao,
          status: 'concluido',
          calorias_estimadas: caloriesEstimated,
          notas: data.notes || null,
          nivel_energia: data.energy || null,
          nivel_dificuldade: data.difficulty || null
        })
        .select()
        .single()

      if (workoutError) {
        console.error('Error creating workout:', workoutError)
        throw workoutError
      }

      const workoutRecordId = workoutRecord.id

      // 2. Create workout exercises and sets
      let exerciseOrder = 0
      for (const [exerciseName, sets] of Array.from(exerciseMap.entries())) {
        // Create workout exercise
        const { data: exerciseRecord, error: exerciseError } = await (supabase as AnyTable)
          .from('fitness_workout_exercises')
          .insert({
            workout_id: workoutRecordId,
            exercise_id: null, // We don't have the actual exercise ID from the catalog
            exercicio_nome: exerciseName,
            ordem: exerciseOrder,
            status: 'concluido',
            notas: null
          })
          .select()
          .single()

        if (exerciseError) {
          console.error('Error creating workout exercise:', exerciseError)
          throw exerciseError
        }

        // Create sets for this exercise
        const setsToInsert = sets.map(set => ({
          workout_exercise_id: exerciseRecord.id,
          numero_serie: set.setNumber,
          repeticoes_planejadas: set.reps,
          repeticoes_realizadas: set.reps,
          carga: set.weight,
          unidade_carga: 'kg',
          status: 'concluido',
          is_pr: set.isPR,
          notas: null
        }))

        const { error: setsError } = await (supabase as AnyTable)
          .from('fitness_exercise_sets')
          .insert(setsToInsert)

        if (setsError) {
          console.error('Error creating exercise sets:', setsError)
          throw setsError
        }

        exerciseOrder++
      }

      return workoutRecordId
    } catch (err) {
      console.error('Error saving workout:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar treino')
      return null
    } finally {
      setSaving(false)
    }
  }, [supabase])

  return {
    saveWorkout,
    saving,
    error
  }
}
