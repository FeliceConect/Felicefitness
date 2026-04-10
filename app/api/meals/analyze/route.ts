import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalyzedFood {
  nome: string
  quantidade_g: number
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  categoria: string
}

// POST - Analyze meal photo with GPT-4 Vision
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    // Rate limit: 15 análises por mês
    const MONTHLY_LIMIT = 15
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: analysisCount } = await (supabase as any)
      .from('fitness_meals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('analise_ia', 'is', null)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    const used = analysisCount || 0
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
    const { image_base64, image_url } = body

    if (!image_base64 && !image_url) {
      return NextResponse.json({ success: false, error: 'Envie uma imagem (base64 ou URL)' }, { status: 400 })
    }

    // Build the image content for GPT-4 Vision
    const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage = image_base64
      ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}`, detail: 'high' } }
      : { type: 'image_url', image_url: { url: image_url, detail: 'high' } }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `Você é um nutricionista especialista em análise de pratos e refeições.
Ao receber a foto de uma refeição, identifique TODOS os alimentos visíveis e estime as quantidades e macronutrientes.

Responda EXCLUSIVAMENTE em JSON válido, sem markdown, sem backticks, sem texto extra.
Use o formato:
{
  "alimentos": [
    {
      "nome": "Nome do alimento em português",
      "quantidade_g": 150,
      "calorias": 200,
      "proteinas": 25,
      "carboidratos": 10,
      "gorduras": 8,
      "categoria": "proteina"
    }
  ],
  "observacoes": "Breve observação sobre o prato (opcional)",
  "qualidade": "boa"
}

Categorias válidas: proteina, carboidrato, vegetal, fruta, laticinio, gordura, bebida, prato_pronto, sobremesa, condimento, outros.
Campo "qualidade" pode ser: "excelente", "boa", "regular", "ruim" (avaliação nutricional geral do prato).

Regras:
- Estime as quantidades em gramas com base no tamanho visual
- Calcule macros realistas baseados em tabelas TACO/IBGE
- Se não conseguir identificar um item, use o nome mais provável
- Arredonde valores para inteiros
- Sempre retorne JSON válido`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analise esta refeição e identifique todos os alimentos com seus macronutrientes:' },
            imageContent,
          ],
        },
      ],
    })

    const rawContent = response.choices[0]?.message?.content || ''

    // Parse the JSON response, handling potential markdown wrapping
    let parsed: { alimentos: AnalyzedFood[]; observacoes?: string; qualidade?: string }
    try {
      // Remove markdown code blocks if present
      const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Erro ao parsear resposta da IA:', rawContent)
      return NextResponse.json({
        success: false,
        error: 'A IA não retornou uma análise válida. Tente novamente com uma foto mais clara.',
      }, { status: 422 })
    }

    if (!parsed.alimentos || !Array.isArray(parsed.alimentos) || parsed.alimentos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Não foi possível identificar alimentos na imagem. Tente uma foto com melhor iluminação.',
      }, { status: 422 })
    }

    // Calculate totals
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
      alimentos: parsed.alimentos,
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
