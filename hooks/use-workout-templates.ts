'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutTemplate, TemplateExercise, WorkoutType, WorkoutPhase } from '@/lib/workout/types'

export interface UseWorkoutTemplatesReturn {
  templates: WorkoutTemplate[]
  loading: boolean
  error: Error | null
  createTemplate: (template: Omit<WorkoutTemplate, 'id'>) => Promise<WorkoutTemplate>
  updateTemplate: (id: string, template: Partial<WorkoutTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<WorkoutTemplate>
  getTemplateById: (id: string) => Promise<WorkoutTemplate | null>
  addExerciseToTemplate: (templateId: string, exercise: Omit<TemplateExercise, 'id'>) => Promise<void>
  updateExercise: (templateId: string, exerciseId: string, exercise: Partial<TemplateExercise>) => Promise<void>
  removeExerciseFromTemplate: (templateId: string, exerciseId: string) => Promise<void>
  reorderExercises: (templateId: string, exerciseIds: string[]) => Promise<void>
  refresh: () => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export function useWorkoutTemplates(): UseWorkoutTemplatesReturn {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTemplates([])
        return
      }

      // Fetch templates with exercises
      const { data: templatesData, error: templatesError } = await (supabase as AnyTable)
        .from('fitness_workout_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_ativo', true)
        .order('dia_semana', { ascending: true })

      if (templatesError) throw templatesError

      // Fetch exercises for each template
      const templatesWithExercises: WorkoutTemplate[] = await Promise.all(
        (templatesData || []).map(async (t: SupabaseRow) => {
          const { data: exercisesData } = await (supabase as AnyTable)
            .from('fitness_workout_template_exercises')
            .select('*')
            .eq('template_id', t.id)
            .order('ordem', { ascending: true })

          const exercises: TemplateExercise[] = (exercisesData || []).map((e: SupabaseRow) => ({
            id: e.id,
            exercise_id: e.exercise_id,
            nome: e.exercicio_nome || e.nome,
            ordem: e.ordem,
            series: e.series,
            repeticoes: e.repeticoes,
            descanso: e.descanso_segundos || e.descanso || 45,
            carga_sugerida: e.carga_sugerida,
            is_superset: e.is_superset,
            superset_with: e.superset_with,
            notas: e.notas
          }))

          return {
            id: t.id,
            nome: t.nome,
            tipo: t.tipo as WorkoutType,
            fase: (t.fase || 'base') as WorkoutPhase,
            dia_semana: t.dia_semana,
            duracao_estimada: t.duracao_estimada_min || t.duracao_estimada || 60,
            rodadas: t.rodadas,
            descanso_rodada: t.descanso_rodada,
            exercicios: exercises
          }
        })
      )

      setTemplates(templatesWithExercises)
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch templates'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createTemplate = useCallback(async (template: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Create template
    const { data: newTemplate, error: templateError } = await (supabase as AnyTable)
      .from('fitness_workout_templates')
      .insert({
        user_id: user.id,
        nome: template.nome,
        tipo: template.tipo,
        fase: template.fase,
        dia_semana: template.dia_semana,
        duracao_estimada_min: template.duracao_estimada,
        is_ativo: true
      })
      .select()
      .single()

    if (templateError) throw templateError

    // Create exercises
    if (template.exercicios.length > 0) {
      const exercisesToInsert = template.exercicios.map((e, index) => ({
        template_id: newTemplate.id,
        exercise_id: e.exercise_id,
        exercicio_nome: e.nome,
        ordem: index,
        series: e.series,
        repeticoes: e.repeticoes,
        descanso_segundos: e.descanso,
        carga_sugerida: e.carga_sugerida,
        unidade_carga: 'kg',
        is_superset: e.is_superset || false,
        notas: e.notas
      }))

      const { error: exercisesError } = await (supabase as AnyTable)
        .from('fitness_workout_template_exercises')
        .insert(exercisesToInsert)

      if (exercisesError) throw exercisesError
    }

    const createdTemplate: WorkoutTemplate = {
      ...template,
      id: newTemplate.id
    }

    setTemplates(prev => [...prev, createdTemplate])
    return createdTemplate
  }, [supabase])

  const updateTemplate = useCallback(async (id: string, template: Partial<WorkoutTemplate>) => {
    const { error } = await (supabase as AnyTable)
      .from('fitness_workout_templates')
      .update({
        nome: template.nome,
        tipo: template.tipo,
        fase: template.fase,
        dia_semana: template.dia_semana,
        duracao_estimada_min: template.duracao_estimada,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, ...template } : t
    ))
  }, [supabase])

  const deleteTemplate = useCallback(async (id: string) => {
    // Soft delete - mark as inactive
    const { error } = await (supabase as AnyTable)
      .from('fitness_workout_templates')
      .update({ is_ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [supabase])

  const duplicateTemplate = useCallback(async (id: string): Promise<WorkoutTemplate> => {
    const template = templates.find(t => t.id === id)
    if (!template) throw new Error('Template não encontrado')

    const newTemplate = await createTemplate({
      ...template,
      nome: `${template.nome} (cópia)`
    })

    return newTemplate
  }, [templates, createTemplate])

  const getTemplateById = useCallback(async (id: string): Promise<WorkoutTemplate | null> => {
    // First check local state
    const local = templates.find(t => t.id === id)
    if (local) return local

    // Fetch from database
    const { data: templateData, error: templateError } = await (supabase as AnyTable)
      .from('fitness_workout_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (templateError || !templateData) return null

    const { data: exercisesData } = await (supabase as AnyTable)
      .from('fitness_workout_template_exercises')
      .select('*')
      .eq('template_id', id)
      .order('ordem', { ascending: true })

    const exercises: TemplateExercise[] = (exercisesData || []).map((e: SupabaseRow) => ({
      id: e.id,
      exercise_id: e.exercise_id,
      nome: e.exercicio_nome || e.nome,
      ordem: e.ordem,
      series: e.series,
      repeticoes: e.repeticoes,
      descanso: e.descanso_segundos || e.descanso || 45,
      carga_sugerida: e.carga_sugerida,
      is_superset: e.is_superset,
      superset_with: e.superset_with,
      notas: e.notas
    }))

    return {
      id: templateData.id,
      nome: templateData.nome,
      tipo: templateData.tipo as WorkoutType,
      fase: (templateData.fase || 'base') as WorkoutPhase,
      dia_semana: templateData.dia_semana,
      duracao_estimada: templateData.duracao_estimada_min || templateData.duracao_estimada || 60,
      rodadas: templateData.rodadas,
      descanso_rodada: templateData.descanso_rodada,
      exercicios: exercises
    }
  }, [templates, supabase])

  const addExerciseToTemplate = useCallback(async (templateId: string, exercise: Omit<TemplateExercise, 'id'>) => {
    const { data, error } = await (supabase as AnyTable)
      .from('fitness_workout_template_exercises')
      .insert({
        template_id: templateId,
        exercise_id: exercise.exercise_id,
        exercicio_nome: exercise.nome,
        ordem: exercise.ordem,
        series: exercise.series,
        repeticoes: exercise.repeticoes,
        descanso_segundos: exercise.descanso,
        carga_sugerida: exercise.carga_sugerida,
        unidade_carga: 'kg',
        is_superset: exercise.is_superset || false,
        notas: exercise.notas
      })
      .select()
      .single()

    if (error) throw error

    const newExercise: TemplateExercise = {
      ...exercise,
      id: data.id
    }

    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return { ...t, exercicios: [...t.exercicios, newExercise] }
      }
      return t
    }))
  }, [supabase])

  const updateExercise = useCallback(async (templateId: string, exerciseId: string, exercise: Partial<TemplateExercise>) => {
    const { error } = await (supabase as AnyTable)
      .from('fitness_workout_template_exercises')
      .update({
        exercicio_nome: exercise.nome,
        series: exercise.series,
        repeticoes: exercise.repeticoes,
        descanso_segundos: exercise.descanso,
        carga_sugerida: exercise.carga_sugerida,
        is_superset: exercise.is_superset || false,
        notas: exercise.notas
      })
      .eq('id', exerciseId)

    if (error) throw error

    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          exercicios: t.exercicios.map(e =>
            e.id === exerciseId ? { ...e, ...exercise } : e
          )
        }
      }
      return t
    }))
  }, [supabase])

  const removeExerciseFromTemplate = useCallback(async (templateId: string, exerciseId: string) => {
    const { error } = await (supabase as AnyTable)
      .from('fitness_workout_template_exercises')
      .delete()
      .eq('id', exerciseId)

    if (error) throw error

    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          exercicios: t.exercicios.filter(e => e.id !== exerciseId)
        }
      }
      return t
    }))
  }, [supabase])

  const reorderExercises = useCallback(async (templateId: string, exerciseIds: string[]) => {
    // Update order in database
    const updates = exerciseIds.map((id, index) =>
      (supabase as AnyTable)
        .from('fitness_workout_template_exercises')
        .update({ ordem: index })
        .eq('id', id)
    )

    await Promise.all(updates)

    // Update local state
    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        const reordered = exerciseIds
          .map(id => t.exercicios.find(e => e.id === id))
          .filter((e): e is TemplateExercise => e !== undefined)
          .map((e, index) => ({ ...e, ordem: index }))
        return { ...t, exercicios: reordered }
      }
      return t
    }))
  }, [supabase])

  const refresh = useCallback(async () => {
    await fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplateById,
    addExerciseToTemplate,
    updateExercise,
    removeExerciseFromTemplate,
    reorderExercises,
    refresh
  }
}
