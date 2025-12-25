// Coach context builder - gathers all user data for AI context
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/client'
import { getTodayDateSP, getNowSaoPaulo } from '@/lib/utils/date'
import type { UserContext } from '@/types/coach'

function today(): string {
  return getTodayDateSP()
}

function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  const now = getNowSaoPaulo()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

interface MealItem {
  calorias: number
  proteina: number
  carboidratos: number
  gordura: number
}

interface Meal {
  itens?: MealItem[]
}

function calculateTodayNutrition(meals: Meal[]): {
  calorias: number
  proteina: number
  carboidratos: number
  gordura: number
} {
  let calorias = 0
  let proteina = 0
  let carboidratos = 0
  let gordura = 0

  for (const meal of meals) {
    if (meal.itens) {
      for (const item of meal.itens) {
        calorias += item.calorias || 0
        proteina += item.proteina || 0
        carboidratos += item.carboidratos || 0
        gordura += item.gordura || 0
      }
    }
  }

  return { calorias, proteina, carboidratos, gordura }
}

export async function buildUserContext(userId: string): Promise<UserContext> {
  const supabase = createClient()
  const todayStr = today()

  // Calculate week range com timezone de São Paulo
  const nowSP = getNowSaoPaulo()
  const weekStart = new Date(nowSP)
  weekStart.setDate(weekStart.getDate() - 7)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('*')
      .eq('id', userId)
      .single() as { data: any }

    // Fetch today's workout
    const { data: todayWorkout } = await supabase
      .from('treino_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('data', todayStr)
      .single() as { data: any }

    // Fetch today's meals
    const { data: todayMeals } = await supabase
      .from('refeicoes')
      .select('*, itens:refeicao_itens(*)')
      .eq('user_id', userId)
      .eq('data', todayStr) as { data: any[] }

    // Fetch today's water
    const { data: todayWater } = await supabase
      .from('agua_logs')
      .select('quantidade_ml')
      .eq('user_id', userId)
      .eq('data', todayStr) as { data: { quantidade_ml?: number }[] }

    // Fetch last sleep
    const { data: lastSleep } = await supabase
      .from('sono_logs')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(1)
      .single() as { data: any }

    // Fetch today's recovery check-in
    const { data: todayRecovery } = await supabase
      .from('recuperacao_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('data', todayStr)
      .single() as { data: any }

    // Fetch today's supplements
    const { data: todaySupplements } = await supabase
      .from('suplemento_logs')
      .select('*, suplemento:suplementos(nome)')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .eq('taken', true) as { data: { suplemento?: { nome?: string } }[] }

    // Fetch week workouts count
    const { data: weekWorkouts } = await supabase
      .from('treino_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('data', weekStartStr)
      .lte('data', todayStr) as { data: any[] }

    // Fetch last body composition
    const { data: lastBody } = await supabase
      .from('corpo_medicoes')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(1)
      .single() as { data: any }

    // Fetch gamification data
    const { data: gamification } = await supabase
      .from('gamificacao')
      .select('*')
      .eq('user_id', userId)
      .single() as { data: any }

    // Fetch recent PRs
    const { data: recentPRs } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(5) as { data: any[] }

    // Calculate totals
    const nutrition = calculateTodayNutrition(todayMeals || [])
    const waterTotal = (todayWater || []).reduce((sum: number, w: { quantidade_ml?: number }) => sum + (w.quantidade_ml || 0), 0)

    // Check Revolade
    const revoladeTomado = (todaySupplements || []).some(
      (s: { suplemento?: { nome?: string } }) => s.suplemento?.nome?.toLowerCase().includes('revolade')
    )

    // Calculate days to objective (ski trip: March 12, 2026)
    const objetivoDate = new Date('2026-03-12')
    const diasParaObjetivo = Math.ceil(
      (objetivoDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    // Build context
    return {
      user: {
        nome: profile?.nome || 'Usuário',
        idade: calculateAge(profile?.data_nascimento),
        altura: profile?.altura || 175,
        pesoAtual: lastBody?.peso || profile?.peso || 75,
        pesoMeta: profile?.peso_meta || 75,
        condicaoMedica: profile?.condicao_medica || 'PTI',
        objetivoPrincipal: profile?.objetivo_principal || 'ski_suica',
      },
      metas: {
        calorias: profile?.meta_calorias || 2500,
        proteina: profile?.meta_proteina || 170,
        carboidratos: profile?.meta_carboidratos || 280,
        gordura: profile?.meta_gordura || 85,
        agua: profile?.meta_agua || 3000,
        treinosSemana: profile?.meta_treinos_semana || 6,
        sono: profile?.meta_sono || 7,
      },
      hoje: {
        data: todayStr,
        treino: todayWorkout
          ? {
              nome: todayWorkout.nome || 'Treino',
              duracao: todayWorkout.duracao || 0,
              exercicios: todayWorkout.exercicios_count || 0,
            }
          : null,
        calorias: nutrition.calorias,
        proteina: nutrition.proteina,
        carboidratos: nutrition.carboidratos,
        gordura: nutrition.gordura,
        agua: waterTotal,
        sono: lastSleep
          ? {
              duracao: lastSleep.duracao_minutos ? lastSleep.duracao_minutos / 60 : 0,
              qualidade: lastSleep.qualidade || 0,
            }
          : null,
        recuperacao: todayRecovery
          ? {
              score: todayRecovery.score || 0,
              energia: todayRecovery.energia || 0,
              dor: todayRecovery.dor_muscular || 0,
              stress: todayRecovery.stress || 0,
            }
          : null,
        revoladeTomado,
        suplementosTomados: (todaySupplements || [])
          .map((s) => s.suplemento?.nome)
          .filter(Boolean) as string[],
      },
      semana: {
        treinosRealizados: weekWorkouts?.length || 0,
        mediaProteina: 0, // Simplified
        mediaAgua: 0, // Simplified
        mediaSono: 0, // Simplified
        scoreMedia: 0, // Simplified
      },
      corpo: {
        ultimaMedicao: lastBody?.data || 'N/A',
        peso: lastBody?.peso || 0,
        musculo: lastBody?.massa_muscular || 0,
        gordura: lastBody?.percentual_gordura || 0,
        score: lastBody?.inbody_score || 0,
      },
      gamificacao: {
        nivel: gamification?.nivel || 1,
        xp: gamification?.xp || 0,
        streak: gamification?.streak || 0,
        conquistasRecentes: [],
      },
      prs: (recentPRs || []).map((pr) => ({
        exercicio: pr.exercicio || '',
        peso: pr.peso || 0,
        data: pr.data || '',
      })),
      diasParaObjetivo,
    }
  } catch (error) {
    console.error('Error building user context:', error)
    // Return minimal context on error
    return getDefaultContext()
  }
}

function getDefaultContext(): UserContext {
  return {
    user: {
      nome: 'Usuário',
      idade: 30,
      altura: 175,
      pesoAtual: 75,
      pesoMeta: 75,
      condicaoMedica: '',
      objetivoPrincipal: '',
    },
    metas: {
      calorias: 2500,
      proteina: 170,
      carboidratos: 280,
      gordura: 85,
      agua: 3000,
      treinosSemana: 5,
      sono: 7,
    },
    hoje: {
      data: today(),
      treino: null,
      calorias: 0,
      proteina: 0,
      carboidratos: 0,
      gordura: 0,
      agua: 0,
      sono: null,
      recuperacao: null,
      revoladeTomado: false,
      suplementosTomados: [],
    },
    semana: {
      treinosRealizados: 0,
      mediaProteina: 0,
      mediaAgua: 0,
      mediaSono: 0,
      scoreMedia: 0,
    },
    corpo: {
      ultimaMedicao: 'N/A',
      peso: 0,
      musculo: 0,
      gordura: 0,
      score: 0,
    },
    gamificacao: {
      nivel: 1,
      xp: 0,
      streak: 0,
      conquistasRecentes: [],
    },
    prs: [],
    diasParaObjetivo: 0,
  }
}
