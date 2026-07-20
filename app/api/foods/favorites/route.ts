import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)

/**
 * GET /api/foods/favorites — Lista os alimentos favoritos do usuário
 * (globais TACO/TBCA via fitness_food_favorites + user foods legados
 * com is_favorite=true), já no formato Food da API de busca.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const sb = supabase as SupabaseAny

    const { data: favRows, error: favError } = await sb
      .from('fitness_food_favorites')
      .select('food_id, food_source, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (favError) {
      // Tabela pode ainda não existir (migration pendente) — degrada para lista vazia
      console.error('Erro ao buscar favoritos:', favError)
      return NextResponse.json({ success: true, foods: [] })
    }

    const rows = favRows || []
    const globalIds = rows.filter((r: SupabaseAny) => r.food_source === 'global').map((r: SupabaseAny) => r.food_id)
    const userIds = rows.filter((r: SupabaseAny) => r.food_source === 'user').map((r: SupabaseAny) => r.food_id)

    const [globalRes, userRes] = await Promise.all([
      globalIds.length > 0
        ? sb.from('fitness_global_foods').select('*').in('id', globalIds).eq('is_active', true)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? sb.from('fitness_user_foods').select('*').eq('user_id', user.id).in('id', userIds).eq('is_active', true)
        : Promise.resolve({ data: [] }),
    ])

    const formatGlobal = (f: SupabaseAny) => ({
      id: f.id,
      nome: f.nome,
      categoria: f.categoria,
      marca: null,
      porcao_padrao: f.porcao_padrao,
      unidade: f.unidade,
      calorias: Number(f.calorias),
      proteinas: Number(f.proteinas),
      carboidratos: Number(f.carboidratos),
      gorduras: Number(f.gorduras),
      fibras: num(f.fibras),
      sodio: num(f.sodio),
      porcoes_comuns: f.porcoes_comuns,
      is_favorite: true,
      is_user_created: false,
      source: f.source,
    })

    const formatUser = (f: SupabaseAny) => ({
      id: f.id,
      nome: f.nome,
      categoria: f.categoria,
      marca: f.marca,
      porcao_padrao: f.porcao_padrao,
      unidade: f.unidade,
      calorias: Number(f.calorias),
      proteinas: Number(f.proteinas),
      carboidratos: Number(f.carboidratos),
      gorduras: Number(f.gorduras),
      fibras: num(f.fibras),
      sodio: num(f.sodio),
      porcoes_comuns: f.porcoes_comuns,
      is_favorite: true,
      is_user_created: true,
      source: f.source || 'manual',
    })

    // Mantém a ordem de favoritação (mais recente primeiro)
    const byId = new Map<string, SupabaseAny>()
    for (const f of (globalRes.data || [])) byId.set(f.id, formatGlobal(f))
    for (const f of (userRes.data || [])) byId.set(f.id, formatUser(f))
    const foods = rows.map((r: SupabaseAny) => byId.get(r.food_id)).filter(Boolean)

    return NextResponse.json({ success: true, foods })
  } catch (error) {
    console.error('Erro na API de favoritos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/foods/favorites — Alterna favorito.
 * Body: { food_id: string, food_source: 'global' | 'user' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { food_id, food_source } = await request.json()
    if (!food_id || !['global', 'user'].includes(food_source)) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }

    const sb = supabase as SupabaseAny

    const { data: existing } = await sb
      .from('fitness_food_favorites')
      .select('food_id')
      .eq('user_id', user.id)
      .eq('food_id', food_id)
      .maybeSingle()

    if (existing) {
      const { error } = await sb
        .from('fitness_food_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('food_id', food_id)
      if (error) throw error
      return NextResponse.json({ success: true, is_favorite: false })
    }

    const { error } = await sb
      .from('fitness_food_favorites')
      .insert({ user_id: user.id, food_id, food_source })
    if (error) throw error
    return NextResponse.json({ success: true, is_favorite: true })
  } catch (error) {
    console.error('Erro ao alternar favorito:', error)
    return NextResponse.json({ success: false, error: 'Erro ao salvar favorito' }, { status: 500 })
  }
}
