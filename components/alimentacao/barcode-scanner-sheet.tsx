"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, ScanBarcode, Keyboard, Loader2 } from 'lucide-react'

interface BarcodeScannerSheetProps {
  onDetected: (code: string) => void | Promise<void>
  onClose: () => void
}

// BarcodeDetector é experimental — sem tipos no TS padrão
interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}
type BarcodeDetectorConstructor = new (options?: { formats: string[] }) => BarcodeDetectorLike

function getNativeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
  return w.BarcodeDetector || null
}

interface ZxingControls { stop: () => void }

/**
 * Leitor de código de barras (EAN) para alimentos industrializados.
 *
 * Cadeia de engines de câmera:
 *   1. BarcodeDetector nativo (Chrome/Android — mais rápido)
 *   2. ZXing via JS (@zxing/browser, carregado sob demanda) — funciona em
 *      iPhone/iPad/Safari/Firefox/desktop, onde o nativo não existe
 *   3. Digitação manual do código (último recurso)
 */
export function BarcodeScannerSheet({ onDetected, onClose }: BarcodeScannerSheetProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const zxingControlsRef = useRef<ZxingControls | null>(null)
  const detectingRef = useRef(false)
  const stoppedRef = useRef(false)

  // onDetected via ref: o pai costuma passar uma função recriada a cada
  // render; sem isso o effect da câmera reiniciaria o stream a cada
  // re-render do pai (flicker + MediaStream órfão).
  const onDetectedRef = useRef(onDetected)
  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])

  const stopCamera = useCallback(() => {
    stoppedRef.current = true
    if (zxingControlsRef.current) {
      try { zxingControlsRef.current.stop() } catch { /* já parado */ }
      zxingControlsRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const handleDetected = useCallback(async (code: string) => {
    if (detectingRef.current) return
    detectingRef.current = true
    setSearching(true)
    stopCamera()
    await onDetectedRef.current(code)
    setSearching(false)
  }, [stopCamera])

  // Inicia a câmera com o melhor engine disponível
  useEffect(() => {
    stoppedRef.current = false

    async function startNative(Detector: BarcodeDetectorConstructor): Promise<boolean> {
      let detector: BarcodeDetectorLike
      try {
        detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      } catch {
        return false
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (stoppedRef.current) {
          stream.getTracks().forEach(t => t.stop())
          return true
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraActive(true)

        const tick = async () => {
          if (stoppedRef.current || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && codes[0].rawValue) {
              await handleDetected(codes[0].rawValue)
              return
            }
          } catch { /* frame inválido — segue tentando */ }
          setTimeout(tick, 350)
        }
        tick()
        return true
      } catch {
        // getUserMedia negado/indisponível — sem câmera em nenhum engine
        throw new Error('camera-denied')
      }
    }

    async function startZxing(): Promise<boolean> {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        if (stoppedRef.current || !videoRef.current) return true

        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ])
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 250 })

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' }, audio: false },
          videoRef.current,
          (result) => {
            if (result && !stoppedRef.current) {
              void handleDetected(result.getText())
            }
          }
        )
        if (stoppedRef.current) {
          controls.stop()
          return true
        }
        zxingControlsRef.current = controls
        setCameraActive(true)
        return true
      } catch (err) {
        if (err instanceof Error && /Permission|NotAllowed|NotFound/i.test(String(err))) {
          throw new Error('camera-denied')
        }
        return false
      }
    }

    async function start() {
      try {
        const hasCameraApi = typeof navigator.mediaDevices?.getUserMedia === 'function'
        const Native = getNativeDetector()
        if (Native && hasCameraApi) {
          const ok = await startNative(Native)
          if (ok) return
        }
        if (hasCameraApi) {
          const ok = await startZxing()
          if (ok) return
        }
        // Nenhum engine disponível
        setManualMode(true)
      } catch {
        setCameraError('Não foi possível acessar a câmera. Verifique a permissão ou digite o código manualmente.')
        setManualMode(true)
      }
    }

    start()
    return () => stopCamera()
  }, [handleDetected, stopCamera])

  const handleManualSubmit = () => {
    const code = manualCode.replace(/\D/g, '')
    if (code.length < 8) return
    void handleDetected(code)
  }

  const showCamera = !manualMode && !searching

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center"
      onClick={() => { stopCamera(); onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-dourado" />
            Código de barras
          </h2>
          <button
            onClick={() => { stopCamera(); onClose() }}
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {searching ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-dourado animate-spin" />
            <p className="text-sm text-foreground-secondary">Buscando produto...</p>
          </div>
        ) : (
          <>
            {showCamera && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-20 border-2 border-dourado rounded-lg pointer-events-none" />
                </div>
                <p className="text-xs text-foreground-secondary text-center">
                  Aponte para o código de barras do produto
                </p>
                <button
                  onClick={() => { stopCamera(); setManualMode(true) }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm text-foreground-secondary border border-border rounded-xl hover:bg-background-elevated transition-colors"
                >
                  <Keyboard className="w-4 h-4" />
                  Digitar o código
                </button>
              </div>
            )}

            {manualMode && (
              <div className="space-y-3">
                {cameraError && (
                  <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                    {cameraError}
                  </p>
                )}
                <p className="text-sm text-foreground-secondary">
                  Digite os números do código de barras (embaixo das barras):
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex.: 7891000100103"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-lg tracking-widest placeholder:text-foreground-muted placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-dourado"
                  autoFocus
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={manualCode.length < 8}
                  className="w-full py-3 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors disabled:opacity-50"
                >
                  Buscar produto
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
