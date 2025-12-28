/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Tipos do Supabase serao gerados apos rodar a migration
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar programa de treino ativo do cliente
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Usar admin client para bypass de RLS
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

    // Buscar programa de treino ativo do cliente
    // client_id deve ser igual ao user.id (que é o fitness_profiles.id = auth.uid())
    console.log('=== DEBUG CLIENT TRAINING PROGRAM ===')
    console.log('User ID:', user.id)

    const { data: program, error: programError } = await supabaseAdmin
      .from('fitness_training_programs')
      .select('*')
      .eq('client_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('Programa encontrado:', program ? { id: program.id, name: program.name, client_id: program.client_id } : null)
    console.log('Erro ao buscar:', programError?.message || 'nenhum')

    if (programError && programError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error for us)
      console.error('Erro ao buscar programa:', programError)
    }

    if (!program) {
      return NextResponse.json({
        success: true,
        program: null
      })
    }

    // Buscar semanas do programa
    const { data: weeks } = await supabaseAdmin
      .from('fitness_training_weeks')
      .select('*')
      .eq('program_id', program.id)
      .order('week_number', { ascending: true })

    // Buscar dias e exercícios de cada semana
    const weeksWithDays = await Promise.all(
      (weeks || []).map(async (week) => {
        const { data: days } = await supabaseAdmin
          .from('fitness_training_days')
          .select('*')
          .eq('week_id', week.id)
          .order('order_index', { ascending: true })

        const daysWithExercises = await Promise.all(
          (days || []).map(async (day) => {
            const { data: exercises } = await supabaseAdmin
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

    // Buscar dados do profissional
    let professional = null
    if (program.professional_id) {
      const { data: prof } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, display_name, specialty, type')
        .eq('id', program.professional_id)
        .single()
      professional = prof
    }

    return NextResponse.json({
      success: true,
      program: {
        ...program,
        weeks: weeksWithDays,
        professional
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
