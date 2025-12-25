// Widget Types

export type WidgetSize = 'small' | 'medium' | 'large'

export type WidgetType =
  | 'daily-progress'
  | 'water'
  | 'workout'
  | 'streak'
  | 'revolade'
  | 'macros'
  | 'recovery'
  | 'goals'
  | 'coach-tip'

export interface WidgetConfig {
  id: string
  type: WidgetType
  size: WidgetSize
  enabled: boolean
  order: number
  settings?: Record<string, unknown>
}

export interface WidgetDefinition {
  type: WidgetType
  name: string
  description: string
  icon: string
  sizes: WidgetSize[]
  defaultSize: WidgetSize
  premium?: boolean
}

// Widget Data Types

export interface DailyProgressData {
  score: number
  checklist: {
    workout: boolean
    protein: boolean
    water: boolean
    revolade: boolean
    sleep: boolean
    calories: boolean
  }
  streak: number
}

export interface WaterWidgetData {
  current: number
  goal: number
  percentage: number
  lastAdded?: Date
}

export interface WorkoutWidgetData {
  name: string
  scheduledTime?: string
  duration?: number
  exercises: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'rest_day'
  completedAt?: Date
}

export interface StreakWidgetData {
  current: number
  record: number
  nextMilestone: number
  daysToMilestone: number
}

export type RevoladeState =
  | 'before_fast'    // Antes do jejum - pode comer
  | 'fasting'        // Durante jejum - não comer
  | 'take_now'       // Hora de tomar!
  | 'restriction'    // Período de restrição - sem laticínios
  | 'free'           // Liberado

export interface RevoladeWidgetData {
  enabled: boolean
  state: RevoladeState
  takenToday: boolean
  takenAt?: Date
  schedule: string        // Horário de tomar (ex: "14:00")
  fastingStart: string    // Início do jejum (ex: "12:00")
  restrictionEnd: string  // Fim da restrição (ex: "18:00")
  nextPhaseIn: number     // Minutos até próxima fase
  nextPhaseLabel: string  // Ex: "Hora de tomar" ou "Liberado"
}

export interface MacrosWidgetData {
  protein: { current: number; goal: number }
  carbs: { current: number; goal: number }
  fat: { current: number; goal: number }
  calories: { current: number; goal: number }
}

export interface RecoveryWidgetData {
  score: number
  muscleGroups: Array<{
    name: string
    status: 'recovered' | 'recovering' | 'fatigued'
    percentage: number
  }>
  suggestion: string
}

export interface GoalsWidgetData {
  goals: Array<{
    id: string
    name: string
    current: number
    target: number
    unit: string
    deadline?: Date
  }>
}

// Quick Actions

export interface QuickAction {
  id: string
  icon: string
  label: string
  shortLabel?: string
  description?: string
  href?: string
  action?: string
  params?: Record<string, unknown>
  badge?: number
  enabled?: boolean
}

export interface QuickActionConfig {
  id: string
  enabled: boolean
  order: number
}

// Deep Links

export interface DeepLinkConfig {
  path: string
  action?: string
  params?: Record<string, string>
}

// PWA Install

