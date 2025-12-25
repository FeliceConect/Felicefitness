"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, ImageIcon, Check, Star } from 'lucide-react'
import { format } from 'date-fns'
import { PhotoTypeSelector, PhotoCapture } from '@/components/fotos'
import { usePhotos } from '@/hooks/use-photos'
import { resizeImage, compressImage, blobToFile } from '@/lib/photos/processing'
import { type PhotoType, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

type Step = 'type' | 'capture' | 'preview'

export default function NovaFotoPage() {
  const router = useRouter()
  const { uploadAndSavePhoto } = usePhotos()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('type')
  const [photoType, setPhotoType] = useState<PhotoType>('frente')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  // Dados opcionais
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [peso, setPeso] = useState('')
  const [percentualGordura, setPercentualGordura] = useState('')
  const [notas, setNotas] = useState('')

  const [isSaving, setIsSaving] = useState(false)

  // Quando captura uma foto
  const handleCapture = async (blob: Blob) => {
    // Processar imagem
    const resizedBlob = await resizeImage(blobToFile(blob, 'photo.jpg'), 1920)
    const compressedBlob = await compressImage(resizedBlob, 0.85)

    setCapturedBlob(compressedBlob)
    setPreviewUrl(URL.createObjectURL(compressedBlob))
    setStep('preview')
  }

  // Quando seleciona da galeria
  const handleGallerySelect = async (file: File) => {
    const resizedBlob = await resizeImage(file, 1920)
    const compressedBlob = await compressImage(resizedBlob, 0.85)

    setCapturedBlob(compressedBlob)
    setPreviewUrl(URL.createObjectURL(compressedBlob))
    setStep('preview')
  }

  // Voltar para captura
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setCapturedBlob(null)
    setPreviewUrl(null)
    setStep('capture')
  }

  // Salvar foto
  const handleSave = async () => {
    if (!capturedBlob) return

    setIsSaving(true)

    try {
      // Upload e salvar no Supabase
      const savedPhoto = await uploadAndSavePhoto(capturedBlob, {
        data,
        tipo: photoType,
        peso: peso ? parseFloat(peso) : undefined,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura) : undefined,
        notas: notas || undefined,
        favorita: isFavorite
      })

      if (savedPhoto) {
        router.push('/fotos')
      } else {
        alert('Erro ao salvar foto. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao salvar foto:', error)
      alert('Erro ao salvar foto. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => {
            if (step === 'type') {
              router.back()
            } else if (step === 'capture') {
              setStep('type')
            } else {
              handleRetake()
            }
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Nova Foto</h1>
        <p className="text-slate-400 text-sm">
          {step === 'type' && 'Selecione o tipo de foto'}
          {step === 'capture' && `Tire uma foto: ${PHOTO_TYPE_LABELS[photoType]}`}
          {step === 'preview' && 'Revise e salve sua foto'}
        </p>
      </div>

      {/* Step: Selecionar tipo */}
      <AnimatePresence mode="wait">
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4"
          >
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-3">Tipo de foto</p>
              <PhotoTypeSelector
                selected={photoType}
                onChange={setPhotoType}
              />
            </div>

            {/* Dica */}
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-300 mb-2">
                Dicas para {PHOTO_TYPE_LABELS[photoType]}:
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                <li>- Use roupas justas ou de praia</li>
                <li>- Mantenha boa iluminação</li>
                <li>- Posicione-se sempre no mesmo local</li>
                <li>- Relaxe os músculos naturalmente</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('capture')}
                className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl font-medium"
              >
                <Camera className="w-5 h-5" />
                <span>Usar Câmera</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-4 bg-[#1E1E2E] text-white rounded-xl font-medium border border-[#2E2E3E]"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Da Galeria</span>
              </motion.button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleGallerySelect(file)
              }}
              className="hidden"
            />
          </motion.div>
        )}

        {/* Step: Capturar */}
        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4"
          >
            <PhotoCapture
              type={photoType}
              onCapture={handleCapture}
              onSelectFromGallery={handleGallerySelect}
              onCancel={() => setStep('type')}
              showGuide
            />
          </motion.div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && previewUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 pb-24"
          >
            {/* Preview da foto */}
            <div className="relative mb-6">
              <div className="aspect-[3/4] max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-[#14141F]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />

                {/* Tipo badge */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 rounded-full">
                  <span className="text-white text-xs font-medium">
                    {PHOTO_TYPE_LABELS[photoType]}
                  </span>
                </div>

                {/* Favorita */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="absolute top-3 right-3 p-2 bg-black/60 rounded-full"
                >
                  <Star
                    className={cn(
                      'w-5 h-5',
                      isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'
                    )}
                  />
                </motion.button>
              </div>
            </div>

            {/* Dados opcionais */}
            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-400">Dados opcionais</p>

              <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 space-y-4">
                {/* Data */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Data</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-[#0A0A0F] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Peso e Gordura */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="82.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full bg-[#0A0A0F] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">% Gordura</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="17.3"
                      value={percentualGordura}
                      onChange={(e) => setPercentualGordura(e.target.value)}
                      className="w-full bg-[#0A0A0F] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Notas</label>
                  <textarea
                    placeholder="Ex: 3 meses de treino..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0A0A0F] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2',
                  isSaving
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white'
                )}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Salvar Foto
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetake}
                className="w-full py-3 bg-[#1E1E2E] text-slate-400 rounded-xl font-medium border border-[#2E2E3E]"
              >
                Tirar outra foto
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
