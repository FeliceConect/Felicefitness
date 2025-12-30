import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Tipos
interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
  is_warmup?: boolean
  muscle_group?: string
  weight_suggestion?: string
  alternatives?: string[]
}

interface TrainingDay {
  day_of_week: number
  day_name: string
  name: string
  muscle_groups: string[]
  estimated_duration: number
  exercises: Exercise[]
  warmup_notes?: string
  cooldown_notes?: string
}

interface TrainingWeek {
  week_number: number
  name: string
  focus?: string
  days: TrainingDay[]
}

interface ParsedTrainingPlan {
  name: string
  description?: string
  goal?: string
  difficulty?: string
  duration_weeks: number
  days_per_week: number
  session_duration: number
  equipment_needed: string[]
  special_rules: Array<{
    rule: string
  }>
  prohibited_exercises?: Array<{
    exercise: string
    reason: string
    substitute?: string
  }>
  weeks: TrainingWeek[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Admin client for bypassing RLS
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

    // Check permissions
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.email === 'felicemed@gmail.com' || profile?.role === 'super_admin'

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    const isTrainer = professional?.type === 'trainer'

    if (!isSuperAdmin && !isTrainer) {
      return NextResponse.json(
        { error: 'Acesso restrito' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { plan, clientId, assignToSelf } = body as {
      plan: ParsedTrainingPlan
      clientId?: string
      assignToSelf?: boolean
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano de treinos nao fornecido' },
        { status: 400 }
      )
    }

    // Determinar o professional_id
    let professionalId = professional?.id

    // Se superadmin sem professional, criar um do tipo "admin"
    if (!professionalId && isSuperAdmin) {
      const { data: existingProf } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, type')
        .eq('user_id', user.id)
        .single()

      if (existingProf) {
        professionalId = existingProf.id
      } else {
        const { data: newProf, error: profError } = await supabaseAdmin
          .from('fitness_professionals')
          .insert({
            user_id: user.id,
            type: 'admin',
            specialty: 'Administrador do Sistema',
            is_active: false
          })
          .select('id')
          .single()

        if (profError) {
          console.error('Error creating admin professional:', profError)
          return NextResponse.json(
            { error: 'Erro ao criar registro administrativo', details: profError.message },
            { status: 500 }
          )
        }
        professionalId = newProf.id
      }
    }

    // Determinar client_id
    const targetClientId = assignToSelf ? user.id : clientId || null

    // Montar notas com regras especiais e exercicios proibidos
    let notes = ''
    if (plan.special_rules?.length > 0) {
      notes += 'REGRAS:\n' + plan.special_rules.map(r => `- ${r.rule}`).join('\n') + '\n\n'
    }
    if (plan.prohibited_exercises && plan.prohibited_exercises.length > 0) {
      notes += 'PROIBIDOS:\n' + plan.prohibited_exercises.map(e =>
        `- ${e.exercise}: ${e.reason}${e.substitute ? ` (usar: ${e.substitute})` : ''}`
      ).join('\n')
    }

    // Calcular datas de inicio e fim
    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + (plan.duration_weeks * 7))

    // Criar o programa principal
    const { data: program, error: programError } = await supabaseAdmin
      .from('fitness_training_programs')
      .insert({
        professional_id: professionalId,
        client_id: targetClientId,
        name: plan.name,
        description: plan.description,
        goal: plan.goal || 'custom',
        difficulty: plan.difficulty || 'intermediate',
        duration_weeks: plan.duration_weeks,
        days_per_week: plan.days_per_week,
        session_duration: plan.session_duration,
        equipment_needed: plan.equipment_needed || [],
        is_template: !targetClientId,
        is_active: true,
        starts_at: startsAt.toISOString().split('T')[0],
        ends_at: endsAt.toISOString().split('T')[0],
        notes
      })
      .select()
      .single()

    if (programError) {
      console.error('Error creating training program:', programError)
      return NextResponse.json(
        { error: 'Erro ao criar programa de treino', details: programError.message },
        { status: 500 }
      )
    }

    // Criar semanas, dias e exercicios
    for (const week of plan.weeks) {
      const { data: programWeek, error: weekError } = await supabaseAdmin
        .from('fitness_training_weeks')
        .insert({
          program_id: program.id,
          week_number: week.week_number,
          name: week.name,
          focus: week.focus,
          intensity_modifier: 1.0,
          notes: null
        })
        .select()
        .single()

      if (weekError) {
        console.error('Error creating week:', weekError)
        continue
      }

      // Criar dias da semana
      for (const day of week.days) {
        // Montar notas do dia
        let dayNotes = ''
        if (day.warmup_notes) {
          dayNotes += `Aquecimento: ${day.warmup_notes}\n`
        }
        if (day.cooldown_notes) {
          dayNotes += `Alongamento: ${day.cooldown_notes}`
        }

        const { data: trainingDay, error: dayError } = await supabaseAdmin
          .from('fitness_training_days')
          .insert({
            week_id: programWeek.id,
            day_of_week: day.day_of_week,
            day_number: day.day_of_week,
            name: day.name,
            muscle_groups: day.muscle_groups || [],
            estimated_duration: day.estimated_duration,
            warmup_notes: day.warmup_notes,
            cooldown_notes: day.cooldown_notes,
            notes: dayNotes || null,
            order_index: day.day_of_week
          })
          .select()
          .single()

        if (dayError) {
          console.error('Error creating day:', dayError)
          continue
        }

        // Criar exercicios do dia
        if (day.exercises && Array.isArray(day.exercises)) {
          for (let i = 0; i < day.exercises.length; i++) {
            const exercise = day.exercises[i]

            const { error: exerciseError } = await supabaseAdmin
              .from('fitness_training_exercises')
              .insert({
                training_day_id: trainingDay.id,
                exercise_name: exercise.name,
                exercise_category: exercise.is_warmup ? 'warmup' : 'main',
                muscle_group: exercise.muscle_group || day.muscle_groups?.[0] || null,
                sets: exercise.sets || 3,
                reps: exercise.reps || '12',
                rest_seconds: exercise.rest_seconds || 60,
                tempo: null,
                weight_suggestion: exercise.weight_suggestion || null,
                rpe_target: null,
                instructions: exercise.notes || null,
                video_url: null,
                alternatives: exercise.alternatives || [],
                is_dropset: false,
                is_warmup: exercise.is_warmup || false,
                order_index: i,
                notes: exercise.notes || null
              })

            if (exerciseError) {
              console.error('Error creating exercise:', exercise.name, exerciseError)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Plano de treinos salvo com sucesso',
      program_id: program.id,
      client_id: targetClientId
    })

  } catch (error) {
    console.error('Save training plan error:', error)
    return NextResponse.json({
      error: 'Erro interno ao salvar plano de treinos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
