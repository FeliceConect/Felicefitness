'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, ProfileStats, UseProfileReturn } from '@/types/settings'

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // If no profile, create default
      if (!profileData) {
        const defaultProfile: Partial<UserProfile> = {
          id: user.id,
          nome: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          nivel: 1,
          xp_total: 0,
          titulo: 'Iniciante',
          streak_atual: 0
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newProfile } = await (supabase as any)
          .from('fitness_profiles')
          .insert(defaultProfile)
          .select()
          .single()

        setProfile(newProfile as UserProfile)
      } else {
        setProfile(profileData as UserProfile)
      }

      // Fetch stats
      await fetchStats(user.id)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStats = async (userId: string) => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthStr = startOfMonth.toISOString().split('T')[0]

      const [
        workoutsTotal,
        workoutsMonth,
        prsTotal,
        achievements,
        photos
      ] = await Promise.all([
        supabase.from('fitness_workouts').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'concluido'),
        supabase.from('fitness_workouts').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'concluido').gte('data', monthStr),
        supabase.from('fitness_personal_records').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('fitness_achievements_users').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('fitness_progress_photos').select('id', { count: 'exact' }).eq('user_id', userId)
      ])

      // Get streak from profile
      const streakAtual = profile?.streak_atual || 0

      setStats({
        treinos_total: workoutsTotal.count || 0,
        treinos_mes: workoutsMonth.count || 0,
        prs_total: prsTotal.count || 0,
        dias_registrados: workoutsTotal.count || 0,
        streak_maximo: streakAtual,
        conquistas: achievements.count || 0,
        fotos: photos.count || 0
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!profile) return

    try {
      // Build update payload with only valid database columns
      // Database columns: id, nome, email, data_nascimento, sexo, altura_cm, peso_atual,
      // objetivo, nivel_atividade, meta_*, hora_acordar, hora_dormir, usa_medicamento_jejum,
      // medicamento_*, streak_atual, maior_streak, pontos_totais, foto_url, config_*
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyData = data as any

      // Map valid fields to database columns
      if (anyData.nome !== undefined) updatePayload.nome = anyData.nome
      if (anyData.data_nascimento !== undefined) updatePayload.data_nascimento = anyData.data_nascimento
      if (anyData.sexo !== undefined) updatePayload.sexo = anyData.sexo
      if (anyData.foto_url !== undefined) updatePayload.foto_url = anyData.foto_url
      if (anyData.objetivo !== undefined) updatePayload.objetivo = anyData.objetivo
      if (anyData.altura_cm !== undefined) updatePayload.altura_cm = anyData.altura_cm
      if (anyData.peso_atual !== undefined) updatePayload.peso_atual = anyData.peso_atual
      if (anyData.meta_peso !== undefined) updatePayload.meta_peso = anyData.meta_peso
      if (anyData.streak_atual !== undefined) updatePayload.streak_atual = anyData.streak_atual
      if (anyData.maior_streak !== undefined) updatePayload.maior_streak = anyData.maior_streak
      if (anyData.pontos_totais !== undefined) updatePayload.pontos_totais = anyData.pontos_totais
      if (anyData.hora_acordar !== undefined) updatePayload.hora_acordar = anyData.hora_acordar
      if (anyData.hora_dormir !== undefined) updatePayload.hora_dormir = anyData.hora_dormir

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('fitness_profiles')
        .update(updatePayload)
        .eq('id', profile.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...data } : null)
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const updatePhoto = useCallback(async (file: File): Promise<string> => {
    if (!profile) throw new Error('Profile not loaded')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/avatar.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      // Update profile
      await updateProfile({ foto_url: publicUrl })

      return publicUrl
    } catch (err) {
      console.error('Error uploading photo:', err)
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, updateProfile])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    stats,
    loading,
    error,
    updateProfile,
    updatePhoto,
    refresh
  }
}
