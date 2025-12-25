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
  }, [supabase])

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('fitness_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...data } : null)
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    }
  }, [profile, supabase])

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
  }, [profile, supabase, updateProfile])

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
