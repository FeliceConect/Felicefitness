import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ActivityInsert } from '@/lib/activity/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// GET - Buscar atividades do usuário
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Formato: YYYY-MM-DD
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = (supabase as AnySupabase)
      .from('fitness_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar atividades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activities: activities || []
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova atividade
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

    const body: ActivityInsert = await request.json()

    // Validações básicas
    if (!body.activity_type) {
      return NextResponse.json(
        { success: false, error: 'Tipo de atividade é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.duration_minutes || body.duration_minutes <= 0) {
      return NextResponse.json(
        { success: false, error: 'Duração é obrigatória' },
        { status: 400 }
      )
    }

    if (!body.intensity) {
      return NextResponse.json(
        { success: false, error: 'Intensidade é obrigatória' },
        { status: 400 }
      )
    }

    const { data: activity, error } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .insert({
        user_id: user.id,
        activity_type: body.activity_type,
        custom_name: body.custom_name,
        date: body.date || new Date().toISOString().split('T')[0],
        duration_minutes: body.duration_minutes,
        intensity: body.intensity,
        calories_burned: body.calories_burned,
        distance_km: body.distance_km,
        heart_rate_avg: body.heart_rate_avg,
        notes: body.notes,
        location: body.location
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar atividade:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar atividade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activity,
      message: 'Atividade registrada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover atividade
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

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: 'ID da atividade é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', user.id) // Garante que só pode deletar suas próprias atividades

    if (error) {
      console.error('Erro ao deletar atividade:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar atividade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Atividade removida com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
