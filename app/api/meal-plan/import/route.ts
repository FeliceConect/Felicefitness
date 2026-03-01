import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { extractText } from 'unpdf'

// Extract text from PDF using unpdf
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // unpdf expects Uint8Array, not Buffer
    const uint8Array = new Uint8Array(buffer)
    const { text } = await extractText(uint8Array)
    // text is an array of strings (one per page), join them
    return Array.isArray(text) ? text.join('\n') : text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw error
  }
}

// Tipos para o plano alimentar estruturado
interface MealOption {
  option: string // A, B, C, D, E, F
  name: string
  foods: Array<{
    name: string
    quantity?: number
    unit?: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }>
}

interface MealSlot {
  type: string // wake_up, breakfast, morning_snack, lunch, afternoon_snack, pre_workout, dinner, supper
  name: string // Nome customizado
  time: string // Horário "05:00", "05:45-06:30"
  target_protein?: number
  target_carbs?: number
  target_fat?: number
  is_optional: boolean
  is_training_day_only: boolean
  restrictions?: string[] // "no_dairy", etc
  notes?: string
  options: MealOption[]
}

interface ParsedMealPlan {
  name: string
  description?: string
  daily_targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  special_rules: Array<{
    time?: string
    rule: string
  }>
  meals: MealSlot[]
}

const MEAL_PLAN_PROMPT = `Você é um especialista em nutrição. Analise este plano alimentar e extraia TODOS os dados de forma estruturada.

## INSTRUÇÕES:

1. Extraia as metas diárias (calorias, proteína, carboidratos, gordura)
2. Para cada refeição/slot de horário:
   - Identifique o tipo (café da manhã, lanche, almoço, etc)
   - Extraia TODAS as opções (A, B, C, D, E, F...)
   - Para cada opção, liste todos os alimentos com quantidades
   - ESTIME os valores nutricionais (calorias, proteína, carboidratos, gordura) para cada alimento baseado na quantidade
   - Marque se é opcional ou apenas para dias de treino
   - Identifique restrições (ex: "sem laticínios")
3. Identifique regras especiais (jejum, horários de medicamentos, etc)

## TIPOS DE REFEIÇÃO:
- wake_up: Ao acordar
- breakfast: Café da manhã
- morning_snack: Lanche da manhã
- lunch: Almoço
- afternoon_snack: Lanche da tarde
- pre_workout: Pré-treino
- dinner: Jantar
- supper: Ceia

## FORMATO DE RESPOSTA (JSON):
{
  "name": "Nome do plano",
  "description": "Descrição opcional",
  "daily_targets": {
    "calories": 2150,
    "protein": 185,
    "carbs": 190,
    "fat": 70
  },
  "special_rules": [],
  "meals": [
    {
      "type": "breakfast",
      "name": "Café da Manhã Pós-Treino",
      "time": "05:45-06:30",
      "target_protein": 40,
      "target_carbs": 45,
      "target_fat": 18,
      "is_optional": false,
      "is_training_day_only": false,
      "restrictions": [],
      "notes": "",
      "options": [
        {
          "option": "A",
          "name": "Ovos completo",
          "foods": [
            { "name": "Ovos mexidos na manteiga", "quantity": 3, "unit": "unid", "calories": 270, "protein": 18, "carbs": 2, "fat": 21 },
            { "name": "Pão integral com queijo", "quantity": 2, "unit": "fatias", "calories": 200, "protein": 10, "carbs": 28, "fat": 6 },
            { "name": "Banana", "quantity": 1, "unit": "unid", "calories": 105, "protein": 1, "carbs": 27, "fat": 0 }
          ]
        },
        {
          "option": "B",
          "name": "Shake rápido",
          "foods": [...]
        }
      ]
    }
  ]
}

IMPORTANTE:
- EXTRAIA ABSOLUTAMENTE TODAS AS OPÇÕES E ALIMENTOS. Não resuma nem omita nada.
- ESTIME valores nutricionais realistas para CADA alimento baseado na quantidade especificada.
- Use valores aproximados de tabelas nutricionais brasileiras (TACO).
- RESPONDA APENAS COM O JSON, sem markdown ou explicações.`

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user is superadmin or nutritionist
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    const profileData = profile as unknown as { role?: string; email?: string } | null
    const isSuperAdmin = profileData?.email === 'felicemed@gmail.com' || profileData?.role === 'super_admin'

    // Check if user is a nutritionist
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    const professionalData = professional as unknown as { id?: string; type?: string } | null
    const isNutritionist = professionalData?.type === 'nutritionist'

    if (!isSuperAdmin && !isNutritionist) {
      return NextResponse.json(
        { error: 'Acesso restrito a superadmins e nutricionistas' },
        { status: 403 }
      )
    }

    // Get content from request
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const textContent = formData.get('text') as string | null
    const clientId = formData.get('clientId') as string | null

    if (!file && !textContent) {
      return NextResponse.json(
        { error: 'Forneça um arquivo ou texto do plano alimentar' },
        { status: 400 }
      )
    }

    let contentToAnalyze: string | { type: 'image'; data: string; mimeType: string }

    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Check if it's a PDF or image
      if (file.type === 'application/pdf') {
        // Extract text from PDF using pdf-parse
        try {
          const pdfText = await parsePDF(buffer)
          contentToAnalyze = pdfText

          if (!contentToAnalyze || contentToAnalyze.trim().length < 50) {
            // PDF might be image-based, can't extract text
            return NextResponse.json({
              error: 'PDF parece ser baseado em imagem. Por favor, envie como foto/screenshot ou extraia o texto manualmente.',
              hint: 'Tente tirar uma foto do plano ou copiar o texto'
            }, { status: 400 })
          }
        } catch (pdfError) {
          console.error('PDF parse error:', pdfError)
          return NextResponse.json({
            error: 'Erro ao processar PDF. Tente enviar como imagem.',
            details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
          }, { status: 400 })
        }
      } else if (file.type.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        contentToAnalyze = {
          type: 'image',
          data: base64,
          mimeType: file.type
        }
      } else {
        // Try to read as text
        contentToAnalyze = buffer.toString('utf-8')
      }
    } else {
      contentToAnalyze = textContent!
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Call GPT-4 Vision
    let response
    if (typeof contentToAnalyze === 'object' && contentToAnalyze.type === 'image') {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: MEAL_PLAN_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${contentToAnalyze.mimeType};base64,${contentToAnalyze.data}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 8000,
        temperature: 0.1,
      })
    } else {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `${MEAL_PLAN_PROMPT}\n\n--- PLANO ALIMENTAR ---\n${contentToAnalyze}`,
          },
        ],
        max_tokens: 8000,
        temperature: 0.1,
      })
    }

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Não foi possível analisar o plano alimentar' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let parsedPlan: ParsedMealPlan
    try {
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      parsedPlan = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Error parsing meal plan:', parseError, content)
      return NextResponse.json({
        error: 'Erro ao processar dados do plano',
        raw_response: content
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: parsedPlan,
      professional_id: professionalData?.id || null,
      client_id: clientId
    })

  } catch (error) {
    console.error('Meal plan import error:', error)

    // Provide more specific error messages
    let errorMessage = 'Erro interno ao importar plano alimentar'
    const errorDetails = error instanceof Error ? error.message : 'Unknown error'

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Erro de configuração: chave da API não configurada'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Limite de requisições atingido. Aguarde alguns minutos.'
      } else if (error.message.includes('model')) {
        errorMessage = 'Erro ao acessar modelo de IA'
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
  }
}
