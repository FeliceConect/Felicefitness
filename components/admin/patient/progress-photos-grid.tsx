"use client"

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Camera, Upload, Loader2, X, Check, ChevronDown, ChevronUp, RefreshCw, ImageOff } from 'lucide-react'
import { resizeImage, blobToFile } from '@/lib/photos/processing'
import { progressPhotoSrc } from '@/lib/photos/proxy-url'

interface ProgressPhoto {
  id: string
  data: string
  momento_avaliacao: string | null
  posicao: string | null
  foto_url: string
}

interface ProgressPhotosGridProps {
  patientId: string
  defaultOpen?: boolean
}

const MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] as const
const POSICOES = [
  { key: 'frontal', label: 'Frontal' },
  { key: 'lateral_d', label: 'Lateral D' },
  { key: 'lateral_e', label: 'Lateral E' },
  { key: 'costas', label: 'Costas' },
] as const

type MomentoKey = typeof MOMENTOS[number]
type PosicaoKey = typeof POSICOES[number]['key']

export function ProgressPhotosGrid({ patientId, defaultOpen = false }: ProgressPhotosGridProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [uploadingCell, setUploadingCell] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({})
  const [loadError, setLoadError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingCell = useRef<{ momento: MomentoKey; posicao: PosicaoKey; replacePhotoId?: string } | null>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/progress-photos`)
      const json = await res.json()
      if (json.success) {
        setPhotos(json.photos || [])
        setFailedPhotos({})
        setLoadError(false)
      } else {
        // Sem isso, falha de permissão vira grade vazia — indistinguível de
        // "paciente nunca tirou foto", que é a leitura errada e perigosa.
        setLoadError(true)
      }
    } catch (err) {
      console.error('Erro ao carregar fotos:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchPhotos()
  }, [open, patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const findPhoto = (momento: MomentoKey, posicao: PosicaoKey): ProgressPhoto | undefined => {
    return photos.find(p => p.momento_avaliacao === momento && p.posicao === posicao)
  }

  const photoSrc = (photo: ProgressPhoto) => progressPhotoSrc(patientId, photo.id)

  const handleSelectFile = (momento: MomentoKey, posicao: PosicaoKey, replacePhotoId?: string) => {
    pendingCell.current = { momento, posicao, replacePhotoId }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0]
    if (!originalFile || !pendingCell.current) return
    const { momento, posicao, replacePhotoId } = pendingCell.current
    const cellKey = `${momento}_${posicao}`

    setUploadingCell(cellKey)
    try {
      // Pré-resize client-side para evitar 413 do Vercel (4.5 MB por request).
      // HEIC/HEIF não é renderizável pelo <img>, então mandamos cru (sharp no server converte).
      let fileToUpload: File = originalFile
      const isHeic = /heic|heif/i.test(originalFile.type) || /\.(heic|heif)$/i.test(originalFile.name)
      const tooLarge = originalFile.size > 3 * 1024 * 1024 // > 3 MB

      if (!isHeic && tooLarge) {
        try {
          const resizedBlob = await resizeImage(originalFile, 2000, 2000)
          fileToUpload = blobToFile(resizedBlob, originalFile.name.replace(/\.[^.]+$/, '.jpg'))
        } catch (resizeErr) {
          console.error('Falha ao redimensionar, enviando original:', resizeErr)
        }
      }

      if (fileToUpload.size > 4 * 1024 * 1024) {
        toast.error('Imagem muito grande. Tente uma foto menor (máx. ~4 MB).')
        return
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      let url: string
      let method: 'POST' | 'PUT'
      if (replacePhotoId) {
        url = `/api/admin/patients/${patientId}/progress-photos/${replacePhotoId}`
        method = 'PUT'
      } else {
        formData.append('momento_avaliacao', momento)
        formData.append('posicao', posicao)
        url = `/api/admin/patients/${patientId}/progress-photos`
        method = 'POST'
      }

      const res = await fetch(url, { method, body: formData })

      // Response pode não ser JSON (ex.: 413 da plataforma retorna HTML)
      let json: { success?: boolean; error?: string } = {}
      try {
        json = await res.json()
      } catch {
        if (res.status === 413) {
          toast.error('Imagem muito grande para envio. Use uma foto menor.')
          return
        }
        toast.error(`Erro ${res.status} ao enviar foto`)
        return
      }

      if (json.success) {
        toast.success(`Foto ${momento} — ${posicao} ${replacePhotoId ? 'substituída' : 'salva'}`)
        await fetchPhotos()
      } else {
        toast.error(json.error || `Erro ao enviar foto (HTTP ${res.status})`)
      }
    } catch (err) {
      console.error('Erro upload foto:', err)
      toast.error('Erro ao enviar foto')
    } finally {
      setUploadingCell(null)
      pendingCell.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Remover esta foto?')) return
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/progress-photos?photo_id=${photoId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Foto removida')
        setPhotos(prev => prev.filter(p => p.id !== photoId))
      } else {
        toast.error(json.error || 'Erro ao remover')
      }
    } catch (err) {
      console.error('Erro delete foto:', err)
      toast.error('Erro ao remover foto')
    }
  }

  const momentoComplete = (momento: MomentoKey): boolean => {
    return POSICOES.every(p => findPhoto(momento, p.key))
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-background-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-dourado" />
          <h2 className="text-lg font-semibold text-foreground">Fotos de Evolução (M0 → M6)</h2>
          <span className="text-xs text-foreground-muted">4 posições por momento</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-foreground-secondary" /> : <ChevronDown className="w-5 h-5 text-foreground-secondary" />}
      </button>

      {open && (
        <div className="px-6 pb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {loading ? (
            <div className="py-8 text-center text-foreground-muted text-sm">
              <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
              Carregando fotos...
            </div>
          ) : loadError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-foreground-secondary mb-3">
                Não conseguimos carregar as fotos deste paciente.
              </p>
              <button
                onClick={fetchPhotos}
                className="px-4 py-2 text-sm rounded-lg bg-dourado text-white hover:bg-dourado/90"
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-foreground-secondary pb-3 w-20">Momento</th>
                    {POSICOES.map(p => (
                      <th key={p.key} className="text-center text-xs font-medium text-foreground-secondary pb-3">{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOMENTOS.map(momento => (
                    <tr key={momento} className="border-t border-border/50">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-sm">{momento}</span>
                          {momentoComplete(momento) && <Check className="w-3.5 h-3.5 text-green-600" />}
                        </div>
                      </td>
                      {POSICOES.map(p => {
                        const photo = findPhoto(momento, p.key)
                        const cellKey = `${momento}_${p.key}`
                        const uploading = uploadingCell === cellKey
                        return (
                          <td key={p.key} className="py-1.5 px-1.5">
                            <div className="aspect-[3/4] w-full max-w-[120px] mx-auto relative rounded-lg overflow-hidden bg-background-elevated border border-border group">
                              {photo ? (
                                <>
                                  {failedPhotos[photo.id] ? (
                                    <button
                                      onClick={() => setFailedPhotos(prev => ({ ...prev, [photo.id]: false }))}
                                      className="w-full h-full flex flex-col items-center justify-center gap-1 text-foreground-muted hover:text-dourado px-1"
                                      title="Não foi possível carregar. Tentar de novo."
                                    >
                                      <ImageOff className="w-4 h-4" />
                                      <span className="text-[10px] text-center leading-tight">Falhou<br />Tentar de novo</span>
                                    </button>
                                  ) : (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={photoSrc(photo)}
                                    alt={`${momento} ${p.label}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewUrl(photoSrc(photo))}
                                    onError={() => setFailedPhotos(prev => ({ ...prev, [photo.id]: true }))}
                                  />
                                  )}
                                  {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    </div>
                                  )}
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleSelectFile(momento, p.key, photo.id)}
                                      disabled={uploading}
                                      className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                                      aria-label="Substituir foto"
                                      title="Substituir"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(photo.id)}
                                      disabled={uploading}
                                      className="p-1 rounded-full bg-black/60 text-white hover:bg-red-600"
                                      aria-label="Remover foto"
                                      title="Remover"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleSelectFile(momento, p.key)}
                                  disabled={uploading}
                                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-foreground-muted hover:bg-dourado/5 hover:text-dourado transition-colors"
                                >
                                  {uploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      <span className="text-[10px]">Adicionar</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-foreground-muted mt-3">
            Padrão: iluminação frontal difusa, fundo neutro, roupa íntima/biquíni, distância 2m. Mesmas condições em todos os momentos.
          </p>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
