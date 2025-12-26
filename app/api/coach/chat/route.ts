import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { buildSystemPrompt } from '@/lib/coach/prompts'
import { extractActions, removeActionTags } from '@/lib/coach/actions'
import type { UserContext } from '@/types/coach'

// Simple context builder for server-side
async function buildServerContext(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<UserContext> {
  const today = new Date().toISOString().split('T')[0]

  try {
    // Fetch basic profile data (includes gamification: streak_atual, maior_streak, pontos_totais)
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Fetch today's water from correct table
    const { data: waterLogs } = await supabase
      .from('fitness_water_logs')
      .select('quantidade_ml')
      .eq('user_id', userId)
      .eq('data', today)

    const waterTotal = (waterLogs || []).reduce((sum: number, w: { quantidade_ml?: number }) => sum + (w.quantidade_ml || 0), 0)

    // Fetch today's meals for nutrition data
    const { data: meals } = await supabase
      .from('fitness_meals')
      .select('calorias_total, proteinas_total, carboidratos_total, gorduras_total')
      .eq('user_id', userId)
      .eq('data', today)
      .eq('status', 'concluido')

    const nutrition = (meals || []).reduce(
      (acc: { calorias: number; proteina: number; carbs: number; gordura: number }, m: { calorias_total?: number; proteinas_total?: number; carboidratos_total?: number; gorduras_total?: number }) => ({
        calorias: acc.calorias + (m.calorias_total || 0),
        proteina: acc.proteina + (m.proteinas_total || 0),
        carbs: acc.carbs + (m.carboidratos_total || 0),
        gordura: acc.gordura + (m.gorduras_total || 0),
      }),
      { calorias: 0, proteina: 0, carbs: 0, gordura: 0 }
    )

    // Calculate days to ski trip
    const skiDate = new Date('2026-03-12')
    const diasParaObjetivo = Math.ceil((skiDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    // Calculate age from birth date
    let idade = 30
    if (profile?.data_nascimento) {
      const birth = new Date(profile.data_nascimento)
      const now = new Date()
      idade = now.getFullYear() - birth.getFullYear()
      const monthDiff = now.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        idade--
      }
    }

    return {
      user: {
        nome: profile?.nome || 'Usuário',
        idade,
        altura: profile?.altura_cm || 175,
        pesoAtual: profile?.peso_atual || 75,
        pesoMeta: profile?.meta_peso || 75,
        condicaoMedica: profile?.medicamento_nome ? 'PTI' : '',
        objetivoPrincipal: profile?.objetivo || 'ski_suica',
      },
      metas: {
        calorias: profile?.meta_calorias_diarias || 2500,
        proteina: profile?.meta_proteina_g || 170,
        carboidratos: profile?.meta_carboidrato_g || 280,
        gordura: profile?.meta_gordura_g || 85,
        agua: profile?.meta_agua_ml || 3000,
        treinosSemana: 6,
        sono: 7,
      },
      hoje: {
        data: today,
        treino: null,
        calorias: nutrition.calorias,
        proteina: nutrition.proteina,
        carboidratos: nutrition.carbs,
        gordura: nutrition.gordura,
        agua: waterTotal,
        sono: null,
        recuperacao: null,
        revoladeTomado: false,
        suplementosTomados: [],
      },
      semana: {
        treinosRealizados: 0,
        mediaProteina: 0,
        mediaAgua: 0,
        mediaSono: 0,
        scoreMedia: 0,
      },
      corpo: {
        ultimaMedicao: 'N/A',
        peso: profile?.peso_atual || 0,
        musculo: 0,
        gordura: 0,
        score: 0,
      },
      gamificacao: {
        nivel: Math.floor((profile?.pontos_totais || 0) / 1000) + 1,
        xp: profile?.pontos_totais || 0,
        streak: profile?.streak_atual || 0,
        conquistasRecentes: [],
      },
      prs: [],
      diasParaObjetivo,
    }
  } catch {
    return getDefaultContext()
  }
}

function getDefaultContext(): UserContext {
  const skiDate = new Date('2026-03-12')
  const diasParaObjetivo = Math.ceil((skiDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return {
    user: {
      nome: 'Usuário',
      idade: 30,
      altura: 175,
      pesoAtual: 75,
      pesoMeta: 75,
      condicaoMedica: 'PTI',
      objetivoPrincipal: 'ski_suica',
    },
    metas: {
      calorias: 2500,
      proteina: 170,
      carboidratos: 280,
      gordura: 85,
      agua: 3000,
      treinosSemana: 6,
      sono: 7,
    },
    hoje: {
      data: new Date().toISOString().split('T')[0],
      treino: null,
      calorias: 0,
      proteina: 0,
      carboidratos: 0,
      gordura: 0,
      agua: 0,
      sono: null,
      recuperacao: null,
      revoladeTomado: false,
      suplementosTomados: [],
    },
    semana: {
      treinosRealizados: 0,
      mediaProteina: 0,
      mediaAgua: 0,
      mediaSono: 0,
      scoreMedia: 0,
    },
    corpo: {
      ultimaMedicao: 'N/A',
      peso: 0,
      musculo: 0,
      gordura: 0,
      score: 0,
    },
    gamificacao: {
      nivel: 1,
      xp: 0,
      streak: 0,
      conquistasRecentes: [],
    },
    prs: [],
    diasParaObjetivo,
  }
}

export async function POST(request: NextRequest) {
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

    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }

    // Build user context
    const context = await buildServerContext(supabase, user.id)

    // Fetch recent conversation history for context (last 5 exchanges)
    const { data: recentHistory } = await supabase
      .from('fitness_coach_conversations')
      .select('mensagem_usuario, resposta_coach')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Build conversation history from recent exchanges (reverse to get chronological order)
    const conversationHistory: { role: string; content: string }[] = []
    if (recentHistory) {
      const reversedHistory = [...recentHistory].reverse()
      for (const exchange of reversedHistory) {
        conversationHistory.push({ role: 'user', content: exchange.mensagem_usuario })
        conversationHistory.push({ role: 'assistant', content: exchange.resposta_coach })
      }
    }

    // Build messages for API
    const systemPrompt = buildSystemPrompt(context)
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Check if OpenAI key exists
    const openaiKey = process.env.OPENAI_API_KEY
    let assistantMessage: string

    if (openaiKey) {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      assistantMessage = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'
    } else {
      // Fallback response when no API key
      assistantMessage = generateFallbackResponse(message, context)
    }

    // Extract actions and clean message
    const actions = extractActions(assistantMessage)
    const cleanedMessage = removeActionTags(assistantMessage)

    // Save conversation to fitness_coach_conversations
    try {
      await supabase.from('fitness_coach_conversations').insert({
        user_id: user.id,
        mensagem_usuario: message,
        resposta_coach: cleanedMessage,
        contexto: { actions: actions.length > 0 ? actions : null }
      } as never)
    } catch (saveError) {
      console.error('Erro ao salvar conversa:', saveError)
      // Continue even if save fails
    }

    return NextResponse.json({
      message: cleanedMessage,
      actions,
      conversationId: null, // Not using separate conversation IDs anymore
    })
  } catch (error) {
    console.error('Erro no chat:', error)
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
  }
}

// Fallback response generator when OpenAI is not available
function generateFallbackResponse(message: string, context: UserContext): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('como estou') || lowerMessage.includes('meu progresso')) {
    return `Olá, ${context.user.nome}!

Aqui está um resumo rápido:
- Streak atual: ${context.gamificacao.streak} dias
- Água hoje: ${context.hoje.agua}/${context.metas.agua}ml
- ${context.diasParaObjetivo} dias para o esqui na Suíça

Continue firme! Cada dia conta para sua preparação.`
  }

  if (lowerMessage.includes('treino') || lowerMessage.includes('exercício')) {
    return `Para seu objetivo de esqui, foque em:

1. **Força de pernas** - Agachamentos, leg press
2. **Core** - Prancha, russian twist
3. **Equilíbrio** - Exercícios unilaterais

Lembre-se de respeitar sua recuperação e evitar impactos fortes por conta da PTI.

[ACTION:navigate:treino]`
  }

  if (lowerMessage.includes('água') || lowerMessage.includes('hidratação')) {
    const falta = context.metas.agua - context.hoje.agua
    if (falta > 0) {
      return `Você ainda precisa de ${falta}ml de água hoje. Beba um copo agora!

[ACTION:log_water:250]`
    }
    return `Excelente! Você já atingiu sua meta de hidratação hoje. Continue assim!`
  }

  if (lowerMessage.includes('revolade') || lowerMessage.includes('medicamento')) {
    return `Lembrete importante sobre o Revolade:

- Tomar em jejum (4h após última refeição)
- Esperar 2h antes de comer
- **Evitar laticínios e cálcio** nas 4h antes e 2h depois

Isso é essencial para a absorção correta do medicamento.`
  }

  // Default response
  return `Olá, ${context.user.nome}! Estou aqui para ajudar com seu treino, nutrição e preparação para o esqui.

O que gostaria de saber? Posso ajudar com:
- Seu progresso atual
- Dicas de treino
- Nutrição e hidratação
- Planejamento para o esqui`
}
