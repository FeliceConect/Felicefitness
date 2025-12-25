import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { analyzeUserData, prepareContextForAI } from '@/lib/insights/analyzer'
import { fetchAllUserData } from '@/lib/insights/analyzer'
import { INSIGHTS_SYSTEM_PROMPT, generateUserContextPrompt } from '@/lib/insights/prompts'

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

    // Gerar insights locais primeiro
    const localInsights = await analyzeUserData(user.id)

    // Salvar insights locais no banco
    for (const insight of localInsights) {
      await supabase.from('fitness_insights').upsert(
        {
          user_id: user.id,
          type: insight.type,
          priority: insight.priority,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          icon: insight.icon,
          data: insight.data || null,
          action: insight.action || null,
          created_at: insight.createdAt.toISOString(),
        } as never,
        {
          onConflict: 'user_id,type,category,title',
        }
      )
    }

    // Se houver API key do OpenAI, gerar insights adicionais com IA
    let aiInsights: { insights: unknown[]; summary: string } = {
      insights: [],
      summary: '',
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const userData = await fetchAllUserData(user.id)
        const context = prepareContextForAI(userData)
        const userPrompt = generateUserContextPrompt(context)

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: INSIGHTS_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2000,
          temperature: 0.7,
        })

        const content = completion.choices[0].message.content
        if (content) {
          aiInsights = JSON.parse(content)

          // Salvar insights da IA
          if (aiInsights.insights && Array.isArray(aiInsights.insights)) {
            for (const insight of aiInsights.insights) {
              const typedInsight = insight as {
                type: string
                priority: string
                category: string
                title: string
                description: string
                icon?: string
                data?: Record<string, unknown>
                action?: Record<string, unknown>
              }

              await supabase.from('fitness_insights').upsert(
                {
                  user_id: user.id,
                  type: typedInsight.type,
                  priority: typedInsight.priority,
                  category: typedInsight.category,
                  title: typedInsight.title,
                  description: typedInsight.description,
                  icon: typedInsight.icon || '💡',
                  data: typedInsight.data || null,
                  action: typedInsight.action || null,
                  created_at: new Date().toISOString(),
                } as never,
                {
                  onConflict: 'user_id,type,category,title',
                }
              )
            }
          }
        }
      } catch (aiError) {
        console.error('Error generating AI insights:', aiError)
        // Continuar sem insights de IA
      }
    }

    return NextResponse.json({
      success: true,
      localInsights: localInsights.length,
      aiInsights: aiInsights.insights?.length || 0,
      summary: aiInsights.summary || 'Insights gerados com sucesso',
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json({ error: 'Erro ao gerar insights' }, { status: 500 })
  }
}
