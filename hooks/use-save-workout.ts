'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { CompletedCardio, CardioIntensity } from '@/lib/workout/types'

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
  cardioExercises?: CompletedCardio[]
  difficulty?: number
  energy?: number
  notes?: string
}

export interface SavedCardioAward {
  workoutExerciseId: string
  intensity: CardioIntensity
}

export interface SaveWorkoutResult {
  workoutId: string
  prSetIds: string[]
  cardioAwards: SavedCardioAward[]
}

interface UseSaveWorkoutReturn {
  saveWorkout: (data: WorkoutSaveData) => Promise<SaveWorkoutResult | null>
  saving: boolean
  error: string | null
}

export function useSaveWorkout(): UseSaveWorkoutReturn {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Lock síncrono: setSaving(true) é assíncrono e não impede chamadas
  // concorrentes. Sem isso, cliques rápidos podem inserir o mesmo treino N vezes.
  const inFlightRef = useRef(false)

  const supabase = createClient()

  const saveWorkout = useCallback(async (data: WorkoutSaveData): Promise<SaveWorkoutResult | null> => {
    if (inFlightRef.current) return null
    inFlightRef.current = true
    setSaving(true)
    setError(null)
    const prSetIds: string[] = []
    const cardioAwards: SavedCardioAward[] = []

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Check if this is a template-based workout (ID starts with "template-")
      const isTemplateWorkout = data.workoutId.startsWith('template-')

      // Only use templateId if it's explicitly provided and NOT from a professional's program
      // Template workouts from professionals have IDs like "template-2024-12-28-uuid"
      // but that UUID is from fitness_training_days, not fitness_workout_templates
      // So we should NOT use it as template_id to avoid foreign key violations
      let templateId: string | null = null

      // Only use templateId if explicitly provided AND the workout is NOT template-based
      // (real user templates that exist in fitness_workout_templates)
      if (data.templateId && !isTemplateWorkout) {
        templateId = data.templateId
      }

      // Calculate total volume
      const totalVolume = data.completedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0)

      // Calculate cardio calories
      const cardioCalories = data.cardioExercises?.reduce((acc, c) => acc + (c.calorias || 0), 0) || 0

      // Estimate calories (rough estimate: 5 calories per minute of strength training + cardio calories)
      const caloriesEstimated = Math.round(data.duracao * 5) + cardioCalories

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

        const { data: insertedSets, error: setsError } = await (supabase as AnyTable)
          .from('fitness_exercise_sets')
          .insert(setsToInsert)
          .select('id, is_pr')

        if (setsError) {
          console.error('Error creating exercise sets:', setsError)
          throw setsError
        }

        // (PR set IDs serão re-lidos ao final, depois que todos os sets
        // tiverem sido inseridos — o trigger SQL pode "substituir" PRs
        // dentro do mesmo treino quando uma carga maior aparece.)

        exerciseOrder++
      }

      // 3. Save cardio exercises
      if (data.cardioExercises && data.cardioExercises.length > 0) {
        for (const cardio of data.cardioExercises) {
          // Create workout exercise for cardio
          const { data: cardioExercise, error: cardioExerciseError } = await (supabase as AnyTable)
            .from('fitness_workout_exercises')
            .insert({
              workout_id: workoutRecordId,
              exercise_id: null,
              exercicio_nome: cardio.nome,
              ordem: exerciseOrder,
              status: 'concluido',
              notas: cardio.notas || `Cardio: ${cardio.duracao_minutos}min${cardio.distancia_km ? ` | ${cardio.distancia_km}km` : ''}${cardio.velocidade_media ? ` | ${cardio.velocidade_media}km/h` : ''}`
            })
            .select()
            .single()

          if (cardioExerciseError) {
            console.error('Error creating cardio exercise:', cardioExerciseError)
            throw cardioExerciseError
          }

          // Create a "set" for cardio with duration as time
          const { error: cardioSetError } = await (supabase as AnyTable)
            .from('fitness_exercise_sets')
            .insert({
              workout_exercise_id: cardioExercise.id,
              numero_serie: 1,
              repeticoes_planejadas: cardio.duracao_minutos,
              repeticoes_realizadas: cardio.duracao_minutos,
              carga: cardio.distancia_km || 0, // Use carga for distance if available
              unidade_carga: 'km',
              tempo_segundos: cardio.duracao_minutos * 60,
              status: 'concluido',
              is_pr: false,
              notas: `Cardio - ${cardio.calorias || 0} kcal`
            })

          if (cardioSetError) {
            console.error('Error creating cardio set:', cardioSetError)
            throw cardioSetError
          }

          // Marca cardio para receber pts por intensidade no fluxo de
          // resumo (resumo/page.tsx chama awardCardioInWorkoutPoints).
          // Sem intensidade → não pontua (campo opcional no formulário).
          if (cardio.intensidade) {
            cardioAwards.push({
              workoutExerciseId: cardioExercise.id as string,
              intensity: cardio.intensidade,
            })
          }

          exerciseOrder++
        }
      }

      // Roda dedupe pós-batch: o trigger BEFORE INSERT em fitness_exercise_sets
      // não enxerga os outros sets do mesmo .insert([...]) batch (ainda não
      // commitados), então marca todos com is_pr=TRUE. A função RPC
      // fitness_dedupe_workout_prs deixa só o set mais pesado por exercício
      // marcado e apaga fitness_personal_records redundantes.
      await (supabase as AnyTable).rpc('fitness_dedupe_workout_prs', {
        p_workout_id: workoutRecordId,
      })

      // Re-leitura do estado final de is_pr (já deduplicado).
      const { data: finalPrSets } = await (supabase as AnyTable)
        .from('fitness_exercise_sets')
        .select('id, workout_exercise:workout_exercise_id(workout_id)')
        .eq('is_pr', true)

      for (const s of (finalPrSets || [])) {
        const we = (s as { workout_exercise?: { workout_id?: string } }).workout_exercise
        if (we?.workout_id === workoutRecordId && (s as { id?: string }).id) {
          prSetIds.push((s as { id: string }).id)
        }
      }

      return { workoutId: workoutRecordId, prSetIds, cardioAwards }
    } catch (err) {
      console.error('Error saving workout:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar treino')
      return null
    } finally {
      setSaving(false)
      inFlightRef.current = false
    }
  }, [supabase])

  return {
    saveWorkout,
    saving,
    error
  }
}
