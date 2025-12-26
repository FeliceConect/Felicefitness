import { NextResponse } from 'next/server'
import { openai, validateOpenAIConfig } from '@/lib/openai'

export async function GET() {
  try {
    // Verificar configuração
    const key = process.env.OPENAI_API_KEY
    const isConfigValid = validateOpenAIConfig()

    // Informações de debug (sem expor a chave completa)
    const debugInfo = {
      hasKey: !!key,
      keyLength: key?.length || 0,
      keyPrefix: key?.substring(0, 10) || 'N/A',
      keySuffix: key?.substring(key.length - 4) || 'N/A',
      isConfigValid,
      envCheck: process.env.NODE_ENV
    }

    if (!isConfigValid) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI config validation failed',
        debug: debugInfo
      }, { status: 500 })
    }

    // Tentar fazer uma chamada simples para a API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "API working" in 2 words' }],
      max_tokens: 10
    })

    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working!',
      response: response.choices[0]?.message?.content,
      debug: debugInfo
    })

  } catch (error) {
    console.error('OpenAI test error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      debug: {
        hasKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
      }
    }, { status: 500 })
  }
}
