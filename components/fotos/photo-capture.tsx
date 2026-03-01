"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ImageIcon, FlipHorizontal, X, Check } from 'lucide-react'
import { useCamera } from '@/hooks/use-camera'
import { PoseGuideOverlay } from './pose-guide-overlay'
import { type PhotoType } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoCaptureProps {
  type: PhotoType
  onCapture: (blob: Blob) => void
  onSelectFromGallery?: (file: File) => void
  onCancel?: () => void
  showGuide?: boolean
  className?: string
}

export function PhotoCapture({
  type,
  onCapture,
  onSelectFromGallery,
  onCancel,
  showGuide = true,
  className
}: PhotoCaptureProps) {
  const {
    videoRef,
    isReady,
    isActive,
    hasPermission,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    facingMode,
    hasFrontCamera,
    hasBackCamera
  } = useCamera()

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Iniciar câmera ao montar
  useEffect(() => {
    startCamera('environment')
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Atualizar URL do preview
  useEffect(() => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [previewBlob])

  // Capturar foto
  const handleCapture = async () => {
    if (!isReady || isCapturing) return

    setIsCapturing(true)

    try {
      const blob = await capturePhoto()
      if (blob) {
        setPreviewBlob(blob)
      }
    } catch (err) {
      console.error('Erro ao capturar:', err)
    } finally {
      setIsCapturing(false)
    }
  }

  // Confirmar foto
  const handleConfirm = () => {
    if (previewBlob) {
      onCapture(previewBlob)
    }
  }

  // Tirar outra foto
  const handleRetake = () => {
    setPreviewBlob(null)
  }

  // Selecionar da galeria
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onSelectFromGallery) {
      onSelectFromGallery(file)
    }
  }

  // Se não tem permissão
  if (hasPermission === false) {
    return (
      <div className={cn('bg-background rounded-2xl p-8 text-center', className)}>
        <Camera className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
        <h3 className="text-foreground font-semibold mb-2">Acesso à Câmera Negado</h3>
        <p className="text-foreground-secondary text-sm mb-4">
          Por favor, permita o acesso à câmera nas configurações do seu navegador.
        </p>
        <button
          onClick={() => startCamera('environment')}
          className="px-4 py-2 bg-dourado text-white rounded-lg"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  // Se está mostrando preview
  if (previewUrl) {
    return (
      <div className={cn('relative overflow-hidden rounded-2xl', className)}>
        {/* Preview da foto */}
        <div className="relative aspect-[3/4] bg-black">
          <img
            src={previewUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Controles */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetake}
              className="flex items-center gap-2 px-4 py-2 bg-background-elevated text-white rounded-xl"
            >
              <X className="w-4 h-4" />
              <span>Tirar outra</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-dourado to-dourado text-white rounded-xl font-medium"
            >
              <Check className="w-4 h-4" />
              <span>Usar Foto</span>
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Vídeo da câmera */}
      <div className="relative aspect-[3/4] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            facingMode === 'user' && 'scale-x-[-1]'
          )}
        />

        {/* Loading */}
        {!isReady && isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}

        {/* Guia de pose */}
        {showGuide && isReady && (
          <PoseGuideOverlay type={type} opacity={0.25} showTip />
        )}

        {/* Botão de trocar câmera */}
        {hasFrontCamera && hasBackCamera && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={switchCamera}
            className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full"
          >
            <FlipHorizontal className="w-5 h-5 text-white" />
          </motion.button>
        )}

        {/* Botão de cancelar */}
        {onCancel && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            className="absolute top-4 left-4 p-3 bg-black/50 backdrop-blur-sm rounded-full"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </div>

      {/* Controles inferiores */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Botão galeria */}
          {onSelectFromGallery && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full"
            >
              <ImageIcon className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {/* Botão capturar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCapture}
            disabled={!isReady || isCapturing}
            className={cn(
              'w-16 h-16 rounded-full border-4 border-white flex items-center justify-center',
              isReady ? 'bg-white/20' : 'bg-white/10 opacity-50'
            )}
          >
            <AnimatePresence mode="wait">
              {isCapturing ? (
                <motion.div
                  key="capturing"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
              ) : (
                <motion.div
                  key="ready"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-12 h-12 bg-white rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.button>

          {/* Placeholder para alinhamento */}
          {onSelectFromGallery && <div className="w-12" />}
        </div>
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />
    </div>
  )
}
