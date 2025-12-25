import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { CoachSuggestion, DailyBriefing } from '@/types/coach'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const hour = new Date().getHours()

    // Fetch basic user data
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('nome, meta_agua, meta_proteina')
      .eq('id', user.id)
      .single()

    // Fetch today's water
    const { data: waterLogs } = await supabase
      .from('agua_logs')
      .select('quantidade_ml')
      .eq('user_id', user.id)
      .eq('data', today)

    const waterTotal = (waterLogs || []).reduce((sum, w) => sum + (w.quantidade_ml || 0), 0)
    const waterMeta = profile?.meta_agua || 3000

    // Fetch gamification
    const { data: gamification } = await supabase
      .from('gamificacao')
      .select('streak')
      .eq('user_id', user.id)
      .single()

    // Generate contextual suggestions
    const suggestions: CoachSuggestion[] = []

    // Hydration suggestion
    if (waterTotal < waterMeta * 0.5 && hour > 12) {
      suggestions.push({
        id: 'hydration-1',
        type: 'hydration',
        category: 'hydration',
        icon: '💧',
        title: 'Hidratação',
        message: `Você só bebeu ${waterTotal}ml. Beba mais água!`,
        action: { type: 'log_water', params: '250' },
        priority: 'high',
      })
    }

    // Time-based suggestions
    if (hour >= 5 && hour < 9) {
      suggestions.push({
        id: 'morning-1',
        type: 'general',
        category: 'general',
        icon: '🌅',
        title: 'Bom dia!',
        message: 'Comece o dia com um copo de água e alongamento.',
        priority: 'low',
      })
    }

    if (hour >= 12 && hour < 14) {
      suggestions.push({
        id: 'lunch-1',
        type: 'nutrition',
        category: 'nutrition',
        icon: '🍽️',
        title: 'Hora do almoço',
        message: 'Registre sua refeição para acompanhar os macros.',
        action: { type: 'log_meal', params: 'almoco' },
        priority: 'medium',
      })
    }

    // Workout suggestion
    if (hour >= 15 && hour < 20) {
      suggestions.push({
        id: 'workout-1',
        type: 'workout',
        category: 'workout',
        icon: '💪',
        title: 'Hora de treinar',
        message: 'Que tal fazer seu treino agora?',
        action: { type: 'start_workout' },
        priority: 'medium',
      })
    }

    // Supplement reminder (Revolade at 14h)
    if (hour >= 13 && hour <= 15) {
      suggestions.push({
        id: 'revolade-1',
        type: 'supplement',
        category: 'general',
        icon: '💊',
        title: 'Revolade',
        message: 'Lembre-se do Revolade às 14h (em jejum).',
        action: { type: 'log_supplement' },
        priority: 'high',
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2))

    // Generate daily briefing
    const greeting = getGreeting(hour, profile?.nome || 'Usuário')
    const streak = gamification?.streak || 0

    const dailyBriefing: DailyBriefing = {
      greeting,
      yesterdaySummary: ['Continue acompanhando seu progresso!'],
      todayFocus: [
        'Manter hidratação em dia',
        streak > 0 ? `Manter streak de ${streak} dias` : 'Começar uma nova sequência',
      ],
      tip: getTipOfTheDay(),
      motivationalMessage: getMotivationalMessage(streak),
    }

    // Quick suggestions
    const quickSuggestions = [
      'Como estou indo?',
      'O que falta hoje?',
      'Posso treinar pesado?',
      'Dicas para o esqui',
      'Analise meu progresso',
    ]

    return NextResponse.json({
      quickSuggestions,
      contextualSuggestions: suggestions.slice(0, 3),
      dailyBriefing,
    })
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error)
    return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 })
  }
}

function getGreeting(hour: number, name: string): string {
  if (hour < 12) {
    return `Bom dia, ${name}! ☀️`
  } else if (hour < 18) {
    return `Boa tarde, ${name}! 💪`
  } else {
    return `Boa noite, ${name}! 🌙`
  }
}

function getTipOfTheDay(): string {
  const tips = [
    'Lembre-se: consistência é mais importante que intensidade.',
    'Beba água antes de sentir sede.',
    'O descanso é parte do treino.',
    'Foque em progresso, não em perfeição.',
    'Pequenas vitórias diárias somam grandes resultados.',
    'Prepare suas refeições com antecedência quando possível.',
    'A recuperação começa com uma boa noite de sono.',
  ]
  const index = new Date().getDate() % tips.length
  return tips[index]
}

function getMotivationalMessage(streak: number): string {
  if (streak >= 30) {
    return `Incrível! ${streak} dias consecutivos! Você é imparável!`
  } else if (streak >= 14) {
    return `${streak} dias de streak! Continue assim!`
  } else if (streak >= 7) {
    return `Uma semana de consistência! Excelente trabalho!`
  } else if (streak >= 3) {
    return `${streak} dias seguidos. O hábito está se formando!`
  } else if (streak >= 1) {
    return `Bom começo! Vamos manter o ritmo.`
  }
  return `Hoje é um novo dia para recomeçar!`
}
