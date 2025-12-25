"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import {
  getMockPhotos,
  getMockPhotosByMonth,
  type ProgressPhoto,
  type PhotoType,
  type PhotosByMonth,
  type PhotoStats
} from '@/lib/photos'

interface UsePhotosReturn {
  // Dados
  photos: ProgressPhoto[]
  favoritePhotos: ProgressPhoto[]
  photosByMonth: PhotosByMonth[]

  // Filtros
  filteredPhotos: ProgressPhoto[]
  typeFilter: PhotoType | null
  setTypeFilter: (type: PhotoType | null) => void

  // Estatísticas
  stats: PhotoStats

  // Ações
  addPhoto: (photo: ProgressPhoto) => Promise<boolean>
  updatePhoto: (id: string, data: Partial<ProgressPhoto>) => Promise<boolean>
  deletePhoto: (id: string) => Promise<boolean>
  toggleFavorite: (id: string) => Promise<boolean>
  getPhotoById: (id: string) => ProgressPhoto | undefined

  // Estados
  isLoading: boolean
  error: Error | null
}

export function usePhotos(): UsePhotosReturn {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [typeFilter, setTypeFilter] = useState<PhotoType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar fotos
  const loadPhotos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usar mock data
        const mockPhotos = getMockPhotos()
        setPhotos(mockPhotos)
        setIsLoading(false)
        return
      }

      // TODO: Buscar do Supabase
      // const { data, error } = await supabase
      //   .from('fitness_progress_photos')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('data', { ascending: false })

      // Por enquanto, usar mock
      const mockPhotos = getMockPhotos()
      setPhotos(mockPhotos)
    } catch (err) {
      console.error('Erro ao carregar fotos:', err)
      setError(err as Error)
      const mockPhotos = getMockPhotos()
      setPhotos(mockPhotos)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  // Fotos filtradas
  const filteredPhotos = useMemo(() => {
    if (!typeFilter) return photos
    return photos.filter(p => p.tipo === typeFilter)
  }, [photos, typeFilter])

  // Fotos favoritas
  const favoritePhotos = useMemo(() => {
    return photos.filter(p => p.favorita)
  }, [photos])

  // Agrupar por mês
  const photosByMonth = useMemo((): PhotosByMonth[] => {
    const grouped: Record<string, ProgressPhoto[]> = {}

    filteredPhotos.forEach(photo => {
      const monthKey = photo.data.substring(0, 7)
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(photo)
    })

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, monthPhotos]) => ({
        month,
        label: format(parseISO(`${month}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
        photos: monthPhotos.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }))
  }, [filteredPhotos])

  // Estatísticas
  const stats = useMemo((): PhotoStats => {
    const byType: Record<PhotoType, number> = {
      frente: 0,
      lado_esquerdo: 0,
      lado_direito: 0,
      costas: 0
    }

    photos.forEach(photo => {
      byType[photo.tipo]++
    })

    const sortedByDate = [...photos].sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    )

    return {
      total: photos.length,
      byType,
      favoritas: photos.filter(p => p.favorita).length,
      primeiraFoto: sortedByDate[0]?.data || null,
      ultimaFoto: sortedByDate[sortedByDate.length - 1]?.data || null
    }
  }, [photos])

  // Adicionar foto
  const addPhoto = useCallback(async (photo: ProgressPhoto): Promise<boolean> => {
    try {
      // Optimistic update
      setPhotos(prev => [photo, ...prev])

      // TODO: Salvar no Supabase

      return true
    } catch (err) {
      console.error('Erro ao adicionar foto:', err)
      setError(err as Error)
      await loadPhotos()
      return false
    }
  }, [loadPhotos])

  // Atualizar foto
  const updatePhoto = useCallback(async (
    id: string,
    data: Partial<ProgressPhoto>
  ): Promise<boolean> => {
    try {
      setPhotos(prev =>
        prev.map(p => (p.id === id ? { ...p, ...data } : p))
      )

      // TODO: Atualizar no Supabase

      return true
    } catch (err) {
      console.error('Erro ao atualizar foto:', err)
      setError(err as Error)
      return false
    }
  }, [])

  // Deletar foto
  const deletePhoto = useCallback(async (id: string): Promise<boolean> => {
    try {
      setPhotos(prev => prev.filter(p => p.id !== id))

      // TODO: Deletar do Supabase e Storage

      return true
    } catch (err) {
      console.error('Erro ao deletar foto:', err)
      setError(err as Error)
      await loadPhotos()
      return false
    }
  }, [loadPhotos])

  // Toggle favorita
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    const photo = photos.find(p => p.id === id)
    if (!photo) return false

    return updatePhoto(id, { favorita: !photo.favorita })
  }, [photos, updatePhoto])

  // Obter foto por ID
  const getPhotoById = useCallback((id: string): ProgressPhoto | undefined => {
    return photos.find(p => p.id === id)
  }, [photos])

  return {
    photos,
    favoritePhotos,
    photosByMonth,
    filteredPhotos,
    typeFilter,
    setTypeFilter,
    stats,
    addPhoto,
    updatePhoto,
    deletePhoto,
    toggleFavorite,
    getPhotoById,
    isLoading,
    error
  }
}
