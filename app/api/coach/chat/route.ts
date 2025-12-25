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
    // Fetch basic profile data
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Fetch today's water
    const { data: waterLogs } = await supabase
      .from('agua_logs')
      .select('quantidade_ml')
      .eq('user_id', userId)
      .eq('data', today)

    const waterTotal = (waterLogs || []).reduce((sum: number, w: { quantidade_ml?: number }) => sum + (w.quantidade_ml || 0), 0)

    // Fetch gamification
    const { data: gamification } = await supabase
      .from('gamificacao')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Calculate days to ski trip
    const skiDate = new Date('2026-03-12')
    const diasParaObjetivo = Math.ceil((skiDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return {
      user: {
        nome: profile?.nome || 'Usuário',
        idade: 30,
        altura: profile?.altura || 175,
        pesoAtual: profile?.peso || 75,
        pesoMeta: profile?.peso_meta || 75,
        condicaoMedica: 'PTI',
        objetivoPrincipal: 'ski_suica',
      },
      metas: {
        calorias: profile?.meta_calorias || 2500,
        proteina: profile?.meta_proteina || 170,
        carboidratos: profile?.meta_carboidratos || 280,
        gordura: profile?.meta_gordura || 85,
        agua: profile?.meta_agua || 3000,
        treinosSemana: profile?.meta_treinos_semana || 6,
        sono: profile?.meta_sono || 7,
      },
      hoje: {
        data: today,
        treino: null,
        calorias: 0,
        proteina: 0,
        carboidratos: 0,
        gordura: 0,
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
        peso: profile?.peso || 0,
        musculo: 0,
        gordura: 0,
        score: 0,
      },
      gamificacao: {
        nivel: gamification?.nivel || 1,
        xp: gamification?.xp || 0,
        streak: gamification?.streak || 0,
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

    const { message, conversationId } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }

    // Build user context
    const context = await buildServerContext(supabase, user.id)

    // Fetch conversation history if exists
    let conversationHistory: { role: string; content: string }[] = []
    if (conversationId) {
      const { data: history } = await supabase
        .from('coach_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10)

      conversationHistory = (history || []).map((m) => ({
        role: m.role,
        content: m.content,
      }))
    }

    // Create or get conversation
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const { data: newConversation } = await supabase
        .from('coach_conversations')
        .insert({ user_id: user.id } as never)
        .select()
        .single()

      currentConversationId = (newConversation as { id: string } | null)?.id
    }

    // Save user message
    if (currentConversationId) {
      await supabase.from('coach_messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
      } as never)
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

    // Save assistant message
    if (currentConversationId) {
      await supabase.from('coach_messages').insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: cleanedMessage,
        actions: actions.length > 0 ? actions : null,
      } as never)

      // Update conversation timestamp
      await supabase
        .from('coach_conversations')
        .update({ updated_at: new Date().toISOString() } as never)
        .eq('id', currentConversationId)
    }

    return NextResponse.json({
      message: cleanedMessage,
      actions,
      conversationId: currentConversationId,
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
