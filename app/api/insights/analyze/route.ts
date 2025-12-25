import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { fetchAllUserData, prepareContextForAI } from '@/lib/insights/analyzer'
import { ANALYSIS_PROMPT } from '@/lib/insights/prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  void request // Required by Next.js route handler
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key do OpenAI não configurada' },
        { status: 500 }
      )
    }

    // Buscar dados do usuário
    const userData = await fetchAllUserData(user.id)
    const context = prepareContextForAI(userData)

    // Chamar GPT-4 para análise profunda
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: `Analise os seguintes dados do usuário:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('Resposta vazia do modelo')
    }

    const analysis = JSON.parse(content)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing data:', error)
    return NextResponse.json({ error: 'Erro ao analisar dados' }, { status: 500 })
  }
}
