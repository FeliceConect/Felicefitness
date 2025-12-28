// @ts-nocheck - Tipos do Supabase serao gerados apos rodar a migration
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Listar programas de treino do profissional
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Criar admin client para bypass de RLS ao buscar clientes
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

    // Verificar se é personal trainer
    const { data: professional } = await supabaseAdmin
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

    // Parâmetros de busca
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const templateOnly = searchParams.get('templateOnly') === 'true'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Buscar programas
    let query = supabaseAdmin
      .from('fitness_training_programs')
      .select('*')
      .eq('professional_id', professional.id)
      .order('created_at', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (templateOnly) {
      query = query.eq('is_template', true)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: programs, error } = await query

    if (error) {
      console.error('Erro ao buscar programas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar programas de treino' },
        { status: 500 }
      )
    }

    // Buscar dados dos clientes separadamente
    console.log('=== DEBUG GET PROGRAMAS ===')
    console.log('Programas encontrados:', programs?.map(p => ({ id: p.id, name: p.name, client_id: p.client_id })))

    const clientIds = (programs || [])
      .filter(p => p.client_id)
      .map(p => p.client_id)

    console.log('Client IDs encontrados:', clientIds)

    let clientsMap: Record<string, { id: string; nome: string; email: string; avatar_url?: string }> = {}

    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', clientIds)

      console.log('Clientes buscados:', clients)
      if (clientsError) console.log('Erro ao buscar clientes:', clientsError)

      if (clients) {
        clients.forEach(c => {
          clientsMap[c.id] = c
        })
      }
    }

    console.log('Clients Map:', clientsMap)

    // Adicionar dados do cliente a cada programa
    const programsWithClients = (programs || []).map(p => ({
      ...p,
      client: p.client_id ? clientsMap[p.client_id] || null : null
    }))

    console.log('Programas com clientes:', programsWithClients.map(p => ({ name: p.name, client_id: p.client_id, client: p.client })))

    return NextResponse.json({
      success: true,
      programs: programsWithClients
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo programa de treino
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const {
      name,
      description,
      clientId,
      goal,
      difficulty,
      durationWeeks,
      daysPerWeek,
      sessionDuration,
      equipmentNeeded,
      isTemplate,
      startsAt,
      endsAt,
      notes,
      weeks // Array de semanas com dias e exercícios
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome do programa é obrigatório' },
        { status: 400 }
      )
    }

    // Criar programa
    const { data: program, error: programError } = await supabase
      .from('fitness_training_programs')
      .insert({
        professional_id: professional.id,
        client_id: clientId || null,
        name,
        description,
        goal,
        difficulty: difficulty || 'intermediate',
        duration_weeks: durationWeeks || 4,
        days_per_week: daysPerWeek || 4,
        session_duration: sessionDuration || 60,
        equipment_needed: equipmentNeeded || [],
        is_template: isTemplate || false,
        is_active: true,
        starts_at: startsAt,
        ends_at: endsAt,
        notes
      })
      .select()
      .single()

    if (programError) {
      console.error('Erro ao criar programa:', programError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar programa de treino' },
        { status: 500 }
      )
    }

    // Criar semanas, dias e exercícios se fornecidos
    if (weeks && Array.isArray(weeks)) {
      for (const week of weeks) {
        const { data: programWeek, error: weekError } = await supabase
          .from('fitness_training_weeks')
          .insert({
            program_id: program.id,
            week_number: week.weekNumber,
            name: week.name,
            focus: week.focus,
            intensity_modifier: week.intensityModifier || 1.0,
            notes: week.notes
          })
          .select()
          .single()

        if (weekError) {
          console.error('Erro ao criar semana:', weekError)
          continue
        }

        // Criar dias da semana
        if (week.days && Array.isArray(week.days)) {
          for (const day of week.days) {
            const { data: trainingDay, error: dayError } = await supabase
              .from('fitness_training_days')
              .insert({
                week_id: programWeek.id,
                day_of_week: day.dayOfWeek,
                day_number: day.dayNumber,
                name: day.name,
                muscle_groups: day.muscleGroups || [],
                estimated_duration: day.estimatedDuration,
                warmup_notes: day.warmupNotes,
                cooldown_notes: day.cooldownNotes,
                notes: day.notes,
                order_index: day.orderIndex || 0
              })
              .select()
              .single()

            if (dayError) {
              console.error('Erro ao criar dia:', dayError)
              continue
            }

            // Criar exercícios do dia
            if (day.exercises && Array.isArray(day.exercises)) {
              for (const exercise of day.exercises) {
                await supabase
                  .from('fitness_training_exercises')
                  .insert({
                    training_day_id: trainingDay.id,
                    exercise_name: exercise.exerciseName,
                    exercise_category: exercise.exerciseCategory,
                    muscle_group: exercise.muscleGroup,
                    sets: exercise.sets || 3,
                    reps: exercise.reps,
                    rest_seconds: exercise.restSeconds || 60,
                    tempo: exercise.tempo,
                    weight_suggestion: exercise.weightSuggestion,
                    rpe_target: exercise.rpeTarget,
                    instructions: exercise.instructions,
                    video_url: exercise.videoUrl,
                    alternatives: exercise.alternatives || [],
                    is_dropset: exercise.isDropset || false,
                    is_warmup: exercise.isWarmup || false,
                    order_index: exercise.orderIndex || 0,
                    notes: exercise.notes
                  })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      program,
      message: 'Programa de treino criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar programa de treino
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Criar admin client para bypass de RLS
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

    // Verificar se é personal trainer
    const { data: professional } = await supabaseAdmin
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

    const body = await request.json()
    const { programId, ...updateData } = body

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'ID do programa é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o programa pertence ao profissional
    const { data: existingProgram } = await supabaseAdmin
      .from('fitness_training_programs')
      .select('id, client_id')
      .eq('id', programId)
      .eq('professional_id', professional.id)
      .single()

    if (!existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Programa não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateFields: Record<string, unknown> = {}
    if (updateData.name !== undefined) updateFields.name = updateData.name
    if (updateData.description !== undefined) updateFields.description = updateData.description
    // Tratar clientId especificamente - pode ser string, null, ou undefined
    if ('clientId' in updateData) {
      // Se clientId for fornecido, validar que existe em fitness_profiles
      if (updateData.clientId) {
        const { data: clientExists } = await supabaseAdmin
          .from('fitness_profiles')
          .select('id')
          .eq('id', updateData.clientId)
          .single()

        if (!clientExists) {
          return NextResponse.json(
            { success: false, error: 'Cliente não encontrado' },
            { status: 400 }
          )
        }
      }
      updateFields.client_id = updateData.clientId || null
    }
    if (updateData.goal !== undefined) updateFields.goal = updateData.goal
    if (updateData.difficulty !== undefined) updateFields.difficulty = updateData.difficulty
    if (updateData.durationWeeks !== undefined) updateFields.duration_weeks = updateData.durationWeeks
    if (updateData.daysPerWeek !== undefined) updateFields.days_per_week = updateData.daysPerWeek
    if (updateData.sessionDuration !== undefined) updateFields.session_duration = updateData.sessionDuration
    if (updateData.equipmentNeeded !== undefined) updateFields.equipment_needed = updateData.equipmentNeeded
    if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive
    if (updateData.startsAt !== undefined) updateFields.starts_at = updateData.startsAt
    if (updateData.endsAt !== undefined) updateFields.ends_at = updateData.endsAt
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes

    console.log('Atualizando programa:', programId, 'com campos:', updateFields)

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    const { data: updatedProgram, error: updateError } = await supabaseAdmin
      .from('fitness_training_programs')
      .update(updateFields)
      .eq('id', programId)
      .select('*, client:fitness_profiles!client_id(id, nome, email)')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar programa:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar programa: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Programa atualizado:', updatedProgram)

    return NextResponse.json({
      success: true,
      message: 'Programa atualizado com sucesso',
      program: updatedProgram
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover programa de treino
export async function DELETE(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('id')

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'ID do programa é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o programa pertence ao profissional
    const { data: existingProgram } = await supabase
      .from('fitness_training_programs')
      .select('id')
      .eq('id', programId)
      .eq('professional_id', professional.id)
      .single()

    if (!existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Programa não encontrado' },
        { status: 404 }
      )
    }

    // Deletar programa (cascata remove semanas, dias e exercícios)
    const { error: deleteError } = await supabase
      .from('fitness_training_programs')
      .delete()
      .eq('id', programId)

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
