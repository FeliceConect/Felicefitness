// Valores padrão para configurações

import type {
  Goals,
  WorkoutPreferences,
  NutritionPreferences,
  AppearanceSettings,
  PrivacySettings,
  NotificationSettings,
  AppSettings
} from '@/types/settings'

export const defaultGoals: Goals = {
  calorias: 2500,
  proteina: 170,
  carboidratos: 280,
  gordura: 75,
  agua: 3000,
  treinos_semana: 6,
  minutos_treino: 40,
  peso_meta: 80,
  gordura_meta: 14,
  musculo_meta: 39.5,
  horas_sono: 7
}

export const defaultWorkoutPreferences: WorkoutPreferences = {
  horario_preferido: '05:00',
  duracao_media: 40,
  dias_preferidos: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  tipos_preferidos: ['musculacao', 'circuito'],
  nivel_experiencia: 'avancado',
  som_timer: true,
  vibracao_timer: true,
  descanso_padrao: 60,
  unidade_peso: 'kg',
  unidade_altura: 'cm'
}

export const defaultNutritionPreferences: NutritionPreferences = {
  refeicoes: [
    { nome: 'Café da manhã', horario: '06:00', ativo: true },
    { nome: 'Lanche manhã', horario: '09:30', ativo: true },
    { nome: 'Almoço', horario: '12:00', ativo: true },
    { nome: 'Lanche tarde', horario: '15:30', ativo: true },
    { nome: 'Jantar', horario: '19:00', ativo: true },
    { nome: 'Ceia', horario: '21:30', ativo: false }
  ],
  restricoes: [],
  alergias: [],
  proteinas_preferidas: ['frango', 'carne', 'peixe', 'ovos'],
  carboidratos_preferidos: ['arroz', 'batata_doce', 'aveia'],
  usar_analise_ia: true,
  qualidade_analise: 'balanceada'
}

export const defaultAppearanceSettings: AppearanceSettings = {
  tema: 'dark',
  cor_primaria: '#c29863', // Dourado
  tamanho_fonte: 'medio',
  animacoes: true,
  confetti: true,
  movimento_reduzido: false
}

export const defaultPrivacySettings: PrivacySettings = {
  compartilhar_estatisticas: false,
  permitir_treinador: false,
  mostrar_perfil_publico: false
}

export const defaultNotificationSettings: NotificationSettings = {
  push_enabled: true,
  lembrete_agua: true,
  lembrete_agua_intervalo: 60,
  lembrete_treino: true,
  lembrete_treino_horario: '05:00',
  lembrete_refeicao: true,
  lembrete_sono: true,
  lembrete_sono_horario: '22:00',
  notificar_conquistas: true,
  notificar_recordes: true,
  notificar_nivel: true,
  relatorio_semanal: true,
  relatorio_mensal: true
}

export const defaultSettings: AppSettings = {
  goals: defaultGoals,
  workout: defaultWorkoutPreferences,
  nutrition: defaultNutritionPreferences,
  notifications: defaultNotificationSettings,
  appearance: defaultAppearanceSettings,
  privacy: defaultPrivacySettings
}

// Cores disponíveis para tema
export const themeColors = [
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Laranja', value: '#F97316' }
]

// Tipos de treino disponíveis
export const workoutTypes = [
  { id: 'musculacao', label: 'Musculação' },
  { id: 'circuito', label: 'Circuito/HIIT' },
  { id: 'beach_tennis', label: 'Beach Tennis' },
  { id: 'corrida', label: 'Corrida' },
  { id: 'natacao', label: 'Natação' },
  { id: 'ciclismo', label: 'Ciclismo' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'pilates', label: 'Pilates' },
  { id: 'funcional', label: 'Funcional' },
  { id: 'crossfit', label: 'CrossFit' }
]

// Dias da semana
export const weekDays = [
  { id: 'seg', label: 'Seg', fullLabel: 'Segunda' },
  { id: 'ter', label: 'Ter', fullLabel: 'Terça' },
  { id: 'qua', label: 'Qua', fullLabel: 'Quarta' },
  { id: 'qui', label: 'Qui', fullLabel: 'Quinta' },
  { id: 'sex', label: 'Sex', fullLabel: 'Sexta' },
  { id: 'sab', label: 'Sáb', fullLabel: 'Sábado' },
  { id: 'dom', label: 'Dom', fullLabel: 'Domingo' }
]

// Restrições alimentares
export const dietaryRestrictions = [
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'sem_gluten', label: 'Sem glúten' },
  { id: 'sem_lactose', label: 'Sem lactose' },
  { id: 'low_carb', label: 'Low carb' },
  { id: 'cetogenica', label: 'Cetogênica' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'mediterranea', label: 'Mediterrânea' }
]

// Proteínas comuns
export const commonProteins = [
  { id: 'frango', label: 'Frango' },
  { id: 'carne', label: 'Carne vermelha' },
  { id: 'peixe', label: 'Peixe' },
  { id: 'ovos', label: 'Ovos' },
  { id: 'porco', label: 'Porco' },
  { id: 'peru', label: 'Peru' },
  { id: 'camarao', label: 'Camarão' },
  { id: 'tofu', label: 'Tofu' },
  { id: 'whey', label: 'Whey Protein' }
]

// Carboidratos comuns
export const commonCarbs = [
  { id: 'arroz', label: 'Arroz' },
  { id: 'batata_doce', label: 'Batata doce' },
  { id: 'aveia', label: 'Aveia' },
  { id: 'pao_integral', label: 'Pão integral' },
  { id: 'macarrao', label: 'Macarrão' },
  { id: 'mandioca', label: 'Mandioca' },
  { id: 'quinoa', label: 'Quinoa' },
  { id: 'batata', label: 'Batata' },
  { id: 'tapioca', label: 'Tapioca' }
]

// Níveis de experiência
export const experienceLevels = [
  { id: 'iniciante', label: 'Iniciante', description: 'Menos de 1 ano de treino' },
  { id: 'intermediario', label: 'Intermediário', description: '1 a 3 anos de treino' },
  { id: 'avancado', label: 'Avançado', description: 'Mais de 3 anos de treino' }
]

// Presets de metas de água
export const waterPresets = [2000, 2500, 3000, 3500, 4000]

// Presets de horas de sono
export const sleepPresets = [6, 7, 8, 9]

// Tamanhos de fonte
export const fontSizes = [
  { id: 'pequeno', label: 'Pequeno', scale: 0.9 },
  { id: 'medio', label: 'Médio', scale: 1 },
  { id: 'grande', label: 'Grande', scale: 1.1 }
]
