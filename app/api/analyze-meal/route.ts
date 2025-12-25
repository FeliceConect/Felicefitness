import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  openai,
  validateOpenAIConfig,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  MEAL_ANALYSIS_USER_PROMPT,
  parseAIResponse,
  convertToMealAnalysisResult,
  handleAnalysisError,
  FALLBACK_RESPONSE
} from '@/lib/openai'

export const maxDuration = 30 // Timeout de 30 segundos

export async function POST(request: NextRequest) {
  try {
    // Verificar configuração da OpenAI
    if (!validateOpenAIConfig()) {
      return NextResponse.json(
        { success: false, error: 'Serviço de IA não configurado' },
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
          content: MEAL_ANALYSIS_SYSTEM_PROMPT
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
              text: MEAL_ANALYSIS_USER_PROMPT
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3 // Mais determinístico para dados nutricionais
    })

    // Extrair resposta
    const content = response.choices[0]?.message?.content

    if (!content) {
      console.error('Resposta vazia da IA')
      return NextResponse.json(FALLBACK_RESPONSE, { status: 200 })
    }

    // Parsear resposta
    const parsedResponse = parseAIResponse(content)
    const analysisResult = convertToMealAnalysisResult(parsedResponse)

    // Log para debug (remover em produção)
    console.log('Análise concluída:', {
      success: analysisResult.success,
      itemsCount: analysisResult.items.length,
      totals: analysisResult.totals,
      tokensUsed: response.usage?.total_tokens
    })

    // TODO: Salvar análise no histórico quando a tabela fitness_meal_analyses existir
    // Por enquanto, apenas logar os tokens usados
    if (response.usage?.total_tokens) {
      console.log(`Análise usou ${response.usage.total_tokens} tokens`)
    }

    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('Erro na análise:', error)

    const errorMessage = handleAnalysisError(error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        items: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        suggestions: [],
        warnings: []
      },
      { status: 500 }
    )
  }
}
