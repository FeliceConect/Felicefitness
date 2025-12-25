// Types for Coach Virtual module

// ===== Message Types =====

export interface CoachMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  actions?: CoachAction[]
  createdAt: string
}

export interface CoachConversation {
  id: string
  userId: string
  title?: string
  createdAt: string
  updatedAt: string
  messageCount?: number
  lastMessage?: string
}

export interface CoachAction {
  type: CoachActionType
  params?: string
  label?: string
}

export type CoachActionType =
  | 'log_water'
  | 'start_workout'
  | 'log_meal'
  | 'show_report'
  | 'adjust_goal'
  | 'log_supplement'
  | 'show_history'
  | 'navigate'

// ===== Context Types =====

export interface UserContext {
  user: {
    nome: string
    idade: number
    altura: number
    pesoAtual: number
    pesoMeta: number
    condicaoMedica: string
    objetivoPrincipal: string
  }

  metas: {
    calorias: number
    proteina: number
    carboidratos: number
    gordura: number
    agua: number
    treinosSemana: number
    sono: number
  }

  hoje: {
    data: string
    treino: {
      nome: string
      duracao: number
      exercicios: number
    } | null
    calorias: number
    proteina: number
    carboidratos: number
    gordura: number
    agua: number
    sono: {
      duracao: number
      qualidade: number
    } | null
    recuperacao: {
      score: number
      energia: number
      dor: number
      stress: number
    } | null
    revoladeTomado: boolean
    suplementosTomados: string[]
  }

  semana: {
    treinosRealizados: number
    mediaProteina: number
    mediaAgua: number
    mediaSono: number
    scoreMedia: number
  }

  corpo: {
    ultimaMedicao: string
    peso: number
    musculo: number
    gordura: number
    score: number
  }

  gamificacao: {
    nivel: number
    xp: number
    streak: number
    conquistasRecentes: string[]
  }

  prs: {
    exercicio: string
    peso: number
    data: string
  }[]

  diasParaObjetivo: number
}

// ===== Suggestion Types =====

export interface CoachSuggestion {
  id: string
  type: 'recovery' | 'workout' | 'nutrition' | 'hydration' | 'supplement' | 'general'
  category?: 'workout' | 'nutrition' | 'recovery' | 'hydration' | 'general'
  icon: string
  title: string
  message: string
  action?: CoachAction
  priority?: 'high' | 'medium' | 'low'
}

export interface DailyBriefing {
  greeting: string
  yesterdaySummary: string[]
  todayFocus: string[]
  tip: string
  motivationalMessage?: string
}

// ===== API Types =====

export interface ChatRequest {
  message: string
  conversationId?: string
}

export interface ChatResponse {
  message: string
  actions: CoachAction[]
  conversationId: string
}

export interface SuggestionsResponse {
  quickSuggestions: string[]
  contextualSuggestions: CoachSuggestion[]
  dailyBriefing: DailyBriefing
}

// ===== Hook Types =====

export interface UseCoachReturn {
  messages: CoachMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  clearConversation: () => void
  context: UserContext | null
  refreshContext: () => Promise<void>
  conversationId: string | null
  conversations: CoachConversation[]
  selectConversation: (id: string) => void
  newConversation: () => void
  loadConversations: () => Promise<void>
}

export interface UseCoachSuggestionsReturn {
  quickSuggestions: string[]
  contextualSuggestions: CoachSuggestion[]
  dailyBriefing: DailyBriefing | null
  isLoading: boolean
  refreshSuggestions: () => Promise<void>
}

// ===== Constants =====

export const COACH_PERSONALITY = {
  nome: 'FeliceCoach',
  caracteristicas: [
    'Motivador mas realista',
    'Conhece profundamente o usuário',
    'Baseado em dados, não em achismos',
    'Direto ao ponto',
    'Celebra conquistas',
    'Ajusta recomendações ao contexto',
    'Lembra do histórico',
    'Respeita limitações médicas (PTI)',
  ],
  tom: [
    'Profissional mas amigável',
    'Usa emojis com moderação',
    'Respostas concisas',
    'Sempre oferece ação prática',
  ],
  especializacoes: [
    'Treino de força',
    'Nutrição esportiva',
    'Recuperação muscular',
    'Gestão do Revolade',
  ],
}

export const QUICK_SUGGESTIONS = [
  'Como estou indo essa semana?',
  'O que falta fazer hoje?',
  'Posso treinar pesado?',
  'Qual meu próximo passo?',
  'Analise meu progresso',
  'Dicas para o esqui',
]

export const ACTION_LABELS: Record<CoachActionType, string> = {
  log_water: 'Registrar água',
  start_workout: 'Iniciar treino',
  log_meal: 'Registrar refeição',
  show_report: 'Ver relatório',
  adjust_goal: 'Ajustar meta',
  log_supplement: 'Registrar suplemento',
  show_history: 'Ver histórico',
  navigate: 'Ir para',
}
