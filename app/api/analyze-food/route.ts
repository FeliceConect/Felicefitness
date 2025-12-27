import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  openai,
  validateOpenAIConfig,
  FOOD_ANALYSIS_SYSTEM_PROMPT,
  FOOD_ANALYSIS_USER_PROMPT,
  FOOD_ANALYSIS_FALLBACK,
  handleAnalysisError
} from '@/lib/openai'

export const maxDuration = 30 // Timeout de 30 segundos

// Tipo para resposta da IA
interface FoodAnalysisResponse {
  success: boolean
  error?: string
  food?: {
    nome: string
    categoria: string
    descricao?: string
    porcao_padrao: number
    unidade: 'g' | 'ml' | 'unidade'
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
    fibras?: number
    porcoes_comuns?: Array<{
      label: string
      grams: number
      isDefault?: boolean
    }>
  }
  porcao_estimada?: {
    grams: number
    descricao: string
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
  }
  dicas?: string[]
  confidence?: 'alto' | 'medio' | 'baixo'
}

// Parsear resposta da IA
function parseFoodResponse(content: string): FoodAnalysisResponse {
  try {
    // Limpar resposta - remover markdown se houver
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(cleanContent)
    return parsed as FoodAnalysisResponse
  } catch {
    console.error('Erro ao parsear resposta da IA:', content)
    return {
      success: false,
      error: 'Erro ao processar resposta da IA'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar configuração da OpenAI
    if (!validateOpenAIConfig()) {
      console.error('OpenAI validation failed - OPENAI_API_KEY may be missing or invalid')
      return NextResponse.json(
        { success: false, error: 'Erro de configuração do serviço de IA. Verifique OPENAI_API_KEY.' },
        { status: 500 }
      )
    }

    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter imagem do request
    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Imagem não fornecida' },
        { status: 400 }
      )
    }

    // Verificar tamanho da imagem (max 4MB para GPT-4 Vision)
    if (image.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Imagem muito grande. Máximo 4MB.' },
        { status: 400 }
      )
    }

    // Verificar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(image.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagem inválido. Use JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    // Converter para base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = image.type || 'image/jpeg'

    // Chamar GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: FOOD_ANALYSIS_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: FOOD_ANALYSIS_USER_PROMPT
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3 // Mais determinístico para dados nutricionais
    })

    // Extrair resposta
    const content = response.choices[0]?.message?.content

    if (!content) {
      console.error('Resposta vazia da IA')
      return NextResponse.json(FOOD_ANALYSIS_FALLBACK, { status: 200 })
    }

    // Parsear resposta
    const analysisResult = parseFoodResponse(content)

    // Log para debug
    console.log('=== ANÁLISE DE ALIMENTO ===')
    console.log('Análise concluída:', {
      success: analysisResult.success,
      food: analysisResult.food?.nome,
      confidence: analysisResult.confidence,
      tokensUsed: response.usage?.total_tokens
    })

    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('Erro na análise de alimento:', error)

    const errorMessage = handleAnalysisError(error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        food: null,
        porcao_estimada: null,
        dicas: [],
        confidence: 'baixo'
      },
      { status: 500 }
    )
  }
}
