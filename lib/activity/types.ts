// Tipos de atividades que podem ser registradas
export type ActivityType =
  | 'beach_tennis'
  | 'tenis'
  | 'corrida'
  | 'caminhada'
  | 'natacao'
  | 'ciclismo'
  | 'yoga'
  | 'pilates'
  | 'danca'
  | 'futebol'
  | 'basquete'
  | 'volei'
  | 'surf'
  | 'skate'
  | 'escalada'
  | 'crossfit'
  | 'funcional'
  | 'luta'
  | 'artes_marciais'
  | 'alongamento'
  | 'outro'

// Labels e ícones para cada tipo
export const activityTypeLabels: Record<ActivityType, { label: string; icon: string; color: string }> = {
  beach_tennis: { label: 'Beach Tennis', icon: '🏸', color: 'bg-yellow-500' },
  tenis: { label: 'Tênis', icon: '🎾', color: 'bg-green-500' },
  corrida: { label: 'Corrida', icon: '🏃', color: 'bg-blue-500' },
  caminhada: { label: 'Caminhada', icon: '🚶', color: 'bg-teal-500' },
  natacao: { label: 'Natação', icon: '🏊', color: 'bg-cyan-500' },
  ciclismo: { label: 'Ciclismo', icon: '🚴', color: 'bg-orange-500' },
  yoga: { label: 'Yoga', icon: '🧘', color: 'bg-purple-500' },
  pilates: { label: 'Pilates', icon: '🤸', color: 'bg-pink-500' },
  danca: { label: 'Dança', icon: '💃', color: 'bg-rose-500' },
  futebol: { label: 'Futebol', icon: '⚽', color: 'bg-green-600' },
  basquete: { label: 'Basquete', icon: '🏀', color: 'bg-orange-600' },
  volei: { label: 'Vôlei', icon: '🏐', color: 'bg-amber-500' },
  surf: { label: 'Surf', icon: '🏄', color: 'bg-sky-500' },
  skate: { label: 'Skate', icon: '🛹', color: 'bg-slate-500' },
  escalada: { label: 'Escalada', icon: '🧗', color: 'bg-stone-500' },
  crossfit: { label: 'CrossFit', icon: '🏋️', color: 'bg-red-500' },
  funcional: { label: 'Funcional', icon: '💪', color: 'bg-violet-500' },
  luta: { label: 'Luta', icon: '🥊', color: 'bg-red-600' },
  artes_marciais: { label: 'Artes Marciais', icon: '🥋', color: 'bg-gray-600' },
  alongamento: { label: 'Alongamento', icon: '🙆', color: 'bg-emerald-500' },
  outro: { label: 'Outro', icon: '🎯', color: 'bg-slate-600' }
}

// Níveis de intensidade
export type IntensityLevel = 'leve' | 'moderado' | 'intenso' | 'muito_intenso'

export const intensityLabels: Record<IntensityLevel, { label: string; color: string }> = {
  leve: { label: 'Leve', color: 'text-green-400' },
  moderado: { label: 'Moderado', color: 'text-yellow-400' },
  intenso: { label: 'Intenso', color: 'text-orange-400' },
  muito_intenso: { label: 'Muito Intenso', color: 'text-red-400' }
}

// Interface da atividade
export interface Activity {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  activity_type: ActivityType
  custom_name?: string // Se tipo = 'outro'
  duration_minutes: number
  intensity: IntensityLevel
  calories_burned?: number
  distance_km?: number
  heart_rate_avg?: number
  notes?: string
  location?: string
  created_at: string
  updated_at?: string
}

// Para criar uma nova atividade
export interface ActivityInsert {
  activity_type: ActivityType
  custom_name?: string
  date: string
  duration_minutes: number
  intensity: IntensityLevel
  calories_burned?: number
  distance_km?: number
  heart_rate_avg?: number
  notes?: string
  location?: string
}
