/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

async function requireModerator() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: professional } = await admin
    .from('fitness_professionals')
    .select('id, type')
    .eq('user_id', user.id)
    .single()

  if (!professional || !['nutritionist', 'super_admin'].includes(professional.type)) {
    return { error: NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 }) }
  }

  return { admin, user, professional }
}

// GET - Alimentos criados por pacientes aguardando moderação
export async function GET() {
  try {
    const ctx = await requireModerator()
    if (ctx.error) return ctx.error
    const { admin } = ctx

    const { data: foods, error } = await admin
      .from('fitness_user_foods')
      .select('id, user_id, nome, categoria, marca, porcao_padrao, unidade, calorias, proteinas, carboidratos, gorduras, fibras, sodio, porcoes_comuns, source, created_at')
      .eq('promote_status', 'pending')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao listar alimentos pendentes:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Nome do paciente que criou (para contexto da moderação)
    const userIds = Array.from(new Set((foods || []).map(f => f.user_id)))
    let namesById: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('fitness_profiles')
        .select('id, nome')
        .in('id', userIds)
      namesById = Object.fromEntries((profiles || []).map(p => [p.id, p.nome]))
    }

    return NextResponse.json({
      success: true,
      foods: (foods || []).map(f => ({ ...f, created_by_name: namesById[f.user_id] || null })),
    })
  } catch (error) {
    console.error('Erro na moderação de alimentos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Aprovar (promove ao banco global) ou rejeitar um alimento
// Body: { id, action: 'approve' | 'reject', overrides?: { nome?, categoria? } }
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireModerator()
    if (ctx.error) return ctx.error
    const { admin } = ctx

    const { id, action, overrides } = await request.json()
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }

    const { data: food, error: foodError } = await admin
      .from('fitness_user_foods')
      .select('*')
      .eq('id', id)
      .single()

    if (foodError || !food) {
      return NextResponse.json({ success: false, error: 'Alimento não encontrado' }, { status: 404 })
    }

    // Idempotência: só modera o que ainda está pendente (evita alimento
    // global duplicado em duplo-clique / dois moderadores simultâneos)
    if (food.promote_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Este alimento já foi moderado' },
        { status: 409 }
      )
    }

    if (action === 'reject') {
      const { error } = await admin
        .from('fitness_user_foods')
        .update({ promote_status: 'rejected' })
        .eq('id', id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // approve → insere no banco global
    const nome = (overrides?.nome || food.nome).trim()
    const categoria = overrides?.categoria || food.categoria
    const globalRow = {
      nome,
      nome_busca: removeAccents(nome),
      categoria,
      source: 'manual',
      source_id: `promoted-${food.id}`,
      porcao_padrao: food.porcao_padrao || 100,
      unidade: food.unidade || 'g',
      calorias: food.calorias || 0,
      proteinas: food.proteinas || 0,
      carboidratos: food.carboidratos || 0,
      gorduras: food.gorduras || 0,
      fibras: food.fibras,
      sodio: food.sodio,
      porcoes_comuns: food.porcoes_comuns,
      is_active: true,
    }

    // Tenta com as colunas de nome popular (fase 2); fallback sem elas
    let inserted = null
    let insertError = null
    {
      const res = await admin
        .from('fitness_global_foods')
        .insert({ ...globalRow, nome_popular: nome, nome_popular_busca: removeAccents(nome) })
        .select('id')
        .single()
      inserted = res.data
      insertError = res.error
      if (insertError && (insertError.code === '42703' || insertError.code === 'PGRST204')) {
        const retry = await admin.from('fitness_global_foods').insert(globalRow).select('id').single()
        inserted = retry.data
        insertError = retry.error
      }
    }

    if (insertError || !inserted) {
      console.error('Erro ao promover alimento:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao promover alimento' }, { status: 500 })
    }

    const { error: updateError } = await admin
      .from('fitness_user_foods')
      .update({ promote_status: 'approved', promoted_global_id: inserted.id })
      .eq('id', id)
    if (updateError) console.error('Erro ao atualizar status do alimento:', updateError)

    return NextResponse.json({ success: true, global_id: inserted.id })
  } catch (error) {
    console.error('Erro na moderação de alimentos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
