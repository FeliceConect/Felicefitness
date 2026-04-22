/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * POST /api/portal/training-programs/[id]/clone
 *
 * Clona um programa de treino (geralmente um template) preservando semanas,
 * dias e exercícios.
 *
 * Default: o clone vira um programa não-template (is_template=false) pronto
 * para ser atribuído a um cliente. Se clientId for informado, já atribui
 * na criação. Para manter como template (ex: variar um template na
 * biblioteca), passe isTemplate=true explicitamente.
 *
 * Body: { clientId?: string, name?: string, isTemplate?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

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

    const body = await request.json().catch(() => ({}))
    const clientId: string | null = body.clientId || null
    const customName: string | null = body.name || null
    const keepAsTemplate: boolean = body.isTemplate === true

    // Programa original (precisa pertencer ao profissional)
    const { data: srcProgram, error: srcErr } = await supabaseAdmin
      .from('fitness_training_programs')
      .select('*')
      .eq('id', id)
      .eq('professional_id', professional.id)
      .single()

    if (srcErr || !srcProgram) {
      return NextResponse.json(
        { success: false, error: 'Programa original não encontrado' },
        { status: 404 }
      )
    }

    // Criar programa novo
    const { data: newProgram, error: insertErr } = await supabaseAdmin
      .from('fitness_training_programs')
      .insert({
        professional_id: professional.id,
        client_id: clientId,
        name: customName || (clientId ? srcProgram.name : `${srcProgram.name} (Cópia)`),
        description: srcProgram.description,
        goal: srcProgram.goal,
        difficulty: srcProgram.difficulty,
        duration_weeks: srcProgram.duration_weeks,
        days_per_week: srcProgram.days_per_week,
        session_duration: srcProgram.session_duration,
        equipment_needed: srcProgram.equipment_needed,
        is_template: keepAsTemplate,
        is_active: true,
        notes: srcProgram.notes
      })
      .select()
      .single()

    if (insertErr || !newProgram) {
      console.error('Erro ao clonar programa:', insertErr)
      return NextResponse.json(
        { success: false, error: 'Erro ao clonar programa' },
        { status: 500 }
      )
    }

    // Copiar semanas → dias → exercícios
    const { data: srcWeeks } = await supabaseAdmin
      .from('fitness_training_weeks')
      .select('*')
      .eq('program_id', id)
      .order('week_number', { ascending: true })

    for (const srcWeek of srcWeeks || []) {
      const { data: newWeek, error: weekErr } = await supabaseAdmin
        .from('fitness_training_weeks')
        .insert({
          program_id: newProgram.id,
          week_number: srcWeek.week_number,
          name: srcWeek.name,
          focus: srcWeek.focus,
          intensity_modifier: srcWeek.intensity_modifier ?? 1.0,
          notes: srcWeek.notes
        })
        .select()
        .single()

      if (weekErr || !newWeek) continue

      const { data: srcDays } = await supabaseAdmin
        .from('fitness_training_days')
        .select('*')
        .eq('week_id', srcWeek.id)
        .order('order_index', { ascending: true })

      for (const srcDay of srcDays || []) {
        const { data: newDay, error: dayErr } = await supabaseAdmin
          .from('fitness_training_days')
          .insert({
            week_id: newWeek.id,
            day_of_week: srcDay.day_of_week,
            day_number: srcDay.day_number,
            name: srcDay.name,
            muscle_groups: srcDay.muscle_groups || [],
            estimated_duration: srcDay.estimated_duration,
            warmup_notes: srcDay.warmup_notes,
            cooldown_notes: srcDay.cooldown_notes,
            notes: srcDay.notes,
            order_index: srcDay.order_index ?? 0
          })
          .select()
          .single()

        if (dayErr || !newDay) continue

        const { data: srcExercises } = await supabaseAdmin
          .from('fitness_training_exercises')
          .select('*')
          .eq('training_day_id', srcDay.id)
          .order('order_index', { ascending: true })

        if (srcExercises && srcExercises.length > 0) {
          const toInsert = srcExercises.map(e => ({
            training_day_id: newDay.id,
            exercise_name: e.exercise_name,
            exercise_category: e.exercise_category,
            muscle_group: e.muscle_group,
            sets: e.sets || 3,
            reps: e.reps,
            rest_seconds: e.rest_seconds ?? 60,
            tempo: e.tempo,
            weight_suggestion: e.weight_suggestion,
            rpe_target: e.rpe_target,
            instructions: e.instructions,
            video_url: e.video_url,
            alternatives: e.alternatives || [],
            is_dropset: e.is_dropset ?? false,
            is_warmup: e.is_warmup ?? false,
            order_index: e.order_index ?? 0,
            notes: e.notes
          }))
          await supabaseAdmin.from('fitness_training_exercises').insert(toInsert)
        }
      }
    }

    return NextResponse.json({
      success: true,
      programId: newProgram.id,
      program: newProgram
    })
  } catch (error) {
    console.error('Erro em clone:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
