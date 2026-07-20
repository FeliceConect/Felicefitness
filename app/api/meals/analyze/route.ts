import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logApiUsage } from '@/lib/admin/api-usage'
import OpenAI from 'openai'

// Análise com vision em detail:high pode levar >10s — garante tempo de sobra.
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Limite mensal de análises IA por paciente
const MONTHLY_LIMIT = 30

// Cap de payload: base64 de ~6MB binários (o client comprime para ~300-600KB;
// isso é apenas proteção contra abuso direto na API).
const MAX_BASE64_LENGTH = 8_000_000

interface AnalyzedFood {
  nome: string
  quantidade_g: number
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  categoria: string
  /** Vinculação com o banco de alimentos (pós-análise, best-effort) */
  food_id?: string
  db_nome?: string
}

function normalizeName(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Tenta casar cada alimento identificado pela IA com o banco global
 * (vincula food_id para favoritos/popularidade/consistência). Os macros
 * continuam sendo os estimados pela IA. Best-effort: se o RPC de busca
 * não existir ou o match for fraco, o item fica sem vínculo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function matchFoodsToDb(supabase: any, alimentos: AnalyzedFood[]): Promise<AnalyzedFood[]> {
  return Promise.all(alimentos.map(async (a) => {
    try {
      const query = normalizeName(a.nome)
      if (query.length < 3) return a
      const { data, error } = await supabase.rpc('fitness_search_foods', {
        p_terms: [query],
        p_category: null,
        p_sources: null,
        p_limit: 1,
        p_offset: 0,
      })
      const top = !error && data?.[0]
      if (!top) return a
      // Sanidade: o 1º token relevante do nome da IA precisa aparecer no match
      const firstToken = query.split(/\s+/).find(t => t.length >= 4) || query.split(/\s+/)[0]
      const haystack = `${top.nome_busca || ''} ${top.nome_popular_busca || ''}`
      if (!firstToken || !haystack.includes(firstToken)) return a
      return { ...a, food_id: top.id, db_nome: top.nome_popular || top.nome }
    } catch {
      return a
    }
  }))
}

const CATEGORIAS_VALIDAS = [
  'proteina', 'carboidrato', 'vegetal', 'fruta', 'laticinio', 'gordura',
  'bebida', 'prato_pronto', 'sobremesa', 'condimento', 'outros',
]

// Structured output: garante JSON válido sem depender de parsing frágil.
const RESPONSE_FORMAT: OpenAI.Chat.Completions.ChatCompletionCreateParams['response_format'] = {
  type: 'json_schema',
  json_schema: {
    name: 'meal_analysis',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        alimentos: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              nome: { type: 'string', description: 'Nome do alimento em português' },
              quantidade_g: { type: 'number', description: 'Quantidade estimada em gramas' },
              calorias: { type: 'number' },
              proteinas: { type: 'number' },
              carboidratos: { type: 'number' },
              gorduras: { type: 'number' },
              categoria: { type: 'string', enum: CATEGORIAS_VALIDAS },
            },
            required: ['nome', 'quantidade_g', 'calorias', 'proteinas', 'carboidratos', 'gorduras', 'categoria'],
          },
        },
        observacoes: { type: ['string', 'null'], description: 'Breve observação sobre o prato' },
        qualidade: { type: 'string', enum: ['excelente', 'boa', 'regular', 'ruim'] },
      },
      required: ['alimentos', 'observacoes', 'qualidade'],
    },
  },
}

const SYSTEM_PROMPT = `Você é um nutricionista especialista em análise de pratos e refeições.
Identifique TODOS os alimentos da refeição e estime as quantidades e macronutrientes.

Regras:
- Estime as quantidades em gramas (para foto: com base no tamanho visual; para descrição em texto: com base nas medidas caseiras citadas ou porções típicas brasileiras)
- Calcule macros realistas baseados em tabelas TACO/IBGE
- Se não conseguir identificar um item, use o nome mais provável
- Arredonde valores para inteiros
- Campo "qualidade" é a avaliação nutricional geral do prato`

function getMonthStartISO(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

// Conta análises do mês em fitness_api_usage — registro feito pela própria
// rota a cada chamada (fonte confiável; a contagem antiga via
// fitness_meals.analise_ia nunca era gravada e o limite não funcionava).
async function countMonthlyUsage(userId: string): Promise<number> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { count, error } = await admin
    .from('fitness_api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', 'meal_analysis')
    .gte('created_at', getMonthStartISO())

  if (error) {
    console.error('Erro ao contar uso de análises IA:', error)
    return 0
  }
  return count || 0
}

function isTransientError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === undefined || error.status >= 500 || error.status === 429
  }
  return error instanceof Error && /ECONNRESET|ETIMEDOUT|fetch failed/i.test(error.message)
}

