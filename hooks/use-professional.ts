"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Professional {
  id: string
  user_id: string
  type: 'nutritionist' | 'trainer' | 'coach' | 'physiotherapist'
  registration: string | null
  specialty: string | null
  bio: string | null
  max_clients: number
  is_active: boolean
  avatar_url: string | null
  display_name: string | null
}

export function useProfessional() {
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)

  useEffect(() => {
    async function checkProfessional() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setUserEmail(user.email || null)

        // Verificar se é super_admin
        const { data: profile } = await supabase
          .from('fitness_profiles')
          .select('role, nome')
          .eq('id', user.id)
          .single()

        if (profile?.nome) {
          setProfileName(profile.nome)
        }

        if (profile?.role === 'super_admin') {
          setIsSuperAdmin(true)
        }

        // Buscar registro de profissional
        const response = await fetch('/api/professional/me')
        const data = await response.json()

        if (data.success && data.professional) {
          setProfessional(data.professional)
        }
      } catch (err) {
        console.error('Erro ao verificar profissional:', err)
        setError('Erro ao verificar dados do profissional')
      } finally {
        setLoading(false)
      }
    }

    checkProfessional()
  }, [])

  return {
    professional,
    loading,
    error,
    isSuperAdmin,
    userEmail,
    profileName,
    isProfessional: !!professional || isSuperAdmin,
    isNutritionist: professional?.type === 'nutritionist',
    isTrainer: professional?.type === 'trainer',
    isCoach: professional?.type === 'coach',
    isPhysiotherapist: professional?.type === 'physiotherapist',
    isActive: professional?.is_active ?? isSuperAdmin
  }
}
