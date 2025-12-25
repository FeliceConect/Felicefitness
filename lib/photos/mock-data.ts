/**
 * Mock data para fotos de progresso do Leonardo
 */

import type { ProgressPhoto, PhotoType } from './types'

// Fotos mock do Leonardo ao longo do ano
export const LEONARDO_PHOTOS: ProgressPhoto[] = [
  // Janeiro 2024 - Início
  {
    id: 'photo-001',
    user_id: 'leonardo-001',
    data: '2024-01-15',
    tipo: 'frente',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 92.5,
    percentual_gordura: 32.2,
    notas: 'Primeira foto - início do programa',
    favorita: true,
    largura: 1080,
    altura: 1620,
    created_at: '2024-01-15T08:30:00Z'
  },
  {
    id: 'photo-002',
    user_id: 'leonardo-001',
    data: '2024-01-15',
    tipo: 'lado_esquerdo',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 92.5,
    percentual_gordura: 32.2,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-01-15T08:31:00Z'
  },
  {
    id: 'photo-003',
    user_id: 'leonardo-001',
    data: '2024-01-15',
    tipo: 'lado_direito',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 92.5,
    percentual_gordura: 32.2,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-01-15T08:32:00Z'
  },
  {
    id: 'photo-004',
    user_id: 'leonardo-001',
    data: '2024-01-15',
    tipo: 'costas',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 92.5,
    percentual_gordura: 32.2,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-01-15T08:33:00Z'
  },

  // Abril 2024 - 3 meses
  {
    id: 'photo-005',
    user_id: 'leonardo-001',
    data: '2024-04-15',
    tipo: 'frente',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 88.5,
    percentual_gordura: 28.0,
    notas: '3 meses de progresso!',
    favorita: true,
    largura: 1080,
    altura: 1620,
    created_at: '2024-04-15T08:30:00Z'
  },
  {
    id: 'photo-006',
    user_id: 'leonardo-001',
    data: '2024-04-15',
    tipo: 'lado_esquerdo',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 88.5,
    percentual_gordura: 28.0,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-04-15T08:31:00Z'
  },
  {
    id: 'photo-007',
    user_id: 'leonardo-001',
    data: '2024-04-15',
    tipo: 'costas',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 88.5,
    percentual_gordura: 28.0,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-04-15T08:32:00Z'
  },

  // Julho 2024 - 6 meses
  {
    id: 'photo-008',
    user_id: 'leonardo-001',
    data: '2024-07-22',
    tipo: 'frente',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 85.4,
    percentual_gordura: 23.1,
    notas: '6 meses - grande evolução!',
    favorita: true,
    largura: 1080,
    altura: 1620,
    created_at: '2024-07-22T08:30:00Z'
  },
  {
    id: 'photo-009',
    user_id: 'leonardo-001',
    data: '2024-07-22',
    tipo: 'lado_esquerdo',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 85.4,
    percentual_gordura: 23.1,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-07-22T08:31:00Z'
  },
  {
    id: 'photo-010',
    user_id: 'leonardo-001',
    data: '2024-07-22',
    tipo: 'lado_direito',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 85.4,
    percentual_gordura: 23.1,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-07-22T08:32:00Z'
  },
  {
    id: 'photo-011',
    user_id: 'leonardo-001',
    data: '2024-07-22',
    tipo: 'costas',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 85.4,
    percentual_gordura: 23.1,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-07-22T08:33:00Z'
  },

  // Outubro 2024 - 9 meses
  {
    id: 'photo-012',
    user_id: 'leonardo-001',
    data: '2024-10-14',
    tipo: 'frente',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 83.8,
    percentual_gordura: 20.2,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-10-14T08:30:00Z'
  },
  {
    id: 'photo-013',
    user_id: 'leonardo-001',
    data: '2024-10-14',
    tipo: 'lado_esquerdo',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 83.8,
    percentual_gordura: 20.2,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2024-10-14T08:31:00Z'
  },

  // Janeiro 2025 - 1 ano
  {
    id: 'photo-014',
    user_id: 'leonardo-001',
    data: '2025-01-13',
    tipo: 'frente',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 82.1,
    percentual_gordura: 17.3,
    notas: '1 ano de transformação!',
    favorita: true,
    largura: 1080,
    altura: 1620,
    created_at: '2025-01-13T08:30:00Z'
  },
  {
    id: 'photo-015',
    user_id: 'leonardo-001',
    data: '2025-01-13',
    tipo: 'lado_esquerdo',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 82.1,
    percentual_gordura: 17.3,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2025-01-13T08:31:00Z'
  },
  {
    id: 'photo-016',
    user_id: 'leonardo-001',
    data: '2025-01-13',
    tipo: 'lado_direito',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 82.1,
    percentual_gordura: 17.3,
    favorita: false,
    largura: 1080,
    altura: 1620,
    created_at: '2025-01-13T08:32:00Z'
  },
  {
    id: 'photo-017',
    user_id: 'leonardo-001',
    data: '2025-01-13',
    tipo: 'costas',
    url: '/api/placeholder/400/600',
    thumbnail_url: '/api/placeholder/200/300',
    peso: 82.1,
    percentual_gordura: 17.3,
    favorita: true,
    largura: 1080,
    altura: 1620,
    created_at: '2025-01-13T08:33:00Z'
  }
]

// Obter todas as fotos mock
export function getMockPhotos(): ProgressPhoto[] {
  return [...LEONARDO_PHOTOS].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}

// Obter foto por ID
export function getMockPhotoById(id: string): ProgressPhoto | undefined {
  return LEONARDO_PHOTOS.find(p => p.id === id)
}

// Obter fotos por tipo
export function getMockPhotosByType(type: PhotoType): ProgressPhoto[] {
  return LEONARDO_PHOTOS.filter(p => p.tipo === type).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}

// Obter fotos favoritas
export function getMockFavoritePhotos(): ProgressPhoto[] {
  return LEONARDO_PHOTOS.filter(p => p.favorita).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}

// Obter fotos agrupadas por mês
export function getMockPhotosByMonth(): Record<string, ProgressPhoto[]> {
  const grouped: Record<string, ProgressPhoto[]> = {}

  LEONARDO_PHOTOS.forEach(photo => {
    const monthKey = photo.data.substring(0, 7) // YYYY-MM
    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }
    grouped[monthKey].push(photo)
  })

  // Ordenar fotos dentro de cada mês
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  })

  return grouped
}
