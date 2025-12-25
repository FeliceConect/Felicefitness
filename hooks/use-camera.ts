"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseCameraReturn {
  // Estado
  isReady: boolean
  hasPermission: boolean | null
  error: Error | null
  isActive: boolean

  // Refs
  videoRef: React.RefObject<HTMLVideoElement>

  // Controles
  startCamera: (facingMode?: 'user' | 'environment') => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  capturePhoto: () => Promise<Blob | null>

  // Capacidades
  facingMode: 'user' | 'environment'
  hasFrontCamera: boolean
  hasBackCamera: boolean
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const streamRef = useRef<MediaStream | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [hasFrontCamera, setHasFrontCamera] = useState(false)
  const [hasBackCamera, setHasBackCamera] = useState(false)

  // Verificar câmeras disponíveis
  useEffect(() => {
    async function checkCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')

        // Simplificação: assumir que se há mais de 1 câmera, tem front e back
        if (videoDevices.length >= 2) {
          setHasFrontCamera(true)
          setHasBackCamera(true)
        } else if (videoDevices.length === 1) {
          setHasFrontCamera(true)
          setHasBackCamera(false)
        }
      } catch (err) {
        console.error('Erro ao verificar câmeras:', err)
      }
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      checkCameras()
    }
  }, [])

  // Iniciar câmera
  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'environment') => {
    setError(null)

    try {
      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      streamRef.current = stream
      setFacingMode(mode)
      setHasPermission(true)
      setIsActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsReady(true)
        }
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError(err as Error)
      setHasPermission(false)
      setIsActive(false)
    }
  }, [])

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsReady(false)
    setIsActive(false)
  }, [])

  // Alternar câmera
  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    await startCamera(newMode)
  }, [facingMode, startCamera])

  // Capturar foto
  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !isReady) {
      setError(new Error('Câmera não está pronta'))
      return null
    }

    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Falha ao criar contexto canvas')
      }

      // Se câmera frontal, espelhar a imagem
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }

      ctx.drawImage(video, 0, 0)

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Falha ao capturar foto'))
            }
          },
          'image/jpeg',
          0.92
        )
      })
    } catch (err) {
      console.error('Erro ao capturar foto:', err)
      setError(err as Error)
      return null
    }
  }, [isReady, facingMode])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    isReady,
    hasPermission,
    error,
    isActive,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    facingMode,
    hasFrontCamera,
    hasBackCamera
  }
}
