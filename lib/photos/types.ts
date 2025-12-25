/**
 * Tipos para o módulo de Fotos de Progresso
 */

// Tipo de foto
export type PhotoType = 'frente' | 'lado_esquerdo' | 'lado_direito' | 'costas'

// Status da foto
export type PhotoStatus = 'uploading' | 'processing' | 'ready' | 'error'

// Foto de progresso
export interface ProgressPhoto {
  id: string
  user_id: string
  data: string // YYYY-MM-DD
  tipo: PhotoType
  url: string
  thumbnail_url?: string

  // Dados opcionais no momento da foto
  peso?: number
  percentual_gordura?: number
  notas?: string

  // Metadados
  favorita: boolean
  largura?: number
  altura?: number
  tamanho_bytes?: number

  created_at: string
  updated_at?: string
}

// Input para nova foto
export interface NewProgressPhoto {
  data: string
  tipo: PhotoType
  file: File
  peso?: number
  percentual_gordura?: number
  notas?: string
}

// Metadados de upload
export interface PhotoMetadata {
  userId: string
  type: PhotoType
  date: string
}

// Comparação de fotos
export interface PhotoComparison {
  before: ProgressPhoto
  after: ProgressPhoto
  daysBetween: number
  weightChange?: number
  fatPercentChange?: number
}

// Agrupamento por mês
export interface PhotosByMonth {
  month: string // YYYY-MM
  label: string // "Dezembro 2025"
  photos: ProgressPhoto[]
}

// Estatísticas de fotos
export interface PhotoStats {
  total: number
  byType: Record<PhotoType, number>
  favoritas: number
  primeiraFoto: string | null
  ultimaFoto: string | null
}

// Opções de compartilhamento
export interface ShareCardOptions {
  showData: boolean
  showBranding: boolean
  blurFace: boolean
  template: 'minimal' | 'full' | 'story'
}

// Labels em português
export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  frente: 'Frente',
  lado_esquerdo: 'Lado Esquerdo',
  lado_direito: 'Lado Direito',
  costas: 'Costas'
}

// Ícones para tipos
export const PHOTO_TYPE_ICONS: Record<PhotoType, string> = {
  frente: '🧍',
  lado_esquerdo: '👈',
  lado_direito: '👉',
  costas: '🔙'
}

// Dicas de posicionamento por tipo
export const PHOTO_TYPE_TIPS: Record<PhotoType, string> = {
  frente: 'Pés na largura dos ombros, braços relaxados ao lado do corpo',
  lado_esquerdo: 'Perfil reto, olhando para frente, braços naturalmente posicionados',
  lado_direito: 'Perfil reto, olhando para frente, braços naturalmente posicionados',
  costas: 'Mesmo enquadramento da foto frontal, braços relaxados'
}

// Modos de comparação
export type ComparisonMode = 'side-by-side' | 'slider' | 'fade'

// Modos de comparação labels
export const COMPARISON_MODE_LABELS: Record<ComparisonMode, string> = {
  'side-by-side': 'Lado a lado',
  'slider': 'Slider',
  'fade': 'Transição'
}
