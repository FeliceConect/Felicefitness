"use client"

import { motion } from 'framer-motion'
import { type PhotoType, PHOTO_TYPE_LABELS, PHOTO_TYPE_ICONS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoTypeSelectorProps {
  selected: PhotoType
  onChange: (type: PhotoType) => void
  disabled?: boolean
  className?: string
}

const photoTypes: PhotoType[] = ['frente', 'lado_esquerdo', 'lado_direito', 'costas']

export function PhotoTypeSelector({
  selected,
  onChange,
  disabled = false,
  className
}: PhotoTypeSelectorProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {photoTypes.map(type => {
        const isSelected = selected === type

        return (
          <motion.button
            key={type}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl border transition-all',
              isSelected
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-[#2E2E3E] bg-[#14141F] hover:border-violet-500/30',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-2xl mb-1">{PHOTO_TYPE_ICONS[type]}</span>
            <span
              className={cn(
                'text-xs font-medium text-center',
                isSelected ? 'text-violet-400' : 'text-slate-400'
              )}
            >
              {PHOTO_TYPE_LABELS[type]}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
