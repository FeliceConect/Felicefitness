import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logApiUsage } from '@/lib/admin/api-usage'
import OpenAI from 'openai'
import { isManagerAdmin } from '@/lib/auth/admin-gate'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const SYSTEM_PROMPT = `Você é um nutricionista assistente que converte um plano alimentar escrito em texto livre num JSON estruturado para um aplicativo. Seja FIEL e COMPLETO: nunca descarte alimentos nem opções de escolha.

Responda EXCLUSIVAMENTE com JSON válido (sem markdown, sem backticks, sem texto extra), neste formato:
{
  "name": "Plano Alimentar",
  "description": "",
  "daily_targets": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "special_rules": [ { "time": "11:00", "rule": "..." } ],
  "meals": [
    {
      "type": "lunch",
      "name": "Almoço",
      "time": "12:00",
      "is_optional": false,
      "is_training_day_only": false,
      "notes": "",
      "total_calories": 0, "total_protein": 0, "total_carbs": 0, "total_fat": 0,
      "options": [
        {
          "option": "A",
          "name": "Padrão",
          "foods": [
            { "name": "frango grelhado", "quantity": 120, "unit": "g", "group": "Proteína", "calories": 198, "protein": 37, "carbs": 0, "fat": 4 },
            { "name": "peixe grelhado", "quantity": 120, "unit": "g", "group": "Proteína", "calories": 158, "protein": 30, "carbs": 0, "fat": 4 },
            { "name": "arroz", "quantity": 3, "unit": "colher de sopa", "group": "Carboidrato", "calories": 90, "protein": 2, "carbs": 19, "fat": 0 },
            { "name": "batata-doce cozida", "quantity": 100, "unit": "g", "group": "Carboidrato", "calories": 86, "protein": 2, "carbs": 20, "fat": 0 },
            { "name": "legumes cozidos (abobrinha, chuchu, brócolis...)", "quantity": 140, "unit": "g", "calories": 40, "protein": 3, "carbs": 7, "fat": 0 },
            { "name": "salada crua", "quantity": null, "unit": "à vontade", "calories": 20, "protein": 1, "carbs": 3, "fat": 0 },
            { "name": "azeite de oliva extra virgem", "quantity": 1, "unit": "colher de chá", "calories": 40, "protein": 0, "carbs": 0, "fat": 4 }
          ]
        }
      ]
    }
  ]
}

REGRAS DE CONVERSÃO:
1. Cada bloco "HH:MM – Nome" (ou "HH:MMh – Nome") vira uma refeição. Mapeie "type":
   - Café da manhã -> breakfast | Lanche da manhã -> morning_snack | Almoço -> lunch
   - Lanche da tarde -> afternoon_snack | Jantar -> dinner | Ceia -> supper
   - Pré-treino/Antes do treino/Treino -> pre_workout | Ao acordar -> wake_up
   "Se houver fome" e similares -> snack opcional (is_optional=true). Use o horário para escolher se não reconhecer.

2. OPÇÕES DE REFEIÇÃO ("Opção 1", "Opção 2", "Opção 3 – Crepioca"...): cada uma vira uma entrada em "options" (option "A","B","C"... na ordem). "name" = o nome da opção/receita (ex.: "Crepioca", "Bolinho de banana") ou "Opção N".

3. GRUPOS DE ESCOLHA — MUITO IMPORTANTE (não perca opções!):
   Quando um componente da refeição traz VÁRIAS alternativas a escolher (escolher 1), gere UM alimento para CADA alternativa, todas com o MESMO "group" (o nome do componente). Reconheça estes casos:
   - "Proteína (escolher 1): A / B / C" (em linhas ou separadas por vírgula)
   - "Proteína (120 g): carne, frango, peixe, hambúrguer ou 3 ovos" (todas viram itens do group "Proteína")
   - "Carboidrato (escolher 1): arroz + feijão; 100 g de mandioca; 100 g de batata-doce; ..."
   - "1 fruta (escolher 1): kiwi, goiaba, morango..." -> group "Fruta"
   - "Sobremesa (escolher 1): ..." -> group "Sobremesa"
   - "A OU B" inline (ex.: "1 pão francês OU 2 fatias de pão de forma") -> os dois viram itens do mesmo group (ex.: "Pão").
   Groups comuns: "Proteína", "Carboidrato", "Fruta", "Sobremesa", "Pão", "Legumes". MANTENHA TODAS as alternativas — esse é o erro mais comum: NÃO reduza a uma só.

4. ALIMENTOS FIXOS (sem escolha) ficam SEM "group": ex.: "Legumes cozidos: 140 g", "Salada à vontade", "1 colher de chá de azeite", itens soltos de uma Opção. Não invente group para eles.

5. REFEIÇÃO SEM "Opção" mas com componentes (típico do Almoço/Jantar): crie UMA única opção (option "A", name "Padrão") com todos os componentes — os de escolha viram groups (regra 3), os fixos sem group (regra 4).

6. Quantidades: PRESERVE as medidas caseiras. "quantity"=número, "unit"=medida em minúsculo:
   "30 g de queijo" -> {quantity:30, unit:"g"}; "3 colheres de sopa de arroz" -> {quantity:3, unit:"colher de sopa"};
   "1 concha pequena de feijão" -> {quantity:1, unit:"concha pequena"}; "1 fatia de pão" -> {quantity:1, unit:"fatia"}.
   "À vontade" -> {quantity:null, unit:"à vontade"}. Sem quantidade clara -> quantity null.

7. REFERÊNCIAS a outra refeição ("Mesmo padrão do almoço", "Seguir as mesmas opções do almoço", "Repetir o almoço"): COPIE integralmente as opções/foods (incluindo os groups de escolha) da refeição referenciada.

8. RECEITAS / "Modo de preparo" / "Marmitas" (combinações sugeridas numeradas): coloque o passo a passo e as sugestões no "notes" da refeição. Os ingredientes da receita entram como foods normais.

9. ESTIME calorias e macros (protein/carbs/fat em g) de CADA alimento para a quantidade indicada (porções brasileiras: 1 colher de sopa de arroz cozido ≈ 25 g; 1 concha de feijão ≈ 90 g; saladas "à vontade" ≈ 15-30 kcal). Arredonde para inteiros. Sempre estime — nunca deixe em branco.

10. TOTAIS por refeição (total_calories/total_protein/total_carbs/total_fat): some os alimentos FIXOS + UMA opção de cada group de escolha (use a primeira de cada group). Não some todas as alternativas de um group.

11. "daily_targets": some os totais (regra 10) da PRIMEIRA opção (option "A") de cada refeição. Se o texto trouxer uma estimativa/intervalo (ex.: "1450–1520 kcal"), use o ponto médio.

12. "special_rules": regras gerais que não são alimento (ex.: "SEM alho e SEM cebola", "beber água"). "name" do plano: curto (ex.: "Plano Alimentar"); pode usar o nome da pessoa/título se houver.

Nunca invente refeições. Use ponto decimal.`

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
      .select('role, admin_type')
      .eq('id', user.id)
      .single()

    // Gestor (manager) não importa plano alimentar — cai na checagem de
    // nutricionista e é negado.
    const isAllowed = profile && ['super_admin', 'admin', 'nutritionist'].includes(profile.role) && !isManagerAdmin(profile)
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

    // Modelos 5.x não aceitam temperature customizada (só o default) —
    // a determinização vem do reasoning_effort 'none' + prompt.
    const response = await openai.chat.completions.create({
      model: 'gpt-5.6-luna',
      reasoning_effort: 'none',
      // Planos grandes (muitas opções "escolher 1" + macros por alimento)
      // geram JSON longo; teto alto evita truncar e quebrar o JSON.
      max_completion_tokens: 16000,
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
      model: 'gpt-5.6-luna',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      endpoint: '/api/meal-plan/import',
    }).catch(() => {})

    const raw = response.choices[0]?.message?.content || ''
    const truncated = response.choices[0]?.finish_reason === 'length'
    let parsed: Record<string, unknown>
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Erro parse meal-plan import (truncated=' + truncated + '):', raw.slice(-400))
      return NextResponse.json(
        {
          success: false,
          error: truncated
            ? 'O plano é muito grande e a IA cortou no meio. Importe uma parte por vez (ex.: separe café/almoço de lanche/jantar) e tente novamente.'
            : 'A IA não retornou um plano válido. Revise o texto e tente novamente.',
        },
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
