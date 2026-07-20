import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * Apelidos populares → nomes técnicos da base TACO/TBCA.
 * Fallback local usado quando a tabela fitness_food_aliases ainda não
 * existe (migration pendente). A fonte da verdade é a tabela.
 */
const DEFAULT_ALIASES: Record<string, string[]> = {
  'arroz branco': ['arroz, tipo 1', 'arroz, polido'],
  'arroz integral': ['arroz, integral'],
  'frango': ['frango', 'peito de frango', 'coxa de frango', 'sobrecoxa'],
  'peito de frango': ['frango, peito'],
  'ovo': ['ovo, de galinha'],
  'ovo cozido': ['ovo, de galinha, inteiro, cozido'],
  'ovo frito': ['ovo, de galinha, inteiro, frito'],
  'feijao': ['feijao'],
  'feijao preto': ['feijao, preto'],
  'feijao carioca': ['feijao, carioca'],
  'batata doce': ['batata, doce', 'batata-doce'],
  'batata frita': ['batata, frita', 'batata, inglesa, frita'],
  'batata cozida': ['batata, inglesa, cozida'],
  'carne moida': ['carne, moida', 'carne bovina, moida'],
  'carne bovina': ['carne, bovina', 'boi'],
  'pao frances': ['pao, frances', 'pao, trigo, frances'],
  'pao de forma': ['pao, forma'],
  'leite': ['leite, de vaca', 'leite, integral'],
  'leite integral': ['leite, de vaca, integral', 'leite, integral'],
  'leite desnatado': ['leite, de vaca, desnatado', 'leite, desnatado'],
  'queijo mussarela': ['queijo, mussarela', 'queijo, mucarela', 'mussarela'],
  'banana': ['banana', 'banana, prata', 'banana, nanica'],
  'maca': ['maca'],
  'cafe': ['cafe', 'cafe, infusao'],
  'acucar': ['acucar'],
  'azeite': ['azeite', 'azeite, de oliva'],
  'macarrao': ['macarrao'],
  'carne de porco': ['carne, suina', 'porco'],
  'salmao': ['salmao'],
  'brocolis': ['brocolis'],
  'whey': ['whey', 'proteina', 'suplemento'],
}

// Cache em memória dos aliases do banco (TTL 5 min por instância)
let aliasCache: { data: Record<string, string[]>; loadedAt: number } | null = null
const ALIAS_CACHE_TTL_MS = 5 * 60 * 1000

async function getAliases(supabase: SupabaseAny): Promise<Record<string, string[]>> {
  if (aliasCache && Date.now() - aliasCache.loadedAt < ALIAS_CACHE_TTL_MS) {
    return aliasCache.data
  }
  try {
    const { data, error } = await supabase
      .from('fitness_food_aliases')
      .select('alias, target_terms')
    if (!error && data && data.length > 0) {
      const map: Record<string, string[]> = {}
      for (const row of data) map[row.alias] = row.target_terms || []
      aliasCache = { data: map, loadedAt: Date.now() }
      return map
    }
  } catch {
    // tabela ausente — usa fallback
  }
  return DEFAULT_ALIASES
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Pontua relevância (fallback legado — usado só se o RPC não existir).
 * Quanto MENOR o score, MAIS relevante.
 */
function relevanceScore(nome: string, query: string): number {
  const nomeNorm = removeAccents(nome)
  const queryNorm = removeAccents(query)
  if (nomeNorm.startsWith(queryNorm)) return 0
  const firstWord = queryNorm.split(/[,\s]+/)[0]
  if (nomeNorm.startsWith(firstWord)) return 1 + nome.length / 1000
  if (nomeNorm.includes(queryNorm)) return 2 + nome.length / 1000
  if (nomeNorm.includes(firstWord)) return 3 + nome.length / 1000
  return 4 + nome.length / 1000
}

/** Registra busca sem resultado (base do backlog de aliases/alimentos). */
async function logSearchMiss(userId: string, query: string): Promise<void> {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await admin
      .from('fitness_food_search_misses')
      .insert({ user_id: userId, query: query.slice(0, 200) })
  } catch {
    // best-effort — nunca quebra a busca
  }
}

