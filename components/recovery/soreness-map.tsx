'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SorenessArea } from '@/types/sleep'
import { SORENESS_INTENSITY_LABELS } from '@/types/sleep'

interface SorenessMapProps {
  selectedAreas: SorenessArea[]
  onChange: (areas: SorenessArea[]) => void
  className?: string
}

const BODY_PARTS = [
  { id: 'neck', label: 'Pescoço', emoji: '🦴' },
  { id: 'shoulders', label: 'Ombros', emoji: '💪' },
  { id: 'chest', label: 'Peito', emoji: '🫁' },
  { id: 'upper_back', label: 'Costas Sup.', emoji: '🔙' },
  { id: 'lower_back', label: 'Lombar', emoji: '⬇️' },
  { id: 'arms', label: 'Braços', emoji: '💪' },
  { id: 'abs', label: 'Abdômen', emoji: '🎯' },
  { id: 'glutes', label: 'Glúteos', emoji: '🍑' },
  { id: 'quads', label: 'Quadríceps', emoji: '🦵' },
  { id: 'hamstrings', label: 'Posterior', emoji: '🦵' },
  { id: 'calves', label: 'Panturrilha', emoji: '🦶' },
]

export function SorenessMap({ selectedAreas, onChange, className }: SorenessMapProps) {
  const [editingArea, setEditingArea] = useState<string | null>(null)

  const getAreaIntensity = (areaId: string): number | null => {
    const area = selectedAreas.find(a => a.area === areaId)
    return area ? area.intensity : null
  }

  const toggleArea = (areaId: string) => {
    const existing = selectedAreas.find(a => a.area === areaId)
    if (existing) {
      // If editing same area, open intensity selector
      if (editingArea === areaId) {
        setEditingArea(null)
      } else {
        setEditingArea(areaId)
      }
    } else {
      // Add with default intensity 1
      onChange([...selectedAreas, { area: areaId, intensity: 1 }])
      setEditingArea(areaId)
    }
  }

  const setIntensity = (areaId: string, intensity: number) => {
    const newAreas = selectedAreas.map(a =>
      a.area === areaId ? { ...a, intensity } : a
    )
    onChange(newAreas)
    setEditingArea(null)
  }

  const removeArea = (areaId: string) => {
    onChange(selectedAreas.filter(a => a.area !== areaId))
    setEditingArea(null)
  }

  const getIntensityColor = (intensity: number): string => {
    switch (intensity) {
      case 1: return 'bg-yellow-500/30 border-yellow-500'
      case 2: return 'bg-orange-500/30 border-orange-500'
      case 3: return 'bg-red-500/30 border-red-500'
      default: return 'bg-muted'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-sm text-muted-foreground text-center">
        Toque nas áreas com dor ou desconforto
      </p>

      {/* Body parts grid */}
      <div className="grid grid-cols-3 gap-2">
        {BODY_PARTS.map((part) => {
          const intensity = getAreaIntensity(part.id)
          const isSelected = intensity !== null

          return (
            <button
              key={part.id}
              type="button"
              onClick={() => toggleArea(part.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                isSelected
                  ? getIntensityColor(intensity)
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <span className="text-xl">{part.emoji}</span>
              <span className="text-xs">{part.label}</span>
            </button>
          )
        })}
      </div>

      {/* Intensity selector for editing area */}
      {editingArea && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">
                {BODY_PARTS.find(p => p.id === editingArea)?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeArea(editingArea)}
                className="text-destructive"
              >
                Remover
              </Button>
            </div>

            <div className="flex gap-2">
              {SORENESS_INTENSITY_LABELS.map((level) => (
                <Button
                  key={level.value}
                  type="button"
                  variant={getAreaIntensity(editingArea) === level.value ? 'default' : 'outline'}
                  className={cn(
                    'flex-1',
                    getAreaIntensity(editingArea) === level.value && level.color
                  )}
                  onClick={() => setIntensity(editingArea, level.value)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected areas summary */}
      {selectedAreas.length > 0 && !editingArea && (
        <div className="flex flex-wrap gap-2">
          {selectedAreas.map((area) => {
            const part = BODY_PARTS.find(p => p.id === area.area)
            const intensityLabel = SORENESS_INTENSITY_LABELS.find(l => l.value === area.intensity)
            return (
              <span
                key={area.area}
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  area.intensity === 1 && 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
                  area.intensity === 2 && 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
                  area.intensity === 3 && 'bg-red-500/20 text-red-700 dark:text-red-400'
                )}
              >
                {part?.label} ({intensityLabel?.label})
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
