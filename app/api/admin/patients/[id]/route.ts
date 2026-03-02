import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é super_admin ou admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: callerProfile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !['super_admin', 'admin'].includes(callerProfile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Datas de referência
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    // Bloco 1 — Perfil + Equipe + Consultas
    // Bloco 2 — Tracking diário (30 dias)
    // Bloco 3 — Corpo + Formulários + Notas + Extras
    const [
      profileResult,
      assignmentsResult,
      appointmentsResult,
      mealsResult,
      workoutsResult,
      waterResult,
      sleepResult,
      bodyCompResult,
      lastBioResult,
      formAssignmentsResult,
      notesResult,
      photosResult,
      rankingResult,
      prsResult,
      mealPlanResult,
      trainingProgramResult,
      pointsResult,
    ] = await Promise.all([
      // Perfil completo
      supabaseAdmin
        .from('fitness_profiles')
        .select('*')
        .eq('id', patientId)
        .single(),

      // Equipe profissional
      supabaseAdmin
        .from('fitness_client_assignments')
        .select('id, professional_id, assigned_at, notes, is_active')
        .eq('client_id', patientId)
        .eq('is_active', true),

      // Consultas (todas)
      supabaseAdmin
        .from('fitness_appointments')
        .select('id, professional_id, appointment_type, date, start_time, end_time, location, status, notes, reschedule_reason, created_at')
        .eq('patient_id', patientId)
        .order('date', { ascending: false }),

      // Refeições (30 dias)
      supabaseAdmin
        .from('fitness_meals')
        .select('id, tipo_refeicao, calorias_total, proteinas_total, carboidratos_total, gorduras_total, data, horario')
        .eq('user_id', patientId)
        .gte('data', thirtyDaysAgoStr)
        .order('data', { ascending: false })
        .limit(100),

      // Treinos (30 dias)
      supabaseAdmin
        .from('fitness_workouts')
        .select('id, nome, tipo, duracao_minutos, calorias_estimadas, data')
        .eq('user_id', patientId)
        .gte('data', thirtyDaysAgoStr)
        .order('data', { ascending: false })
        .limit(100),

      // Hidratação (30 dias)
      supabaseAdmin
        .from('fitness_water_logs')
        .select('id, data, quantidade_ml, quantidade')
        .eq('user_id', patientId)
        .gte('data', thirtyDaysAgoStr)
        .order('data', { ascending: false }),

      // Sono (30 dias)
      supabaseAdmin
        .from('fitness_sleep_logs')
        .select('id, data, duracao_minutos, duracao, qualidade, hora_dormir, hora_acordar')
        .eq('user_id', patientId)
        .gte('data', thirtyDaysAgoStr)
        .order('data', { ascending: false }),

      // Composição corporal (últimas 10)
      supabaseAdmin
        .from('fitness_body_compositions')
        .select('id, data, peso, massa_muscular, gordura_corporal, gordura_percentual')
        .eq('user_id', patientId)
        .order('data', { ascending: false })
        .limit(10),

      // Última bioimpedância completa
      supabaseAdmin
        .from('fitness_body_compositions')
        .select('*')
        .eq('user_id', patientId)
        .not('impedancia_dados', 'is', null)
        .order('data', { ascending: false })
        .limit(1),

      // Formulários (últimos 10) com template e profissional
      supabaseAdmin
        .from('fitness_form_assignments')
        .select('id, template_id, professional_id, client_id, status, due_date, sent_at, completed_at')
        .eq('client_id', patientId)
        .order('sent_at', { ascending: false })
        .limit(10),

      // Notas profissionais (últimas 20)
      supabaseAdmin
        .from('fitness_professional_notes')
        .select('id, professional_id, note_type, content, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20),

      // Fotos de progresso (últimas 6)
      supabaseAdmin
        .from('fitness_progress_photos')
        .select('id, data, tipo, foto_url, peso_no_dia')
        .eq('user_id', patientId)
        .order('data', { ascending: false })
        .limit(6),

      // Ranking (posição no ranking ativo)
      supabaseAdmin
        .from('fitness_ranking_participants')
        .select('id, ranking_id, total_points, current_position')
        .eq('user_id', patientId)
        .order('joined_at', { ascending: false })
        .limit(1),

      // PRs (contagem)
      supabaseAdmin
        .from('fitness_personal_records')
        .select('id', { count: 'exact' })
        .eq('user_id', patientId),

      // Plano alimentar ativo
      supabaseAdmin
        .from('fitness_meal_plans')
        .select('id, name, description, goal, calories_target, protein_target, carbs_target, fat_target, starts_at, ends_at, is_active')
        .eq('client_id', patientId)
        .eq('is_active', true)
        .limit(1),

      // Programa de treino ativo
      supabaseAdmin
        .from('fitness_training_programs')
        .select('id, name, description, goal, difficulty, duration_weeks, days_per_week, starts_at, ends_at, is_active')
        .eq('client_id', patientId)
        .eq('is_active', true)
        .limit(1),

      // Transações de pontos (últimas 10)
      supabaseAdmin
        .from('fitness_point_transactions')
        .select('id, points, reason, category, source, created_at')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const profile = profileResult.data
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados dos profissionais vinculados
    const assignments = assignmentsResult.data || []
    const professionalIds = assignments.map((a: { professional_id: string }) => a.professional_id)
    const professionalsMap: Record<string, { display_name: string | null; type: string; specialty: string | null; user_id: string }> = {}

    if (professionalIds.length > 0) {
      const { data: professionals } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, display_name, type, specialty, user_id')
        .in('id', professionalIds)

      if (professionals) {
        const profUserIds = professionals.map((p: { user_id: string }) => p.user_id)
        const { data: profProfiles } = await supabaseAdmin
          .from('fitness_profiles')
          .select('id, nome')
          .in('id', profUserIds)

        const profProfileMap: Record<string, string> = {}
        if (profProfiles) {
          for (const pp of profProfiles) {
            profProfileMap[pp.id] = pp.nome || ''
          }
        }

        for (const p of professionals) {
          professionalsMap[p.id] = {
            display_name: p.display_name || profProfileMap[p.user_id] || 'Profissional',
            type: p.type,
            specialty: p.specialty,
            user_id: p.user_id,
          }
        }
      }
    }

    // Buscar nomes de profissionais para consultas e notas
    const appointmentProfIds = Array.from(new Set((appointmentsResult.data || []).map((a: { professional_id: string }) => a.professional_id)))
    const notesProfIds = Array.from(new Set((notesResult.data || []).map((n: { professional_id: string }) => n.professional_id)))
    const allProfIds = Array.from(new Set([...appointmentProfIds, ...notesProfIds, ...professionalIds]))

    const allProfMap: Record<string, { name: string; type: string }> = {}
    if (allProfIds.length > 0) {
      const { data: allProfs } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, display_name, type, user_id')
        .in('id', allProfIds)

      if (allProfs) {
        const allProfUserIds = allProfs.map((p: { user_id: string }) => p.user_id)
        const { data: allProfProfiles } = await supabaseAdmin
          .from('fitness_profiles')
          .select('id, nome')
          .in('id', allProfUserIds)

        const profNameMap: Record<string, string> = {}
        if (allProfProfiles) {
          for (const pp of allProfProfiles) {
            profNameMap[pp.id] = pp.nome || ''
          }
        }

        for (const p of allProfs) {
          allProfMap[p.id] = {
            name: p.display_name || profNameMap[p.user_id] || 'Profissional',
            type: p.type,
          }
        }
      }
    }

    // Buscar nomes dos templates de formulários
    const formAssignments = formAssignmentsResult.data || []
    const templateIds = Array.from(new Set(formAssignments.map((f: { template_id: string }) => f.template_id)))
    const templateMap: Record<string, string> = {}
    if (templateIds.length > 0) {
      const { data: templates } = await supabaseAdmin
        .from('fitness_form_templates')
        .select('id, name')
        .in('id', templateIds)

      if (templates) {
        for (const t of templates) {
          templateMap[t.id] = t.name
        }
      }
    }

    // === Calcular estatísticas ===

    // Refeições
    const meals = mealsResult.data || []
    const mealDays = new Set(meals.map((m: { data: string }) => m.data))
    const daysWithMeals = mealDays.size
    const totalCal = meals.reduce((s: number, m: { calorias_total: number | null }) => s + (m.calorias_total || 0), 0)
    const totalProt = meals.reduce((s: number, m: { proteinas_total: number | null }) => s + (m.proteinas_total || 0), 0)
    const totalCarbs = meals.reduce((s: number, m: { carboidratos_total: number | null }) => s + (m.carboidratos_total || 0), 0)
    const totalFat = meals.reduce((s: number, m: { gorduras_total: number | null }) => s + (m.gorduras_total || 0), 0)
    const avgCal = daysWithMeals > 0 ? Math.round(totalCal / daysWithMeals) : 0
    const avgProt = daysWithMeals > 0 ? Math.round(totalProt / daysWithMeals) : 0
    const avgCarbs = daysWithMeals > 0 ? Math.round(totalCarbs / daysWithMeals) : 0
    const avgFatDay = daysWithMeals > 0 ? Math.round(totalFat / daysWithMeals) : 0

    // Treinos
    const workouts = workoutsResult.data || []
    const totalWorkoutMin = workouts.reduce((s: number, w: { duracao_minutos: number | null }) => s + (w.duracao_minutos || 0), 0)
    const totalCalBurned = workouts.reduce((s: number, w: { calorias_estimadas: number | null }) => s + (w.calorias_estimadas || 0), 0)
    const avgWorkoutMin = workouts.length > 0 ? Math.round(totalWorkoutMin / workouts.length) : 0

    // Hidratação
    const water = waterResult.data || []
    const waterByDay: Record<string, number> = {}
    for (const h of water) {
      const day = h.data as string
      const ml = (h.quantidade_ml as number) || (h.quantidade as number) || 0
      waterByDay[day] = (waterByDay[day] || 0) + ml
    }
    const waterDays = Object.keys(waterByDay).length
    const totalWater = Object.values(waterByDay).reduce((s, v) => s + v, 0)
    const avgWater = waterDays > 0 ? Math.round(totalWater / waterDays) : 0
    const waterGoal = (profile.meta_agua as number) || 2500
    const waterGoalDays = Object.values(waterByDay).filter(ml => ml >= waterGoal).length

    // Sono
    const sleepRecords = sleepResult.data || []
    const totalSleepMin = sleepRecords.reduce((s: number, r: Record<string, unknown>) => {
      return s + ((r.duracao_minutos as number) || (r.duracao as number) || 0)
    }, 0)
    const avgSleepHours = sleepRecords.length > 0 ? +(totalSleepMin / sleepRecords.length / 60).toFixed(1) : 0
    const avgSleepQuality = sleepRecords.length > 0
      ? +(sleepRecords.reduce((s: number, r: Record<string, unknown>) => s + ((r.qualidade as number) || 0), 0) / sleepRecords.length).toFixed(1)
      : 0

    // Peso
    const bodyComp = bodyCompResult.data || []
    const currentWeight = profile.peso_atual
    const weightChange = bodyComp.length >= 2
      ? +((bodyComp[0].peso || 0) - (bodyComp[bodyComp.length - 1].peso || 0)).toFixed(1)
      : 0

    // Formulários contagem
    const formTotal = formAssignments.length
    const formPending = formAssignments.filter((f: { status: string }) => f.status === 'pending' || f.status === 'sent').length
    const formCompleted = formAssignments.filter((f: { status: string }) => f.status === 'completed').length

    return NextResponse.json({
      success: true,
      patient: {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        foto_url: profile.foto_url,
        data_nascimento: profile.data_nascimento,
        peso_atual: profile.peso_atual,
        altura_cm: profile.altura_cm,
        objetivo: profile.objetivo,
        genero: profile.genero,
        meta_calorias: profile.meta_calorias,
        meta_proteinas: profile.meta_proteinas,
        meta_carboidratos: profile.meta_carboidratos,
        meta_gorduras: profile.meta_gorduras,
        meta_agua: profile.meta_agua,
        streak_atual: profile.streak_atual,
        nivel: profile.nivel,
        xp_total: profile.xp_total,
        created_at: profile.created_at,
      },

      team: assignments.map((a: { professional_id: string; assigned_at: string }) => ({
        ...professionalsMap[a.professional_id],
        assigned_at: a.assigned_at,
      })),

      appointments: (appointmentsResult.data || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        type: a.appointment_type,
        date: a.date,
        start_time: a.start_time,
        end_time: a.end_time,
        location: a.location,
        status: a.status,
        notes: a.notes,
        reschedule_reason: a.reschedule_reason,
        professional: allProfMap[a.professional_id as string] || null,
      })),

      stats: {
        nutrition: {
          daysWithMeals,
          avgCalories: avgCal,
          avgProtein: avgProt,
          avgCarbs,
          avgFat: avgFatDay,
        },
        training: {
          totalWorkouts: workouts.length,
          avgDuration: avgWorkoutMin,
          totalCaloriesBurned: totalCalBurned,
          prsCount: prsResult.count || 0,
        },
        hydration: {
          avgDaily: avgWater,
          goalMl: waterGoal,
          daysGoalMet: waterGoalDays,
          totalDays: waterDays,
        },
        sleep: {
          avgHours: avgSleepHours,
          avgQuality: avgSleepQuality,
          totalDays: sleepRecords.length,
        },
        weight: {
          current: currentWeight,
          change30d: weightChange,
        },
        forms: {
          total: formTotal,
          pending: formPending,
          completed: formCompleted,
        },
      },

      recentMeals: meals.slice(0, 15).map((m: Record<string, unknown>) => ({
        id: m.id,
        tipo: m.tipo_refeicao,
        calorias: m.calorias_total,
        proteinas: m.proteinas_total,
        carboidratos: m.carboidratos_total,
        gorduras: m.gorduras_total,
        data: m.data,
        hora: m.horario,
      })),

      recentWorkouts: workouts.slice(0, 15).map((w: Record<string, unknown>) => ({
        id: w.id,
        nome: w.nome,
        tipo: w.tipo,
        duracao: w.duracao_minutos,
        calorias: w.calorias_estimadas,
        data: w.data,
      })),

      bodyComposition: bodyComp.map((b: Record<string, unknown>) => ({
        data: b.data,
        peso: b.peso,
        massa_muscular: b.massa_muscular,
        gordura_corporal: b.gordura_corporal,
        gordura_percentual: b.gordura_percentual,
      })),

      lastBioimpedance: lastBioResult.data?.[0] || null,

      progressPhotos: (photosResult.data || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        data: p.data,
        tipo: p.tipo,
        foto_url: p.foto_url,
        peso_no_dia: p.peso_no_dia,
      })),

      forms: formAssignments.map((f: Record<string, unknown>) => ({
        id: f.id,
        templateName: templateMap[f.template_id as string] || 'Formulário',
        professional: allProfMap[f.professional_id as string] || null,
        status: f.status,
        due_date: f.due_date,
        sent_at: f.sent_at,
        completed_at: f.completed_at,
      })),

      notes: (notesResult.data || []).map((n: Record<string, unknown>) => ({
        id: n.id,
        note_type: n.note_type,
        content: n.content,
        created_at: n.created_at,
        professional: allProfMap[n.professional_id as string] || null,
      })),

      notesByProfType: (() => {
        const grouped: Record<string, Array<{ id: string; note_type: string; content: string; created_at: string; professional: { name: string; type: string } | null }>> = {}
        for (const n of (notesResult.data || [])) {
          const prof = allProfMap[(n as Record<string, unknown>).professional_id as string] || null
          const profType = prof?.type || 'unknown'
          if (!grouped[profType]) grouped[profType] = []
          grouped[profType].push({
            id: (n as Record<string, unknown>).id as string,
            note_type: (n as Record<string, unknown>).note_type as string,
            content: (n as Record<string, unknown>).content as string,
            created_at: (n as Record<string, unknown>).created_at as string,
            professional: prof,
          })
        }
        return grouped
      })(),

      ranking: rankingResult.data?.[0] ? {
        position: rankingResult.data[0].current_position,
        totalPoints: rankingResult.data[0].total_points,
      } : null,

      mealPlan: mealPlanResult.data?.[0] || null,
      trainingProgram: trainingProgramResult.data?.[0] || null,

      pointTransactions: (pointsResult.data || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        points: p.points,
        reason: p.reason,
        category: p.category,
        source: p.source,
        created_at: p.created_at,
      })),
    })

  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