export interface InstallInstructions {
  platform: 'ios' | 'android' | 'desktop'
  steps: string[]
  image?: string
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// App Shortcuts (manifest.json)

export interface AppShortcut {
  name: string
  short_name: string
  description: string
  url: string
  icons: Array<{
    src: string
    sizes: string
    type?: string
  }>
}

// Widget Layout

export interface WidgetLayout {
  widgets: WidgetConfig[]
  quickActions: QuickActionConfig[]
  lastUpdated: Date
}

// Default Widgets

export const DEFAULT_WIDGETS: WidgetDefinition[] = [
  {
    type: 'daily-progress',
    name: 'Progresso Diário',
    description: 'Acompanhe seu progresso do dia',
    icon: '📊',
    sizes: ['small', 'medium', 'large'],
    defaultSize: 'medium',
  },
  {
    type: 'water',
    name: 'Água',
    description: 'Controle sua hidratação',
    icon: '💧',
    sizes: ['small', 'medium'],
    defaultSize: 'small',
  },
  {
    type: 'workout',
    name: 'Próximo Treino',
    description: 'Veja seu próximo treino',
    icon: '🏋️',
    sizes: ['small', 'medium', 'large'],
    defaultSize: 'medium',
  },
  {
    type: 'streak',
    name: 'Streak',
    description: 'Mantenha sua sequência',
    icon: '🔥',
    sizes: ['small', 'medium'],
    defaultSize: 'small',
  },
  {
    type: 'revolade',
    name: 'Revolade',
    description: 'Controle do Revolade e restrições',
    icon: '💊',
    sizes: ['small', 'medium', 'large'],
    defaultSize: 'medium',
  },
  {
    type: 'macros',
    name: 'Macros',
    description: 'Seus macronutrientes do dia',
    icon: '🍽️',
    sizes: ['small', 'medium'],
    defaultSize: 'medium',
  },
  {
    type: 'recovery',
    name: 'Recuperação',
    description: 'Status de recuperação muscular',
    icon: '💪',
    sizes: ['small', 'medium'],
    defaultSize: 'medium',
  },
  {
    type: 'goals',
    name: 'Metas',
    description: 'Acompanhe suas metas',
    icon: '🎯',
    sizes: ['medium', 'large'],
    defaultSize: 'medium',
  },
  {
    type: 'coach-tip',
    name: 'Dica do Coach',
    description: 'Dicas personalizadas',
    icon: '💡',
    sizes: ['medium'],
    defaultSize: 'medium',
  },
]

// Default Quick Actions

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'water',
    icon: '💧',
    label: '+250ml',
    shortLabel: 'Água',
    description: 'Adicionar 250ml de água',
    action: 'add-water',
    params: { amount: 250 },
  },
  {
    id: 'workout',
    icon: '🏋️',
    label: 'Treinar',
    shortLabel: 'Treino',
    description: 'Iniciar treino de hoje',
    href: '/treino',
  },
  {
    id: 'meal',
    icon: '🍽️',
    label: 'Refeição',
    shortLabel: 'Comer',
    description: 'Registrar refeição',
    href: '/alimentacao/refeicao/nova',
  },
  {
    id: 'revolade',
    icon: '💊',
    label: 'Revolade',
    shortLabel: 'Revolade',
    description: 'Marcar Revolade como tomado',
    action: 'mark-revolade',
  },
  {
    id: 'sleep',
    icon: '😴',
    label: 'Sono',
    shortLabel: 'Sono',
    description: 'Registrar sono',
    href: '/sono/registrar',
  },
  {
    id: 'coach',
    icon: '🤖',
    label: 'Coach',
    shortLabel: 'Coach',
    description: 'Falar com o Coach',
    href: '/coach',
  },
]

// App Shortcuts for manifest

export const APP_SHORTCUTS: AppShortcut[] = [
  {
    name: 'Registrar Água',
    short_name: 'Água',
    description: 'Adicionar água rapidamente',
    url: '/agua?action=add&amount=250',
    icons: [{ src: '/shortcuts/water.png', sizes: '96x96' }],
  },
  {
    name: 'Iniciar Treino',
    short_name: 'Treinar',
    description: 'Começar treino de hoje',
    url: '/treino?action=start',
    icons: [{ src: '/shortcuts/workout.png', sizes: '96x96' }],
  },
  {
    name: 'Registrar Refeição',
    short_name: 'Refeição',
    description: 'Adicionar refeição',
    url: '/alimentacao/refeicao/nova',
    icons: [{ src: '/shortcuts/meal.png', sizes: '96x96' }],
  },
  {
    name: 'Revolade',
    short_name: 'Revolade',
    description: 'Marcar Revolade como tomado',
    url: '/suplementos?action=revolade',
    icons: [{ src: '/shortcuts/medicine.png', sizes: '96x96' }],
  },
]
