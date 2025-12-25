// Exportadores de dados

import { createClient } from '@/lib/supabase/client'

export interface ExportData {
  exportDate: string
  version: string
  profile: Record<string, unknown> | null
  workouts: Record<string, unknown>[]
  meals: Record<string, unknown>[]
  waterLogs: Record<string, unknown>[]
  bodyMeasurements: Record<string, unknown>[]
  progressPhotos: Record<string, unknown>[]
  personalRecords: Record<string, unknown>[]
  achievements: Record<string, unknown>[]
  dailyScores: Record<string, unknown>[]
  settings: Record<string, unknown> | null
}

export async function exportAllData(userId: string): Promise<ExportData> {
  const supabase = createClient()

  // Buscar todos os dados em paralelo
  const [
    profileResult,
    workoutsResult,
    mealsResult,
    waterResult,
    bodyResult,
    photosResult,
    prsResult,
    achievementsResult,
    scoresResult,
    settingsResult
  ] = await Promise.all([
    supabase.from('fitness_profiles').select('*').eq('id', userId).single(),
    supabase.from('workouts').select('*, workout_exercises(*)').eq('user_id', userId),
    supabase.from('nutrition_logs').select('*, meal_items(*)').eq('user_id', userId),
    supabase.from('water_logs').select('*').eq('user_id', userId),
    supabase.from('body_measurements').select('*').eq('user_id', userId),
    supabase.from('progress_photos').select('*').eq('user_id', userId),
    supabase.from('personal_records').select('*, exercises(name)').eq('user_id', userId),
    supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', userId),
    supabase.from('daily_scores').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('*').eq('user_id', userId).single()
  ])

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    profile: profileResult.data,
    workouts: workoutsResult.data || [],
    meals: mealsResult.data || [],
    waterLogs: waterResult.data || [],
    bodyMeasurements: bodyResult.data || [],
    progressPhotos: photosResult.data || [],
    personalRecords: prsResult.data || [],
    achievements: achievementsResult.data || [],
    dailyScores: scoresResult.data || [],
    settings: settingsResult.data
  }
}

export function exportToJSON(data: ExportData): Blob {
  const json = JSON.stringify(data, null, 2)
  return new Blob([json], { type: 'application/json' })
}

export function exportToCSV(data: Record<string, unknown>[], columns: string[]): Blob {
  // Header
  const header = columns.join(',')

  // Rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return String(value)
    }).join(',')
  })

  const csv = [header, ...rows].join('\n')
  return new Blob([csv], { type: 'text/csv' })
}

export async function exportWorkoutsCSV(userId: string): Promise<Blob> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workouts')
    .select('id, name, date, duration_minutes, calories_burned, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const columns = ['id', 'name', 'date', 'duration_minutes', 'calories_burned', 'created_at']
  return exportToCSV(data || [], columns)
}

export async function exportNutritionCSV(userId: string): Promise<Blob> {
  const supabase = createClient()
  const { data } = await supabase
    .from('nutrition_logs')
    .select('id, date, meal_type, total_calories, protein, carbs, fat, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const columns = ['id', 'date', 'meal_type', 'total_calories', 'protein', 'carbs', 'fat', 'created_at']
  return exportToCSV(data || [], columns)
}

export async function exportWaterCSV(userId: string): Promise<Blob> {
  const supabase = createClient()
  const { data } = await supabase
    .from('water_logs')
    .select('id, date, amount_ml, logged_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const columns = ['id', 'date', 'amount_ml', 'logged_at']
  return exportToCSV(data || [], columns)
}

export async function exportBodyMeasurementsCSV(userId: string): Promise<Blob> {
  const supabase = createClient()
  const { data } = await supabase
    .from('body_measurements')
    .select('id, date, weight, body_fat, muscle_mass, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const columns = ['id', 'date', 'weight', 'body_fat', 'muscle_mass', 'created_at']
  return exportToCSV(data || [], columns)
}

// Download helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Calcular tamanho estimado dos dados
export async function calculateDataSize(userId: string): Promise<{
  total: number
  breakdown: Record<string, number>
}> {
  const supabase = createClient()

  const [workouts, meals, water, body, photos, prs, scores] = await Promise.all([
    supabase.from('workouts').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('nutrition_logs').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('water_logs').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('body_measurements').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('progress_photos').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('personal_records').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('daily_scores').select('id', { count: 'exact' }).eq('user_id', userId)
  ])

  // Estimativa: ~500 bytes por registro de texto, 1MB por foto
  const breakdown = {
    treinos: (workouts.count || 0) * 500,
    refeicoes: (meals.count || 0) * 500,
    agua: (water.count || 0) * 100,
    corpo: (body.count || 0) * 200,
    fotos: (photos.count || 0) * 1024 * 1024,
    recordes: (prs.count || 0) * 200,
    pontuacoes: (scores.count || 0) * 100
  }

  const total = Object.values(breakdown).reduce((sum, size) => sum + size, 0)

  return { total, breakdown }
}

// Limpar cache local
export function clearLocalCache() {
  // Limpar localStorage exceto tokens de autenticação
  const keysToKeep = ['supabase.auth.token']
  const allKeys = Object.keys(localStorage)

  allKeys.forEach(key => {
    if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
      localStorage.removeItem(key)
    }
  })

  // Limpar sessionStorage
  sessionStorage.clear()

  // Limpar cache do service worker se disponível
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (!name.includes('workbox')) {
          caches.delete(name)
        }
      })
    })
  }
}
