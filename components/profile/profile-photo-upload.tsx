'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProfilePhotoUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPhoto?: string
  onUpload: (file: File) => Promise<string>
}

export function ProfilePhotoUpload({
  open,
  onOpenChange,
  currentPhoto,
  onUpload
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (máx. 5MB)')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      await onUpload(file)
      onOpenChange(false)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setPreview(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden bg-muted border-4 border-border">
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setPreview(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt="Foto atual"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Escolher foto
            </Button>

            {preview && (
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, GIF. Máximo: 5MB.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
