/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getYouTubeThumbnail } from '@/lib/utils/youtube'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - List exercises with search/filter
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify is professional (any type can view exercises)
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const muscleGroup = searchParams.get('muscleGroup')
    const difficulty = searchParams.get('difficulty')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('fitness_exercises_library')
      .select('*', { count: 'exact' })
      .order('nome', { ascending: true })

    if (search) {
      const sanitizedSearch = search.replace(/[%,.()']/g, '')
      query = query.or(`nome.ilike.%${sanitizedSearch}%,nome_en.ilike.%${sanitizedSearch}%`)
    }
    if (muscleGroup) {
      query = query.eq('grupo_muscular', muscleGroup)
    }
    if (difficulty) {
      query = query.eq('dificuldade', difficulty)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: exercises, count, error } = await query

    if (error) {
      console.error('Erro ao buscar exercicios:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar exercicios' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      exercises: exercises || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Erro na API de exercicios:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create exercise (trainers only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional || professional.type !== 'trainer') {
      return NextResponse.json({ success: false, error: 'Acesso restrito a personal trainers' }, { status: 403 })
    }

    const body = await request.json()
    const { nome, grupo_muscular, video_url, instructions, dificuldade, equipamento, tipo, is_composto, nome_en, musculos_secundarios } = body

    if (!nome || !grupo_muscular) {
      return NextResponse.json({ success: false, error: 'nome e grupo_muscular obrigatorios' }, { status: 400 })
    }

    // Auto-generate thumbnail from video_url
    let video_thumbnail = null
    if (video_url) {
      video_thumbnail = getYouTubeThumbnail(video_url)
    }

    const { data: exercise, error: insertError } = await supabaseAdmin
      .from('fitness_exercises_library')
      .insert({
        nome,
        nome_en: nome_en || null,
        grupo_muscular,
        musculos_secundarios: musculos_secundarios || null,
        equipamento: equipamento || null,
        tipo: tipo || null,
        instrucoes: instructions || null,
        video_url: video_url || null,
        video_thumbnail,
        dificuldade: dificuldade || null,
        is_composto: is_composto || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar exercicio:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao criar exercicio' }, { status: 500 })
    }

    return NextResponse.json({ success: true, exercise })
  } catch (error) {
    console.error('Erro na API de exercicios:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
