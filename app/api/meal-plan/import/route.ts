import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logApiUsage } from '@/lib/admin/api-usage'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const SYSTEM_PROMPT = `Você é um nutricionista assistente que converte um plano alimentar escrito em texto livre num JSON estruturado para um aplicativo.

Responda EXCLUSIVAMENTE com JSON válido (sem markdown, sem backticks, sem texto extra), neste formato:
{
  "name": "Plano Alimentar",
  "description": "",
  "daily_targets": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "special_rules": [ { "time": "11:00", "rule": "..." } ],
  "meals": [
    {
      "type": "breakfast",
      "name": "Café da manhã",
      "time": "07:00",
      "is_optional": false,
      "is_training_day_only": false,
      "notes": "",
      "options": [
        {
          "option": "A",
          "name": "Opção 1",
          "foods": [
            { "name": "pão de fermentação natural", "quantity": 1, "unit": "fatia", "calories": 80, "protein": 3, "carbs": 15, "fat": 1 }
          ]
        }
      ]
    }
  ]
}

REGRAS DE CONVERSÃO:
1. Cada bloco "HH:MM – Nome" vira uma refeição. Mapeie o "type" assim:
   - "Café da manhã" -> breakfast
   - "Lanche da manhã" -> morning_snack
   - "Almoço" -> lunch
   - "Lanche da tarde" -> afternoon_snack
   - "Jantar" -> dinner
   - "Ceia" -> supper
   - "Pré-treino" -> pre_workout
   - "Ao acordar" -> wake_up
   Se não reconhecer, escolha o mais próximo pelo horário.
2. "Opção 1", "Opção 2"... viram entradas em "options" (option "A", "B", "C"... na ordem). Dê um "name" curto e útil (ex.: "Opção 1" ou o alimento principal).
3. Se a refeição NÃO tiver opções explícitas (apenas uma lista de alimentos, possivelmente agrupados por "Proteína/Carboidrato/Legumes/Salada/Gordura"), crie UMA única opção (option "A", name "Padrão") contendo TODOS os alimentos. Ignore os rótulos de grupo — eles não são alimentos.
4. Quantidades: PRESERVE as medidas caseiras exatamente como escritas. "quantity" é o número e "unit" é a medida em minúsculo:
   - "30 g de queijo" -> { "name": "queijo", "quantity": 30, "unit": "g" }
   - "3 colheres de sopa de arroz" -> { "name": "arroz", "quantity": 3, "unit": "colher de sopa" }
   - "1 concha pequena de feijão" -> { "name": "feijão", "quantity": 1, "unit": "concha pequena" }
   - "1 fatia de pão" -> { "name": "pão", "quantity": 1, "unit": "fatia" }
5. "À vontade" -> { "quantity": null, "unit": "à vontade" }. Quando não houver quantidade, use quantity null e unit null.
6. "Mesmo padrão do almoço" (ou referências a outra refeição): COPIE os alimentos da refeição referenciada para esta.
7. ESTIME calorias e macros (protein/carbs/fat em gramas) de CADA alimento para a quantidade indicada, usando porções brasileiras padrão (ex.: 1 colher de sopa de arroz cozido ≈ 25 g; 1 concha de feijão ≈ 90 g). Arredonde para inteiros. Para itens "à vontade" (saladas/folhas), use valores baixos (ex.: 15-30 kcal). Nunca deixe os macros em branco — sempre estime.
8. "daily_targets" = soma estimada da PRIMEIRA opção (option "A") de cada refeição.
9. "special_rules": observações que não são alimentos (ex.: "Água ou bebida vegetal") podem virar uma regra com o horário da refeição, OU um food simples se for claramente um item. Use bom senso.
10. "name": gere um nome curto para o plano (ex.: "Plano Alimentar"). "description" pode ficar vazio.
11. is_optional/is_training_day_only = false, exceto se o texto disser o contrário.
Nunca invente refeições que não estão no texto. Use ponto decimal.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin: any = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAllowed = profile && ['super_admin', 'admin', 'nutritionist'].includes(profile.role)
    if (!isAllowed) {
      // Pode ser um nutricionista cujo papel está em fitness_professionals
      const { data: professional } = await supabaseAdmin
        .from('fitness_professionals')
        .select('type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (professional?.type !== 'nutritionist') {
        return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
      }
    }

    // Espera JSON { text }. (A importação agora é por texto colado.)
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Cole o texto do plano alimentar para importar.' },
        { status: 415 }
      )
    }

    const body = await request.json().catch(() => null)
    const text: string = (body?.text || '').toString().trim()

    if (!text || text.length < 20) {
      return NextResponse.json(
        { success: false, error: 'Cole o texto completo do plano alimentar (muito curto ou vazio).' },
        { status: 400 }
      )
    }
    if (text.length > 20000) {
      return NextResponse.json(
        { success: false, error: 'Texto muito longo. Cole um plano por vez.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Importação por IA não configurada (OPENAI_API_KEY ausente).' },
        { status: 503 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Converta este plano alimentar em JSON:\n\n${text}` },
      ],
    })

    // Custo (best-effort)
    await logApiUsage({
      userId: user.id,
      feature: 'meal_plan_import',
      model: 'gpt-4o',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      endpoint: '/api/meal-plan/import',
    }).catch(() => {})

    const raw = response.choices[0]?.message?.content || ''
    let parsed: Record<string, unknown>
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Erro parse meal-plan import:', raw)
      return NextResponse.json(
        { success: false, error: 'A IA não retornou um plano válido. Revise o texto e tente novamente.' },
        { status: 422 }
      )
    }

    // Validação mínima
    const meals = Array.isArray(parsed.meals) ? parsed.meals : []
    if (meals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível identificar refeições no texto. Confira o formato (ex.: "07:00 – Café da manhã").' },
        { status: 422 }
      )
    }

    // Garante daily_targets e arrays esperados
    if (!parsed.daily_targets) parsed.daily_targets = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    if (!Array.isArray(parsed.special_rules)) parsed.special_rules = []
    if (!parsed.name) parsed.name = 'Plano Alimentar'

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    console.error('Erro import meal-plan:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar o plano alimentar', details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}