/** Busca via RPC (pg_trgm + ranking no SQL). Retorna null se o RPC não existir. */
async function searchViaRpc(
  supabase: SupabaseAny,
  terms: string[],
  category: string | null,
  sources: string[] | null,
  limit: number,
  offset: number
): Promise<SupabaseAny[] | null> {
  const { data, error } = await supabase.rpc('fitness_search_foods', {
    p_terms: terms,
    p_category: category,
    p_sources: sources,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) {
    // 42883/PGRST202: função ainda não existe (migration pendente) → fallback
    console.error('RPC fitness_search_foods indisponível, usando fallback:', error.message)
    return null
  }
  return data || []
}

/** Caminho legado: ILIKE tokenizado + ranking em JS. */
async function searchLegacy(
  supabase: SupabaseAny,
  query: string,
  searchTerms: string[],
  category: string | null,
  sources: string[] | null,
  limit: number,
  offset: number
): Promise<SupabaseAny[]> {
  const runTermQuery = async (term: string) => {
    const tokens = term.split(/[\s,]+/).filter(t => t.length >= 2)
    const effective = tokens.length > 0 ? tokens : [term]

    let q = supabase
      .from('fitness_global_foods')
      .select('*')
      .eq('is_active', true)

    for (const token of effective) {
      q = q.ilike('nome_busca', `%${token}%`)
    }

    if (category) q = q.eq('categoria', category)
    if (sources && sources.length > 0) q = q.in('source', sources)

    return q.limit(500)
  }

  const results = await Promise.all(searchTerms.map(runTermQuery))
  const firstError = results.find((r: SupabaseAny) => r.error)?.error
  if (firstError) throw new Error(firstError.message)

  const byId = new Map<string, SupabaseAny>()
  for (const r of results) {
    for (const row of (r.data || [])) {
      if (!byId.has(row.id)) byId.set(row.id, row)
    }
  }
  const allGlobalFoods = Array.from(byId.values())

  allGlobalFoods.sort((a: SupabaseAny, b: SupabaseAny) => {
    const scoreA = relevanceScore(a.nome, query)
    const scoreB = relevanceScore(b.nome, query)
    if (Math.abs(scoreA - scoreB) < 0.01) {
      if (a.source === 'taco' && b.source !== 'taco') return -1
      if (b.source === 'taco' && a.source !== 'taco') return 1
    }
    return scoreA - scoreB
  })

  return allGlobalFoods.slice(offset, offset + limit)
}

/**
 * GET /api/foods - Busca global de alimentos (TACO + TBCA + user foods)
 *
 * Query params:
 *   q        - Texto de busca (min 2 chars)
 *   category - Filtrar por categoria
 *   source   - Filtrar por fontes (csv)
 *   limit    - Máximo de resultados (default 20, max 100)
 *   offset   - Paginação
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    const category = searchParams.get('category')
    const sourceParam = searchParams.get('source')
    const sources = sourceParam
      ? sourceParam.split(',').map(s => s.trim()).filter(Boolean)
      : null
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let allGlobalFoods: SupabaseAny[] = []

    if (query.length >= 2) {
      const normalizedQuery = removeAccents(query)
      const aliases = await getAliases(supabase)
      const aliasTerms = aliases[normalizedQuery] || []
      const searchTerms = [normalizedQuery, ...aliasTerms]

      const rpcResult = await searchViaRpc(supabase, searchTerms, category, sources, limit, offset)
      if (rpcResult !== null) {
        allGlobalFoods = rpcResult
      } else {
        allGlobalFoods = await searchLegacy(supabase, query, searchTerms, category, sources, limit, offset)
      }
    } else if (category) {
      // Busca só por categoria (sem texto)
      let catQuery = (supabase as SupabaseAny)
        .from('fitness_global_foods')
        .select('*')
        .eq('is_active', true)
        .eq('categoria', category)

      if (sources && sources.length > 0) {
        catQuery = catQuery.in('source', sources)
      }

      const { data: globalFoods, error: globalError } = await catQuery
        .order('nome')
        .range(offset, offset + limit - 1)

      if (globalError) {
        console.error('Erro ao buscar alimentos globais:', globalError)
        return NextResponse.json({ error: globalError.message }, { status: 500 })
      }

      allGlobalFoods = globalFoods || []
    }

    // Busca também nos alimentos do usuário — apenas na primeira página
    // (eles sempre vêm primeiro na resposta; repetir em offset>0 duplicaria)
    let userFoods: SupabaseAny[] = []
    if (offset === 0) {
      let userQuery = supabase
        .from('fitness_user_foods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('nome')
        .limit(limit)

      if (query.length >= 2) {
        userQuery = userQuery.ilike('nome', `%${query}%`)
      }

      if (category) {
        userQuery = userQuery.eq('categoria', category)
      }

      const { data, error: userError } = await userQuery
      if (userError) {
        console.error('Erro ao buscar alimentos do usuário:', userError)
      }
      userFoods = data || []
    }

    // Favoritos do usuário (globais + user foods) para marcar is_favorite
    // nos resultados. Best-effort: se a tabela ainda não existir, segue sem.
    let favIds = new Set<string>()
    try {
      const { data: favRows } = await (supabase as SupabaseAny)
        .from('fitness_food_favorites')
        .select('food_id')
        .eq('user_id', user.id)
      favIds = new Set((favRows || []).map((r: SupabaseAny) => r.food_id))
    } catch {
      // tabela ausente — ignora
    }

    // Helper: converte campo numérico opcional do banco para number ou null.
    const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)

    // Formatar resultados — exibe o nome popular quando existir
    const formattedGlobal = allGlobalFoods.map((f: SupabaseAny) => ({
      id: f.id,
      nome: f.nome_popular || f.nome,
      nome_tecnico: f.nome,
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
      ferro: num(f.ferro),
      colesterol: num(f.colesterol),
      zinco: num(f.zinco),
      selenio: num(f.selenio),
      magnesio: num(f.magnesio),
      porcoes_comuns: f.porcoes_comuns,
      is_favorite: favIds.has(f.id),
      is_user_created: false,
      source: f.source,
      source_id: f.source_id,
    }))

    const formattedUser = (userFoods || []).map((f: SupabaseAny) => ({
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
      ferro: num(f.ferro),
      colesterol: num(f.colesterol),
      zinco: num(f.zinco),
      selenio: num(f.selenio),
      magnesio: num(f.magnesio),
      porcoes_comuns: f.porcoes_comuns,
      is_favorite: f.is_favorite || favIds.has(f.id),
      is_user_created: true,
      source: f.source || 'manual',
    }))

    const total = formattedUser.length + formattedGlobal.length

    // Busca com texto e zero resultados → registra para o backlog
    // (fire-and-forget: não segura a resposta)
    if (query.length >= 2 && total === 0 && offset === 0) {
      void logSearchMiss(user.id, query)
    }

    return NextResponse.json({
      success: true,
      foods: [...formattedUser, ...formattedGlobal],
      total,
    })
  } catch (error) {
    console.error('Erro na API foods:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