async function callOpenAI(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  try {
    return await openai.chat.completions.create(params)
  } catch (error) {
    if (!isTransientError(error)) throw error
    // 1 retentativa em erro transitório (5xx / rede / rate limit da OpenAI)
    await new Promise(resolve => setTimeout(resolve, 1500))
    return await openai.chat.completions.create(params)
  }
}

// GET - Consulta a quota de análises do mês (exibida antes da 1ª análise)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const used = await countMonthlyUsage(user.id)
    return NextResponse.json({ success: true, used, limit: MONTHLY_LIMIT })
  } catch (error) {
    console.error('Erro ao consultar quota de análises:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Analisa refeição por foto (image_base64/image_url) ou texto (description)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const used = await countMonthlyUsage(user.id)
    if (used >= MONTHLY_LIMIT) {
      return NextResponse.json({
        success: false,
        error: `Limite de análises IA atingido este mês (${used}/${MONTHLY_LIMIT})`,
        limit_reached: true,
        used,
        limit: MONTHLY_LIMIT,
      }, { status: 429 })
    }

    const body = await request.json()
    const { image_base64, image_url, description } = body as {
      image_base64?: string
      image_url?: string
      description?: string
    }

    const hasImage = Boolean(image_base64 || image_url)
    const hasDescription = typeof description === 'string' && description.trim().length >= 3

    if (!hasImage && !hasDescription) {
      return NextResponse.json(
        { success: false, error: 'Envie uma imagem ou descreva a refeição' },
        { status: 400 }
      )
    }

    if (image_base64 && image_base64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { success: false, error: 'Imagem muito grande. Tente uma foto menor.' },
        { status: 413 }
      )
    }

    let userContent: OpenAI.Chat.Completions.ChatCompletionUserMessageParam['content']
    if (hasImage) {
      const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage = image_base64
        ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}`, detail: 'high' } }
        : { type: 'image_url', image_url: { url: image_url!, detail: 'high' } }

      userContent = [
        { type: 'text', text: 'Analise esta refeição e identifique todos os alimentos com seus macronutrientes:' },
        imageContent,
      ]
    } else {
      userContent = `Analise esta refeição descrita pelo paciente e identifique todos os alimentos com seus macronutrientes:\n\n"${description!.trim()}"`
    }

    const response = await callOpenAI({
      model: 'gpt-4o',
      max_tokens: 1500,
      response_format: RESPONSE_FORMAT,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })

    // Registrar custo de uso da OpenAI (best-effort — nunca quebra a request).
    // Este registro também é a base da contagem do limite mensal.
    await logApiUsage({
      userId: user.id,
      feature: 'meal_analysis',
      model: 'gpt-4o',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      endpoint: '/api/meals/analyze',
      metadata: { mode: hasImage ? 'photo' : 'text' },
    })

    const rawContent = response.choices[0]?.message?.content || ''

    let parsed: { alimentos: AnalyzedFood[]; observacoes?: string | null; qualidade?: string }
    try {
      // Com structured output o conteúdo já é JSON puro; a limpeza de cercas
      // markdown fica como defesa extra.
      const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Erro ao parsear resposta da IA:', rawContent)
      return NextResponse.json({
        success: false,
        error: hasImage
          ? 'A IA não retornou uma análise válida. Tente novamente com uma foto mais clara.'
          : 'A IA não retornou uma análise válida. Tente descrever a refeição de outra forma.',
      }, { status: 422 })
    }

    if (!parsed.alimentos || !Array.isArray(parsed.alimentos) || parsed.alimentos.length === 0) {
      return NextResponse.json({
        success: false,
        error: hasImage
          ? 'Não foi possível identificar alimentos na imagem. Tente uma foto com melhor iluminação.'
          : 'Não foi possível identificar alimentos na descrição. Tente detalhar mais o que comeu.',
      }, { status: 422 })
    }

    // Vincula os alimentos identificados ao banco (best-effort)
    const alimentosVinculados = await matchFoodsToDb(supabase, parsed.alimentos)

    const totais = parsed.alimentos.reduce(
      (acc, a) => ({
        calorias: acc.calorias + (a.calorias || 0),
        proteinas: acc.proteinas + (a.proteinas || 0),
        carboidratos: acc.carboidratos + (a.carboidratos || 0),
        gorduras: acc.gorduras + (a.gorduras || 0),
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    return NextResponse.json({
      success: true,
      alimentos: alimentosVinculados,
      totais,
      observacoes: parsed.observacoes || null,
      qualidade: parsed.qualidade || null,
      tokens_used: response.usage?.total_tokens || 0,
      usage: { used: used + 1, limit: MONTHLY_LIMIT },
    })
  } catch (error) {
    console.error('Erro na análise de refeição:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
