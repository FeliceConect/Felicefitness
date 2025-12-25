import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { fetchAllUserData, prepareContextForAI } from '@/lib/insights/analyzer'
import { WEEKLY_REPORT_PROMPT } from '@/lib/insights/prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'weekly'

    // Buscar relatório mais recente do banco
    const { data: existingReport } = (await supabase
      .from('fitness_ai_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('tipo', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()) as {
      data: {
        id: string
        user_id: string
        tipo: string
        periodo_inicio: string
        periodo_fim: string
        conteudo: Record<string, unknown>
        created_at: string
      } | null
    }

    if (existingReport) {
      const content = existingReport.conteudo as {
        summary?: string
        score?: number
        highlights?: string[]
        warnings?: string[]
        sections?: unknown[]
        recommendations?: string[]
      }

      return NextResponse.json({
        id: existingReport.id,
        userId: existingReport.user_id,
        type: existingReport.tipo,
        periodStart: existingReport.periodo_inicio,
        periodEnd: existingReport.periodo_fim,
        summary: content.summary || '',
        score: content.score || 0,
        highlights: content.highlights || [],
        warnings: content.warnings || [],
        sections: content.sections || [],
        recommendations: content.recommendations || [],
        createdAt: existingReport.created_at,
      })
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const type = body.type || 'weekly'

    // Calcular período
    const periodEnd = new Date()
    const periodStart = new Date()
    if (type === 'weekly') {
      periodStart.setDate(periodStart.getDate() - 7)
    } else if (type === 'monthly') {
      periodStart.setMonth(periodStart.getMonth() - 1)
    }

    // Buscar dados do usuário
    const userData = await fetchAllUserData(user.id)
    const context = prepareContextForAI(userData)

    // Dados básicos para relatório sem IA
    let reportContent = {
      summary: `Relatório ${type === 'weekly' ? 'semanal' : 'mensal'} do seu progresso fitness.`,
      score: calculateBasicScore(context),
      highlights: generateBasicHighlights(context),
      warnings: generateBasicWarnings(context),
      sections: generateBasicSections(context),
      recommendations: generateBasicRecommendations(context),
    }

    // Se houver API key do OpenAI, gerar relatório com IA
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: WEEKLY_REPORT_PROMPT,
            },
            {
              role: 'user',
              content: `Gere um relatório ${type === 'weekly' ? 'semanal' : 'mensal'} baseado nos seguintes dados:\n\n${JSON.stringify(context, null, 2)}`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 3000,
          temperature: 0.7,
        })

        const content = completion.choices[0].message.content
        if (content) {
          reportContent = JSON.parse(content)
        }
      } catch (aiError) {
        console.error('Error generating AI report:', aiError)
        // Continuar com relatório básico
      }
    }

    // Salvar relatório no banco
    const { data: savedReport, error: saveError } = (await supabase
      .from('fitness_ai_reports')
      .insert({
        user_id: user.id,
        tipo: type,
        periodo_inicio: periodStart.toISOString().split('T')[0],
        periodo_fim: periodEnd.toISOString().split('T')[0],
        conteudo: reportContent,
      } as never)
      .select()
      .single()) as {
      data: {
        id: string
        user_id: string
        tipo: string
        periodo_inicio: string
        periodo_fim: string
        conteudo: Record<string, unknown>
        created_at: string
      } | null
      error: Error | null
    }

    if (saveError) {
      console.error('Error saving report:', saveError)
    }

    return NextResponse.json({
      id: savedReport?.id || `report_${Date.now()}`,
      userId: user.id,
      type,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      ...reportContent,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}

// Funções auxiliares para relatório básico sem IA

function calculateBasicScore(userData: ReturnType<typeof prepareContextForAI>): number {
  let score = 50

  // Treino (até 25 pontos)
  const workoutCount = (userData as { workout?: { totalWorkoutsLast30Days?: number } }).workout?.totalWorkoutsLast30Days || 0
  score += Math.min(25, workoutCount * 2)

  // Sono (até 15 pontos)
  const avgSleep = (userData as { sleep?: { averageDuration?: number } }).sleep?.averageDuration || 0
  if (avgSleep >= 7) score += 15
  else if (avgSleep >= 6) score += 10
  else if (avgSleep >= 5) score += 5

  // Streak (até 10 pontos)
  const streak = (userData as { streak?: number }).streak || 0
  score += Math.min(10, streak)

  return Math.min(100, score)
}

function generateBasicHighlights(userData: ReturnType<typeof prepareContextForAI>): string[] {
  const highlights: string[] = []
  const data = userData as {
    workout?: { totalWorkoutsLast30Days?: number }
    streak?: number
    nutrition?: { averageProtein?: number; proteinGoal?: number }
  }

  const workouts = data.workout?.totalWorkoutsLast30Days || 0
  if (workouts >= 12) {
    highlights.push(`${workouts} treinos realizados no último mês`)
  }

  const streak = data.streak || 0
  if (streak >= 7) {
    highlights.push(`Streak de ${streak} dias consecutivos`)
  }

  const avgProtein = data.nutrition?.averageProtein || 0
  const proteinGoal = data.nutrition?.proteinGoal || 0
  if (avgProtein >= proteinGoal * 0.9) {
    highlights.push(`Meta de proteína atingida: ${avgProtein.toFixed(0)}g/dia`)
  }

  if (highlights.length === 0) {
    highlights.push('Continue trabalhando para atingir suas metas!')
  }

  return highlights
}

function generateBasicWarnings(userData: ReturnType<typeof prepareContextForAI>): string[] {
  const warnings: string[] = []
  const data = userData as {
    sleep?: { averageDuration?: number }
    lowStockSupplements?: Array<{ name: string; daysRemaining: number }>
    nutrition?: { averageCalories?: number; caloriesGoal?: number }
  }

  const avgSleep = data.sleep?.averageDuration || 0
  if (avgSleep < 6.5 && avgSleep > 0) {
    warnings.push(`Sono médio de ${avgSleep.toFixed(1)}h - abaixo do ideal`)
  }

  const lowStock = data.lowStockSupplements || []
  lowStock.forEach((s) => {
    warnings.push(`Estoque baixo: ${s.name} (${s.daysRemaining} dias)`)
  })

  const avgCalories = data.nutrition?.averageCalories || 0
  const caloriesGoal = data.nutrition?.caloriesGoal || 0
  if (caloriesGoal - avgCalories > 500) {
    warnings.push(`Déficit calórico alto: ${Math.round(caloriesGoal - avgCalories)} kcal`)
  }

  return warnings
}

function generateBasicSections(userData: ReturnType<typeof prepareContextForAI>): Array<{
  title: string
  icon: string
  content: string
  metrics?: Array<{ label: string; value: string; trend?: 'up' | 'down' | 'stable' }>
}> {
  const data = userData as {
    workout?: { totalWorkoutsLast30Days?: number; averageVolume?: number }
    nutrition?: { averageCalories?: number; averageProtein?: number }
    sleep?: { averageDuration?: number }
  }

  return [
    {
      title: 'Treino',
      icon: '💪',
      content: `Você realizou ${data.workout?.totalWorkoutsLast30Days || 0} treinos no período.`,
      metrics: [
        {
          label: 'Treinos',
          value: `${data.workout?.totalWorkoutsLast30Days || 0}`,
        },
        {
          label: 'Volume médio',
          value: `${Math.round((data.workout?.averageVolume || 0) / 1000)}t`,
        },
      ],
    },
    {
      title: 'Nutrição',
      icon: '🍽️',
      content: 'Acompanhamento da sua alimentação no período.',
      metrics: [
        {
          label: 'Calorias média',
          value: `${Math.round(data.nutrition?.averageCalories || 0)} kcal`,
        },
        {
          label: 'Proteína média',
          value: `${Math.round(data.nutrition?.averageProtein || 0)}g`,
        },
      ],
    },
    {
      title: 'Sono',
      icon: '😴',
      content: 'Qualidade do seu descanso no período.',
      metrics: [
        {
          label: 'Duração média',
          value: `${(data.sleep?.averageDuration || 0).toFixed(1)}h`,
        },
      ],
    },
  ]
}

function generateBasicRecommendations(userData: ReturnType<typeof prepareContextForAI>): string[] {
  const recommendations: string[] = []
  const data = userData as {
    sleep?: { averageDuration?: number }
    workout?: { totalWorkoutsLast30Days?: number }
    nutrition?: { averageProtein?: number; proteinGoal?: number }
  }

  const avgSleep = data.sleep?.averageDuration || 0
  if (avgSleep < 7) {
    recommendations.push('Tente dormir pelo menos 7 horas por noite')
  }

  const workouts = data.workout?.totalWorkoutsLast30Days || 0
  if (workouts < 12) {
    recommendations.push('Aumente a frequência de treinos para 3-4x por semana')
  }

  const avgProtein = data.nutrition?.averageProtein || 0
  const proteinGoal = data.nutrition?.proteinGoal || 0
  if (avgProtein < proteinGoal * 0.8) {
    recommendations.push(`Aumente o consumo de proteína para ${proteinGoal}g/dia`)
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue mantendo a consistência!')
    recommendations.push('Considere desafios novos para continuar evoluindo')
  }

  return recommendations
}
