// Tipos para configurações e perfil

export interface UserProfile {
  id: string
  nome: string
  sobrenome: string
  email: string
  telefone?: string
  data_nascimento?: string
  genero?: 'masculino' | 'feminino' | 'outro'
  foto_url?: string

  // Dados físicos
  altura_cm?: number // cm (database column name)
  peso_atual?: number // kg

  // Objetivo principal
  objetivo?: string
  objetivo_titulo?: string
  objetivo_data?: string // YYYY-MM-DD

  // Condição médica
  condicao_medica?: string
  medicamentos?: string[]

  // Gamificação
  nivel?: number
  xp_total?: number
  titulo?: string
  streak_atual?: number

  created_at: string
  updated_at: string
}

export interface Goals {
  // Nutrição
  calorias: number
  proteina: number
  carboidratos: number
  gordura: number
  agua: number // ml

  // Treino
  treinos_semana: number
  minutos_treino: number

  // Corpo
  peso_meta: number
  gordura_meta: number // %
  musculo_meta: number // kg

  // Sono
  horas_sono: number
}

export interface RevoladeSettings {
  ativo: boolean
  horario_medicamento: string // HH:mm
  jejum_inicio: string // HH:mm
  jejum_fim: string // HH:mm
  restricao_laticinios_fim: string // HH:mm

  // Alertas
  alerta_jejum: boolean
  alerta_medicamento: boolean
  alerta_liberacao: boolean
  alerta_laticinios: boolean
}

export interface WorkoutPreferences {
  horario_preferido: string // HH:mm
  duracao_media: number // minutos
  dias_preferidos: string[] // ['seg', 'ter', ...]
  tipos_preferidos: string[] // ['musculacao', 'circuito', ...]
  nivel_experiencia: 'iniciante' | 'intermediario' | 'avancado'

  // Timer
  som_timer: boolean
  vibracao_timer: boolean
  descanso_padrao: number // segundos

  // Unidades
  unidade_peso: 'kg' | 'lb'
  unidade_altura: 'cm' | 'ft'
}

export interface NutritionPreferences {
  // Refeições
  refeicoes: {
    nome: string
    horario: string
    ativo: boolean
  }[]

  // Restrições
  restricoes: string[] // ['vegetariano', 'sem_gluten', ...]
  alergias: string[]

  // Favoritos
  proteinas_preferidas: string[]
  carboidratos_preferidos: string[]

  // IA
  usar_analise_ia: boolean
  qualidade_analise: 'rapida' | 'balanceada' | 'detalhada'
}

export interface AppearanceSettings {
  tema: 'light' | 'dark' | 'system'
  cor_primaria: string // hex color
  tamanho_fonte: 'pequeno' | 'medio' | 'grande'
  animacoes: boolean
  confetti: boolean
  movimento_reduzido: boolean
}

export interface PrivacySettings {
  compartilhar_estatisticas: boolean
  permitir_treinador: boolean
  mostrar_perfil_publico: boolean
}

export interface NotificationSettings {
  push_enabled: boolean

  // Lembretes
  lembrete_agua: boolean
  lembrete_agua_intervalo: number // minutos
  lembrete_treino: boolean
  lembrete_treino_horario: string
  lembrete_refeicao: boolean
  lembrete_sono: boolean
  lembrete_sono_horario: string

  // Revolade
  lembrete_revolade: boolean

  // Gamificação
  notificar_conquistas: boolean
  notificar_recordes: boolean
  notificar_nivel: boolean

  // Relatórios
  relatorio_semanal: boolean
  relatorio_mensal: boolean
}

export interface AppSettings {
  goals: Goals
  revolade: RevoladeSettings
  workout: WorkoutPreferences
  nutrition: NutritionPreferences
  notifications: NotificationSettings
  appearance: AppearanceSettings
  privacy: PrivacySettings
}

// Recomendações calculadas
export interface Recommendations {
  calorias: { min: number; max: number }
  proteina: { min: number; max: number }
  carboidratos: { min: number; max: number }
  gordura: { min: number; max: number }
  agua: number
}

// Progresso em relação às metas
export interface GoalProgress {
  weight: { current: number; target: number; percent: number; remaining: number }
  fat: { current: number; target: number; percent: number; remaining: number }
  muscle: { current: number; target: number; percent: number; remaining: number }
}

// Estatísticas do perfil
export interface ProfileStats {
  treinos_total: number
  treinos_mes: number
  prs_total: number
  dias_registrados: number
  streak_maximo: number
  conquistas: number
  fotos: number
}

// Hook returns
export interface UseProfileReturn {
  profile: UserProfile | null
  stats: ProfileStats | null
  loading: boolean
  error: Error | null
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  updatePhoto: (file: File) => Promise<string>
  refresh: () => Promise<void>
}

export interface UseSettingsReturn {
  settings: AppSettings | null
  loading: boolean
  error: Error | null
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  updateGoals: (goals: Partial<Goals>) => Promise<void>
  updateRevoladeSettings: (revolade: Partial<RevoladeSettings>) => Promise<void>
  updateWorkoutPreferences: (prefs: Partial<WorkoutPreferences>) => Promise<void>
  updateNutritionPreferences: (prefs: Partial<NutritionPreferences>) => Promise<void>
  updateAppearance: (appearance: Partial<AppearanceSettings>) => Promise<void>
  updatePrivacy: (privacy: Partial<PrivacySettings>) => Promise<void>
  resetToDefaults: () => Promise<void>
  refresh: () => Promise<void>
}

export interface UseGoalsReturn {
  goals: Goals | null
  recommendations: Recommendations
  progress: GoalProgress | null
  loading: boolean
  updateGoals: (goals: Partial<Goals>) => Promise<void>
  calculateRecommendations: (peso: number, altura: number, idade: number, genero: string) => Recommendations
}
