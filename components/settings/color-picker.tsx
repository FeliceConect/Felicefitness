'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ColorOption {
  name: string
  value: string
}

interface ColorPickerProps {
  currentColor: string
  colors: ColorOption[]
  onSelect: (color: string) => void
}

export function ColorPicker({ currentColor, colors, onSelect }: ColorPickerProps) {
  return (
    <div className="space-y-4">
      {/* Color circles */}
      <div className="flex flex-wrap gap-3 justify-center">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onSelect(color.value)}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110',
              currentColor === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
            )}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            {currentColor === color.value && (
              <Check className="h-5 w-5 text-white drop-shadow-md" />
            )}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>

        {/* Button preview */}
        <Button
          className="w-full"
          style={{ backgroundColor: currentColor }}
        >
          Botão Primário
        </Button>

        {/* Progress bar preview */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>75%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: '75%', backgroundColor: currentColor }}
            />
          </div>
        </div>

        {/* Badge preview */}
        <div className="flex gap-2">
          <span
            className="px-3 py-1 rounded-full text-sm text-white"
            style={{ backgroundColor: currentColor }}
          >
            Badge
          </span>
          <span
            className="px-3 py-1 rounded-full text-sm"
            style={{ backgroundColor: `${currentColor}20`, color: currentColor }}
          >
            Badge Light
          </span>
        </div>
      </div>
    </div>
  )
}
