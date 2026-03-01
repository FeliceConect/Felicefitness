'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  AppSettings,
  Goals,
  WorkoutPreferences,
  NutritionPreferences,
  AppearanceSettings,
  PrivacySettings,
  UseSettingsReturn
} from '@/types/settings'
import { defaultSettings } from '@/lib/settings/defaults'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Fetch from fitness_profiles
      const { data, error: fetchError } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        const profile = data as SupabaseRow

        // Build settings from profile fields
        const loadedSettings: AppSettings = {
          goals: {
            calorias: profile.meta_calorias_diarias ?? defaultSettings.goals.calorias,
            proteina: profile.meta_proteina_g ?? defaultSettings.goals.proteina,
            carboidratos: profile.meta_carboidrato_g ?? defaultSettings.goals.carboidratos,
            gordura: profile.meta_gordura_g ?? defaultSettings.goals.gordura,
            agua: profile.meta_agua_ml ?? defaultSettings.goals.agua,
            treinos_semana: profile.meta_treinos_semana ?? defaultSettings.goals.treinos_semana,
            minutos_treino: profile.meta_minutos_treino ?? defaultSettings.goals.minutos_treino,
            peso_meta: profile.meta_peso ?? defaultSettings.goals.peso_meta,
            gordura_meta: profile.meta_percentual_gordura ?? defaultSettings.goals.gordura_meta,
            musculo_meta: profile.meta_massa_muscular ?? defaultSettings.goals.musculo_meta,
            horas_sono: profile.meta_horas_sono ?? defaultSettings.goals.horas_sono
          },
          // Use JSON fields if they exist, otherwise use defaults
          workout: profile.config_workout ?? defaultSettings.workout,
          nutrition: profile.config_nutrition ?? defaultSettings.nutrition,
          notifications: profile.config_notifications ?? defaultSettings.notifications,
          appearance: profile.config_appearance ?? defaultSettings.appearance,
          privacy: profile.config_privacy ?? defaultSettings.privacy
        }

        setSettings(loadedSettings)
      } else {
        // Use defaults if no profile
        setSettings(defaultSettings)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch settings'))
      // Use defaults on error
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Build update object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      }

      // Map goals to individual columns
      if (newSettings.goals) {
        const g = newSettings.goals
        if (g.calorias !== undefined) updateData.meta_calorias_diarias = g.calorias
        if (g.proteina !== undefined) updateData.meta_proteina_g = g.proteina
        if (g.carboidratos !== undefined) updateData.meta_carboidrato_g = g.carboidratos
        if (g.gordura !== undefined) updateData.meta_gordura_g = g.gordura
        if (g.agua !== undefined) updateData.meta_agua_ml = g.agua
        if (g.peso_meta !== undefined) updateData.meta_peso = g.peso_meta
        if (g.gordura_meta !== undefined) updateData.meta_percentual_gordura = g.gordura_meta
        if (g.musculo_meta !== undefined) updateData.meta_massa_muscular = g.musculo_meta
      }

      // Store other settings as JSON (these columns may not exist yet)
      if (newSettings.workout) updateData.config_workout = newSettings.workout
      if (newSettings.nutrition) updateData.config_nutrition = newSettings.nutrition
      if (newSettings.notifications) updateData.config_notifications = newSettings.notifications
      if (newSettings.appearance) updateData.config_appearance = newSettings.appearance
      if (newSettings.privacy) updateData.config_privacy = newSettings.privacy

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('fitness_profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setSettings(prev => prev ? { ...prev, ...newSettings } : null)
    } catch (err) {
      console.error('Error saving settings:', err)
      throw err
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    await saveSettings(newSettings)
  }, [saveSettings])

  const updateGoals = useCallback(async (goals: Partial<Goals>) => {
    const updatedGoals = { ...settings?.goals, ...goals } as Goals
    await saveSettings({ goals: updatedGoals })
  }, [settings, saveSettings])

  const updateWorkoutPreferences = useCallback(async (workout: Partial<WorkoutPreferences>) => {
    const updatedWorkout = { ...settings?.workout, ...workout } as WorkoutPreferences
    await saveSettings({ workout: updatedWorkout })
  }, [settings, saveSettings])

  const updateNutritionPreferences = useCallback(async (nutrition: Partial<NutritionPreferences>) => {
    const updatedNutrition = { ...settings?.nutrition, ...nutrition } as NutritionPreferences
    await saveSettings({ nutrition: updatedNutrition })
  }, [settings, saveSettings])

  const updateAppearance = useCallback(async (appearance: Partial<AppearanceSettings>) => {
    const updatedAppearance = { ...settings?.appearance, ...appearance } as AppearanceSettings
    await saveSettings({ appearance: updatedAppearance })
  }, [settings, saveSettings])

  const updatePrivacy = useCallback(async (privacy: Partial<PrivacySettings>) => {
    const updatedPrivacy = { ...settings?.privacy, ...privacy } as PrivacySettings
    await saveSettings({ privacy: updatedPrivacy })
  }, [settings, saveSettings])

  const resetToDefaults = useCallback(async () => {
    await saveSettings(defaultSettings)
  }, [saveSettings])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    await fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateGoals,
    updateWorkoutPreferences,
    updateNutritionPreferences,
    updateAppearance,
    updatePrivacy,
    resetToDefaults,
    refresh
  }
}
