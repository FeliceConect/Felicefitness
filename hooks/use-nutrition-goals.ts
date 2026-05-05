'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateNutritionGoals } from '@/lib/nutrition/macros-calculator'
import type { NutritionGoals } from '@/lib/nutrition/types'

interface ProfileRow {
  meta_calorias_diarias?: number | null
  meta_proteina_g?: number | null
  meta_carboidrato_g?: number | null
  meta_gordura_g?: number | null
  meta_agua_ml?: number | null
  sexo?: string | null
  altura_cm?: number | null
  peso_atual?: number | null
  data_nascimento?: string | null
  nivel_atividade?: string | null
  objetivo?: string | null
}

interface MealPlanRow {
  calories_target?: number | null
  protein_target?: number | null
  carbs_target?: number | null
  fat_target?: number | null
}

interface BioRow {
  peso?: number | null
  massa_livre_gordura_kg?: number | null
  taxa_metabolica_basal?: number | null
}

/**
 * Retorna as metas nutricionais respeitando a cadeia:
 * plano alimentar → perfil → cálculo dinâmico → fallback.
 *
 * Lê profile, plano ativo e bioimpedância mais recente em paralelo.
 */
export function useNutritionGoals(): { goals: NutritionGoals; loading: boolean } {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlanRow | null>(null)
  const [bio, setBio] = useState<BioRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const [profileRes, planRes, bioRes] = await Promise.all([
        sb
          .from('fitness_profiles')
          .select('meta_calorias_diarias, meta_proteina_g, meta_carboidrato_g, meta_gordura_g, meta_agua_ml, sexo, altura_cm, peso_atual, data_nascimento, nivel_atividade, objetivo')
          .eq('id', user.id)
          .single(),
        sb
          .from('fitness_meal_plans')
          .select('calories_target, protein_target, carbs_target, fat_target')
          .eq('client_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb
          .from('fitness_body_compositions')
          .select('peso, massa_livre_gordura_kg, taxa_metabolica_basal')
          .eq('user_id', user.id)
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return
      setProfile(profileRes.data ?? null)
      setMealPlan(planRes.data ?? null)
      setBio(bioRes.data ?? null)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const goals = useMemo(
    () => calculateNutritionGoals({ profile, mealPlan, bioimpedance: bio }),
    [profile, mealPlan, bio]
  )

  return { goals, loading }
}
