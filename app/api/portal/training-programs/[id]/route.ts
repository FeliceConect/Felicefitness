// @ts-nocheck - Tipos do Supabase serao gerados apos rodar a migration
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar programa de treino completo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é personal trainer ou cliente do programa
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    // Buscar programa
    const { data: program, error: programError } = await supabase
      .from('fitness_training_programs')
      .select(`
        *,
        client:fitness_profiles!client_id(id, nome, email, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (programError || !program) {
      return NextResponse.json(
        { success: false, error: 'Programa não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão
    const isProfessionalOwner = professional && program.professional_id === professional.id
    const isClient = program.client_id === user.id

    if (!isProfessionalOwner && !isClient) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar semanas do programa
    const { data: weeks } = await supabase
      .from('fitness_training_weeks')
      .select('*')
      .eq('program_id', id)
      .order('week_number', { ascending: true })

    // Buscar dias e exercícios de cada semana
    const weeksWithDays = await Promise.all(
      (weeks || []).map(async (week) => {
        const { data: days } = await supabase
          .from('fitness_training_days')
          .select('*')
          .eq('week_id', week.id)
          .order('order_index', { ascending: true })

        const daysWithExercises = await Promise.all(
          (days || []).map(async (day) => {
            const { data: exercises } = await supabase
              .from('fitness_training_exercises')
              .select('*')
              .eq('training_day_id', day.id)
              .order('order_index', { ascending: true })

            return {
              ...day,
              exercises: exercises || []
            }
          })
        )

        return {
          ...week,
          days: daysWithExercises
        }
      })
    )

    return NextResponse.json({
      success: true,
      program: {
        ...program,
        weeks: weeksWithDays
      }
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar programa completo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é personal trainer
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional || professional.type !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a personal trainers' },
        { status: 403 }
      )
    }

    // Verificar se o programa pertence ao profissional
    const { data: existingProgram } = await supabase
      .from('fitness_training_programs')
      .select('id')
      .eq('id', id)
      .eq('professional_id', professional.id)
      .single()

    if (!existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Programa não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { weeks, ...programData } = body

    // Atualizar dados do programa
    const updateFields: Record<string, unknown> = {}
    if (programData.name !== undefined) updateFields.name = programData.name
    if (programData.description !== undefined) updateFields.description = programData.description
    if (programData.clientId !== undefined) updateFields.client_id = programData.clientId
    if (programData.goal !== undefined) updateFields.goal = programData.goal
    if (programData.difficulty !== undefined) updateFields.difficulty = programData.difficulty
    if (programData.durationWeeks !== undefined) updateFields.duration_weeks = programData.durationWeeks
    if (programData.daysPerWeek !== undefined) updateFields.days_per_week = programData.daysPerWeek
    if (programData.sessionDuration !== undefined) updateFields.session_duration = programData.sessionDuration
    if (programData.equipmentNeeded !== undefined) updateFields.equipment_needed = programData.equipmentNeeded
    if (programData.isActive !== undefined) updateFields.is_active = programData.isActive
    if (programData.startsAt !== undefined) updateFields.starts_at = programData.startsAt
    if (programData.endsAt !== undefined) updateFields.ends_at = programData.endsAt
    if (programData.notes !== undefined) updateFields.notes = programData.notes

    if (Object.keys(updateFields).length > 0) {
      await supabase
        .from('fitness_training_programs')
        .update(updateFields)
        .eq('id', id)
    }

    // Se semanas foram fornecidas, atualizar estrutura
    if (weeks && Array.isArray(weeks)) {
      // Deletar semanas existentes (cascata remove dias e exercícios)
      await supabase
        .from('fitness_training_weeks')
        .delete()
        .eq('program_id', id)

      // Criar novas semanas, dias e exercícios
      for (const week of weeks) {
        const { data: programWeek, error: weekError } = await supabase
          .from('fitness_training_weeks')
          .insert({
            program_id: id,
            week_number: week.weekNumber ?? week.week_number,
            name: week.name,
            focus: week.focus,
            intensity_modifier: week.intensityModifier ?? week.intensity_modifier ?? 1.0,
            notes: week.notes
          })
          .select()
          .single()

        if (weekError) {
          console.error('Erro ao criar semana:', weekError)
          continue
        }

        // Criar dias da semana
        const days = week.days || []
        for (const day of days) {
          const { data: trainingDay, error: dayError } = await supabase
            .from('fitness_training_days')
            .insert({
              week_id: programWeek.id,
              day_of_week: day.dayOfWeek ?? day.day_of_week,
              day_number: day.dayNumber ?? day.day_number,
              name: day.name,
              muscle_groups: day.muscleGroups ?? day.muscle_groups ?? [],
              estimated_duration: day.estimatedDuration ?? day.estimated_duration,
              warmup_notes: day.warmupNotes ?? day.warmup_notes,
              cooldown_notes: day.cooldownNotes ?? day.cooldown_notes,
              notes: day.notes,
              order_index: day.orderIndex ?? day.order_index ?? 0
            })
            .select()
            .single()

          if (dayError) {
            console.error('Erro ao criar dia:', dayError)
            continue
          }

          // Criar exercícios do dia
          const exercises = day.exercises || []
          for (const exercise of exercises) {
            await supabase
              .from('fitness_training_exercises')
              .insert({
                training_day_id: trainingDay.id,
                exercise_name: exercise.exerciseName ?? exercise.exercise_name,
                exercise_category: exercise.exerciseCategory ?? exercise.exercise_category,
                muscle_group: exercise.muscleGroup ?? exercise.muscle_group,
                sets: exercise.sets || 3,
                reps: exercise.reps,
                rest_seconds: exercise.restSeconds ?? exercise.rest_seconds ?? 60,
                tempo: exercise.tempo,
                weight_suggestion: exercise.weightSuggestion ?? exercise.weight_suggestion,
                rpe_target: exercise.rpeTarget ?? exercise.rpe_target,
                instructions: exercise.instructions,
                video_url: exercise.videoUrl ?? exercise.video_url,
                alternatives: exercise.alternatives || [],
                is_dropset: exercise.isDropset ?? exercise.is_dropset ?? false,
                is_warmup: exercise.isWarmup ?? exercise.is_warmup ?? false,
                order_index: exercise.orderIndex ?? exercise.order_index ?? 0,
                notes: exercise.notes
              })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Programa atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover programa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é personal trainer
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional || professional.type !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a personal trainers' },
        { status: 403 }
      )
    }

    // Verificar se o programa pertence ao profissional
    const { data: existingProgram } = await supabase
      .from('fitness_training_programs')
      .select('id')
      .eq('id', id)
      .eq('professional_id', professional.id)
      .single()

    if (!existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Programa não encontrado' },
        { status: 404 }
      )
    }

    // Deletar programa
    const { error: deleteError } = await supabase
      .from('fitness_training_programs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar programa:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar programa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Programa removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
