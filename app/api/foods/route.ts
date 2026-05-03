import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * Apelidos populares → nomes técnicos da base TACO/TBCA.
 * Quando o usuário busca "arroz branco", expandimos para buscar
 * também "arroz, tipo 1" que é o nome científico.
 */
const ALIASES: Record<string, string[]> = {
  'arroz branco': ['arroz, tipo 1', 'arroz, polido'],
  'arroz integral': ['arroz, integral'],
  'frango': ['frango', 'peito de frango', 'coxa de frango', 'sobrecoxa'],
  'peito de frango': ['frango, peito'],
  'ovo': ['ovo, de galinha'],
  'ovo cozido': ['ovo, de galinha, inteiro, cozido'],
  'ovo frito': ['ovo, de galinha, inteiro, frito'],
  'feijao': ['feijao', 'feijão'],
  'feijao preto': ['feijao, preto', 'feijão, preto'],
  'feijao carioca': ['feijao, carioca', 'feijão, carioca'],
  'batata doce': ['batata, doce', 'batata-doce'],
  'batata frita': ['batata, frita', 'batata, inglesa, frita'],
  'batata cozida': ['batata, inglesa, cozida'],
  'carne moida': ['carne, moida', 'carne, moída', 'carne bovina, moida'],
  'carne bovina': ['carne, bovina', 'boi'],
  'pao frances': ['pao, frances', 'pão, francês', 'pao frances'],
  'pao de forma': ['pao, forma', 'pão, forma'],
  'leite': ['leite, de vaca', 'leite, integral', 'leite de vaca'],
  'leite integral': ['leite, de vaca, integral', 'leite, integral'],
  'leite desnatado': ['leite, de vaca, desnatado', 'leite, desnatado'],
  'queijo': ['queijo'],
  'queijo mussarela': ['queijo, mussarela', 'queijo, muçarela', 'mussarela'],
  'banana': ['banana', 'banana, prata', 'banana, nanica'],
  'maca': ['maca', 'maça', 'maçã'],
  'cafe': ['cafe', 'café, infusao', 'café, infusão'],
  'acucar': ['acucar', 'açúcar'],
  'manteiga': ['manteiga'],
  'azeite': ['azeite', 'azeite, de oliva'],
  'macarrao': ['macarrao', 'macarrão'],
  'carne de porco': ['carne, suina', 'carne, suína', 'porco'],
  'salmao': ['salmao', 'salmão'],
  'atum': ['atum'],
  'abacate': ['abacate'],
  'aveia': ['aveia'],
  'granola': ['granola'],
  'iogurte': ['iogurte'],
  'tomate': ['tomate'],
  'alface': ['alface'],
  'brocolis': ['brocolis', 'brócolis'],
  'cenoura': ['cenoura'],
  'whey': ['whey', 'proteina', 'suplemento'],
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Pontua relevância de um alimento dado a query do usuário.
 * Quanto MENOR o score, MAIS relevante.
 */
function relevanceScore(nome: string, query: string): number {
  const nomeNorm = removeAccents(nome)
  const queryNorm = removeAccents(query)

  // Match exato no início do nome = máxima relevância
  if (nomeNorm.startsWith(queryNorm)) return 0

  // Nome começa com a primeira palavra da query
  const firstWord = queryNorm.split(/[,\s]+/)[0]
  if (nomeNorm.startsWith(firstWord)) {
    // Nomes mais curtos = mais simples = mais relevante
    return 1 + nome.length / 1000
  }

  // Contém a query completa
  if (nomeNorm.includes(queryNorm)) return 2 + nome.length / 1000

  // Contém a primeira palavra
  if (nomeNorm.includes(firstWord)) return 3 + nome.length / 1000

  // TACO tem prioridade sobre TBCA (dados mais concisos)
  return 4 + nome.length / 1000
}

/**
 * GET /api/foods - Busca global de alimentos (TACO + TBCA + user foods)
 *
 * Query params:
 *   q        - Texto de busca (min 2 chars)
 *   category - Filtrar por categoria
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

      // Verificar se há apelidos para expandir a busca
      const aliasTerms = ALIASES[normalizedQuery] || []

      // Busca principal pelo termo do usuário
      const searchTerms = [normalizedQuery, ...aliasTerms]

      // Executa uma query por termo em paralelo e deduplica por id.
      // Motivo: os próprios alimentos têm vírgula no nome_busca (ex: "ovo, de galinha"),
      // o que quebraria o .or() do PostgREST (vírgula é separador de filtros).
      //
      // Cada termo é quebrado em tokens (por espaço/vírgula) e cada token vira um
      // ilike encadeado (AND). Isso permite casar "pão francês" (digitado pelo
      // usuário) com "pao, trigo, frances" (como está no banco) — os dois tokens
      // "pao" e "frances" aparecem, independente da ordem/pontuação.
      const runTermQuery = async (term: string) => {
        const tokens = term.split(/[\s,]+/).filter(t => t.length >= 2)
        const effective = tokens.length > 0 ? tokens : [term]

        let q = (supabase as SupabaseAny)
          .from('fitness_global_foods')
          .select('*')
          .eq('is_active', true)

        for (const token of effective) {
          q = q.ilike('nome_busca', `%${token}%`)
        }

        if (category) q = q.eq('categoria', category)
        if (sources && sources.length > 0) q = q.in('source', sources)

        // 500 por termo garante que alimentos TACO isolados não sejam cortados
        // quando o termo é popular em preparações TBCA (ex: "ovo", "frango").
        return q.limit(500)
      }

      const results = await Promise.all(searchTerms.map(runTermQuery))
      const firstError = results.find(r => r.error)?.error
      if (firstError) {
        console.error('Erro ao buscar alimentos globais:', firstError)
        return NextResponse.json({ error: firstError.message }, { status: 500 })
      }

      const byId = new Map<string, SupabaseAny>()
      for (const r of results) {
        for (const row of (r.data || [])) {
          if (!byId.has(row.id)) byId.set(row.id, row)
        }
      }
      allGlobalFoods = Array.from(byId.values())

      // Rankear por relevância
      allGlobalFoods.sort((a: SupabaseAny, b: SupabaseAny) => {
        const scoreA = relevanceScore(a.nome, query)
        const scoreB = relevanceScore(b.nome, query)

        // TACO tem prioridade sobre TBCA em caso de empate
        if (Math.abs(scoreA - scoreB) < 0.01) {
          if (a.source === 'taco' && b.source !== 'taco') return -1
          if (b.source === 'taco' && a.source !== 'taco') return 1
        }

        return scoreA - scoreB
      })

      // Aplicar paginação após ranking
      allGlobalFoods = allGlobalFoods.slice(offset, offset + limit)

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

    // Busca também nos alimentos do usuário
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

    const { data: userFoods, error: userError } = await userQuery

    if (userError) {
      console.error('Erro ao buscar alimentos do usuário:', userError)
    }

    // Helper: converte campo numérico opcional do banco para number ou null.
    const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)

    // Formatar resultados
    const formattedGlobal = allGlobalFoods.map((f: SupabaseAny) => ({
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
      ferro: num(f.ferro),
      colesterol: num(f.colesterol),
      zinco: num(f.zinco),
      selenio: num(f.selenio),
      magnesio: num(f.magnesio),
      porcoes_comuns: f.porcoes_comuns,
      is_favorite: false,
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
      is_favorite: f.is_favorite || false,
      is_user_created: true,
      source: f.source || 'manual',
    }))

    return NextResponse.json({
      success: true,
      foods: [...formattedUser, ...formattedGlobal],
      total: formattedUser.length + formattedGlobal.length,
    })
  } catch (error) {
    console.error('Erro na API foods:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
