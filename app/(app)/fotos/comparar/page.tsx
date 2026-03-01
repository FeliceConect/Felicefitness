"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Layers, SlidersHorizontal, Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePhotos } from '@/hooks/use-photos'
import { usePhotoComparison } from '@/hooks/use-photo-comparison'
import { PhotoComparison, PhotoComparisonSlider } from '@/components/fotos'
import { type PhotoType, type ComparisonMode, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

type SelectionStep = 'type' | 'before' | 'after' | 'compare'

export default function CompararFotosPage() {
  const router = useRouter()
  const { photos } = usePhotos()
  const { beforePhoto, afterPhoto, setBeforePhoto, setAfterPhoto, clearSelection } = usePhotoComparison()

  const [step, setStep] = useState<SelectionStep>('type')
  const [selectedType, setSelectedType] = useState<PhotoType>('frente')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('side-by-side')

  // Filtrar fotos por tipo selecionado
  const filteredPhotos = useMemo(() => {
    return photos
      .filter(p => p.tipo === selectedType)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [photos, selectedType])

  // Selecionar tipo e ir para seleção de "antes"
  const handleTypeSelect = (type: PhotoType) => {
    setSelectedType(type)
    clearSelection()
    setStep('before')
  }

  // Selecionar foto "antes"
  const handleBeforeSelect = (photoId: string) => {
    const photo = filteredPhotos.find(p => p.id === photoId)
    if (photo) {
      setBeforePhoto(photo)
      setStep('after')
    }
  }

  // Selecionar foto "depois"
  const handleAfterSelect = (photoId: string) => {
    const photo = filteredPhotos.find(p => p.id === photoId)
    if (photo) {
      setAfterPhoto(photo)
      setStep('compare')
    }
  }

  // Voltar um passo
  const goBack = () => {
    if (step === 'type') {
      router.back()
    } else if (step === 'before') {
      setStep('type')
    } else if (step === 'after') {
      setBeforePhoto(null)
      setStep('before')
    } else {
      setAfterPhoto(null)
      setStep('after')
    }
  }

  // Tipos de foto disponíveis
  const photoTypes: PhotoType[] = ['frente', 'lado_esquerdo', 'lado_direito', 'costas']

  // Contagem de fotos por tipo
  const photoCountByType = useMemo(() => {
    const counts: Record<PhotoType, number> = {
      frente: 0,
      lado_esquerdo: 0,
      lado_direito: 0,
      costas: 0
    }
    photos.forEach(p => {
      counts[p.tipo]++
    })
    return counts
  }, [photos])

  // Fotos disponíveis para "depois" (excluindo a selecionada como "antes")
  const afterPhotos = useMemo(() => {
    return filteredPhotos.filter(p => p.id !== beforePhoto?.id)
  }, [filteredPhotos, beforePhoto])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground">Comparar Fotos</h1>
        <p className="text-foreground-secondary text-sm">
          {step === 'type' && 'Selecione o tipo de foto para comparar'}
          {step === 'before' && `Selecione a foto ANTES (${PHOTO_TYPE_LABELS[selectedType]})`}
          {step === 'after' && `Selecione a foto DEPOIS (${PHOTO_TYPE_LABELS[selectedType]})`}
          {step === 'compare' && 'Compare sua evolução'}
        </p>
      </div>

      {/* Step: Selecionar tipo */}
      {step === 'type' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {photoTypes.map(type => {
              const count = photoCountByType[type]
              const disabled = count < 2

              return (
                <motion.button
                  key={type}
                  whileHover={disabled ? {} : { scale: 1.02 }}
                  whileTap={disabled ? {} : { scale: 0.98 }}
                  onClick={() => !disabled && handleTypeSelect(type)}
                  disabled={disabled}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-colors',
                    disabled
                      ? 'bg-white border-border opacity-50 cursor-not-allowed'
                      : 'bg-white border-border hover:border-dourado/50'
                  )}
                >
                  <div className="text-3xl mb-2">
                    {type === 'frente' ? '🧍' :
                     type === 'lado_esquerdo' ? '👈' :
                     type === 'lado_direito' ? '👉' : '🔙'}
                  </div>
                  <p className="text-foreground font-medium">{PHOTO_TYPE_LABELS[type]}</p>
                  <p className={cn(
                    'text-sm',
                    disabled ? 'text-red-400' : 'text-foreground-secondary'
                  )}>
                    {count} {count === 1 ? 'foto' : 'fotos'}
                    {disabled && ' (mín. 2)'}
                  </p>
                </motion.button>
              )
            })}
          </div>

          {photos.length < 2 && (
            <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-sm">
                Você precisa de pelo menos 2 fotos do mesmo tipo para fazer uma comparação.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Step: Selecionar foto "antes" */}
      {step === 'before' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-4"
        >
          <div className="grid grid-cols-3 gap-2">
            {filteredPhotos.map(photo => (
              <motion.button
                key={photo.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBeforeSelect(photo.id)}
                className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-dourado transition-colors"
              >
                <div className="w-full h-full bg-gradient-to-br from-dourado/10 to-vinho/10 flex flex-col items-center justify-center relative">
                  <span className="text-3xl opacity-30">
                    {photo.tipo === 'frente' ? '🧍' :
                     photo.tipo === 'lado_esquerdo' ? '👈' :
                     photo.tipo === 'lado_direito' ? '👉' : '🔙'}
                  </span>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium truncate">
                      {format(parseISO(photo.data), 'dd/MM/yy', { locale: ptBR })}
                    </p>
                    {photo.peso && (
                      <p className="text-dourado text-xs">
                        {photo.peso.toFixed(1)}kg
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step: Selecionar foto "depois" */}
      {step === 'after' && beforePhoto && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-4"
        >
          {/* Preview da foto "antes" selecionada */}
          <div className="bg-white border border-border rounded-xl p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-dourado/10 to-vinho/10 flex items-center justify-center">
                <span className="text-xl opacity-30">
                  {beforePhoto.tipo === 'frente' ? '🧍' :
                   beforePhoto.tipo === 'lado_esquerdo' ? '👈' :
                   beforePhoto.tipo === 'lado_direito' ? '👉' : '🔙'}
                </span>
              </div>
              <div>
                <p className="text-xs text-dourado uppercase font-medium">Antes</p>
                <p className="text-foreground text-sm">
                  {format(parseISO(beforePhoto.data), "d 'de' MMM, yyyy", { locale: ptBR })}
                </p>
                {beforePhoto.peso && (
                  <p className="text-foreground-secondary text-xs">{beforePhoto.peso.toFixed(1)}kg</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-foreground-secondary mb-3">Selecione a foto DEPOIS:</p>

          <div className="grid grid-cols-3 gap-2">
            {afterPhotos.map(photo => (
              <motion.button
                key={photo.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAfterSelect(photo.id)}
                className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-dourado transition-colors"
              >
                <div className="w-full h-full bg-gradient-to-br from-dourado/10 to-vinho/10 flex flex-col items-center justify-center relative">
                  <span className="text-3xl opacity-30">
                    {photo.tipo === 'frente' ? '🧍' :
                     photo.tipo === 'lado_esquerdo' ? '👈' :
                     photo.tipo === 'lado_direito' ? '👉' : '🔙'}
                  </span>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium truncate">
                      {format(parseISO(photo.data), 'dd/MM/yy', { locale: ptBR })}
                    </p>
                    {photo.peso && (
                      <p className="text-dourado text-xs">
                        {photo.peso.toFixed(1)}kg
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step: Comparação */}
      {step === 'compare' && beforePhoto && afterPhoto && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-4"
        >
          {/* Seletor de modo */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setComparisonMode('side-by-side')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                comparisonMode === 'side-by-side'
                  ? 'bg-dourado text-white'
                  : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
              )}
            >
              <Layers className="w-4 h-4" />
              Lado a lado
            </button>

            <button
              onClick={() => setComparisonMode('slider')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                comparisonMode === 'slider'
                  ? 'bg-dourado text-white'
                  : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Slider
            </button>

            <button
              onClick={() => setComparisonMode('fade')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                comparisonMode === 'fade'
                  ? 'bg-dourado text-white'
                  : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Fade
            </button>
          </div>

          {/* Visualização */}
          {comparisonMode === 'slider' ? (
            <PhotoComparisonSlider
              beforePhoto={beforePhoto}
              afterPhoto={afterPhoto}
            />
          ) : (
            <PhotoComparison
              before={beforePhoto}
              after={afterPhoto}
              mode={comparisonMode}
            />
          )}

          {/* Resumo da evolução */}
          {(beforePhoto.peso && afterPhoto.peso) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-white border border-border rounded-xl p-4"
            >
              <h3 className="text-foreground font-medium mb-3">Resumo da Evolução</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-foreground-secondary text-xs mb-1">Peso</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground font-bold">
                      {(afterPhoto.peso - beforePhoto.peso).toFixed(1)}kg
                    </span>
                    <span className={cn(
                      'text-sm',
                      afterPhoto.peso < beforePhoto.peso ? 'text-emerald-400' : 'text-amber-400'
                    )}>
                      {afterPhoto.peso < beforePhoto.peso ? '↓' : '↑'}
                    </span>
                  </div>
                </div>

                {(beforePhoto.percentual_gordura && afterPhoto.percentual_gordura) && (
                  <div>
                    <p className="text-foreground-secondary text-xs mb-1">% Gordura</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-foreground font-bold">
                        {(afterPhoto.percentual_gordura - beforePhoto.percentual_gordura).toFixed(1)}%
                      </span>
                      <span className={cn(
                        'text-sm',
                        afterPhoto.percentual_gordura < beforePhoto.percentual_gordura ? 'text-emerald-400' : 'text-amber-400'
                      )}>
                        {afterPhoto.percentual_gordura < beforePhoto.percentual_gordura ? '↓' : '↑'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-foreground-secondary text-xs">
                  Período: {format(parseISO(beforePhoto.data), "d 'de' MMM", { locale: ptBR })} → {format(parseISO(afterPhoto.data), "d 'de' MMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </motion.div>
          )}

          {/* Botão para nova comparação */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              clearSelection()
              setStep('type')
            }}
            className="w-full mt-6 py-3 bg-background-elevated text-foreground rounded-xl font-medium border border-border"
          >
            Nova Comparação
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
