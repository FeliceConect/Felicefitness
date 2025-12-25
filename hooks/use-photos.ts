"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import {
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
  uploadAndSavePhoto: (blob: Blob, photoData: Omit<ProgressPhoto, 'id' | 'user_id' | 'url' | 'created_at'>) => Promise<ProgressPhoto | null>
  refreshPhotos: () => Promise<void>

  // Estados
  isLoading: boolean
  error: Error | null
}

export function usePhotos(): UsePhotosReturn {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [typeFilter, setTypeFilter] = useState<PhotoType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar fotos do Supabase
  const loadPhotos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setPhotos([])
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await (supabase as any)
        .from('fitness_progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })

      if (fetchError) {
        console.error('Erro ao buscar fotos:', fetchError)
        setPhotos([])
      } else if (data) {
        // Mapear dados do banco para o formato da interface
        const mappedPhotos: ProgressPhoto[] = data.map((row: {
          id: string
          user_id: string
          data: string
          tipo: string
          foto_url: string
          peso_no_dia: number | null
          percentual_gordura_no_dia: number | null
          notas: string | null
          is_favorita: boolean | null
          created_at: string
        }) => ({
          id: row.id,
          user_id: row.user_id,
          data: row.data,
          tipo: row.tipo as PhotoType,
          url: row.foto_url,
          peso: row.peso_no_dia ?? undefined,
          percentual_gordura: row.percentual_gordura_no_dia ?? undefined,
          notas: row.notas ?? undefined,
          favorita: row.is_favorita || false,
          created_at: row.created_at
        }))
        setPhotos(mappedPhotos)
      } else {
        setPhotos([])
      }
    } catch (err) {
      console.error('Erro ao carregar fotos:', err)
      setError(err as Error)
      setPhotos([])
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

  // Upload e salvar foto no Supabase
  const uploadAndSavePhoto = useCallback(async (
    blob: Blob,
    photoData: Omit<ProgressPhoto, 'id' | 'user_id' | 'url' | 'created_at'>
  ): Promise<ProgressPhoto | null> => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Gerar nome único para o arquivo
      const fileExt = 'jpg'
      const fileName = `${user.id}/${photoData.data}_${photoData.tipo}_${Date.now()}.${fileExt}`

      // Upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        throw uploadError
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      // Inserir no banco (usando any para bypass de tipos)
      const { data: insertData, error: insertError } = await (supabase as any)
        .from('fitness_progress_photos')
        .insert({
          user_id: user.id,
          data: photoData.data,
          tipo: photoData.tipo,
          foto_url: publicUrl,
          peso_no_dia: photoData.peso || null,
          percentual_gordura_no_dia: photoData.percentual_gordura || null,
          notas: photoData.notas || null,
          is_favorita: photoData.favorita || false
        })
        .select()
        .single()

      if (insertError || !insertData) {
        console.error('Erro ao inserir:', insertError)
        // Tentar deletar o arquivo se falhou ao inserir no banco
        await supabase.storage.from('progress-photos').remove([fileName])
        throw insertError || new Error('Erro ao inserir foto')
      }

      // Mapear para o formato da interface
      const row = insertData as {
        id: string
        user_id: string
        data: string
        tipo: string
        foto_url: string
        peso_no_dia: number | null
        percentual_gordura_no_dia: number | null
        notas: string | null
        is_favorita: boolean | null
        created_at: string
      }

      const newPhoto: ProgressPhoto = {
        id: row.id,
        user_id: row.user_id,
        data: row.data,
        tipo: row.tipo as PhotoType,
        url: row.foto_url,
        peso: row.peso_no_dia ?? undefined,
        percentual_gordura: row.percentual_gordura_no_dia ?? undefined,
        notas: row.notas ?? undefined,
        favorita: row.is_favorita || false,
        created_at: row.created_at
      }

      // Atualizar estado local
      setPhotos(prev => [newPhoto, ...prev])

      return newPhoto
    } catch (err) {
      console.error('Erro ao salvar foto:', err)
      setError(err as Error)
      return null
    }
  }, [])

  // Adicionar foto (legacy - usado para atualização local)
  const addPhoto = useCallback(async (photo: ProgressPhoto): Promise<boolean> => {
    setPhotos(prev => [photo, ...prev])
    return true
  }, [])

  // Atualizar foto
  const updatePhoto = useCallback(async (
    id: string,
    data: Partial<ProgressPhoto>
  ): Promise<boolean> => {
    try {
      const supabase = createClient()

      // Mapear para campos do banco
      const updateData: Record<string, unknown> = {}
      if (data.favorita !== undefined) updateData.is_favorita = data.favorita
      if (data.notas !== undefined) updateData.notas = data.notas
      if (data.peso !== undefined) updateData.peso_no_dia = data.peso
      if (data.percentual_gordura !== undefined) updateData.percentual_gordura_no_dia = data.percentual_gordura

      const { error: updateError } = await (supabase as any)
        .from('fitness_progress_photos')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Erro ao atualizar:', updateError)
        throw updateError
      }

      // Atualizar estado local
      setPhotos(prev =>
        prev.map(p => (p.id === id ? { ...p, ...data } : p))
      )

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
      const supabase = createClient()

      // Buscar a foto para obter a URL
      const photo = photos.find(p => p.id === id)

      // Deletar do banco
      const { error: deleteError } = await (supabase as any)
        .from('fitness_progress_photos')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Erro ao deletar:', deleteError)
        throw deleteError
      }

      // Tentar deletar do storage (extrair path da URL)
      if (photo?.url) {
        const urlParts = photo.url.split('/progress-photos/')
        if (urlParts[1]) {
          await supabase.storage.from('progress-photos').remove([urlParts[1]])
        }
      }

      // Atualizar estado local
      setPhotos(prev => prev.filter(p => p.id !== id))

      return true
    } catch (err) {
      console.error('Erro ao deletar foto:', err)
      setError(err as Error)
      return false
    }
  }, [photos])

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

  // Refresh manual
  const refreshPhotos = useCallback(async () => {
    await loadPhotos()
  }, [loadPhotos])

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
    uploadAndSavePhoto,
    refreshPhotos,
    isLoading,
    error
  }
}
