'use client'

import { useState, useEffect, useCallback, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, X, Loader2 } from 'lucide-react'

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
  showClearButton?: boolean
  isLoading?: boolean
}

export const DebouncedInput = forwardRef<HTMLInputElement, DebouncedInputProps>(
  (
    {
      value: externalValue,
      onChange,
      debounceMs = 300,
      showClearButton = true,
      isLoading = false,
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(externalValue)

    useEffect(() => {
      setInternalValue(externalValue)
    }, [externalValue])

    useEffect(() => {
      const timer = setTimeout(() => {
        if (internalValue !== externalValue) {
          onChange(internalValue)
        }
      }, debounceMs)

      return () => clearTimeout(timer)
    }, [internalValue, debounceMs, onChange, externalValue])

    const handleClear = useCallback(() => {
      setInternalValue('')
      onChange('')
    }, [onChange])

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          className={cn('pr-10', className)}
          {...props}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-foreground-muted animate-spin" />
          )}
          {showClearButton && internalValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)

DebouncedInput.displayName = 'DebouncedInput'

// Search input com ícone
interface SearchInputProps extends Omit<DebouncedInputProps, 'type'> {
  onSearch?: (value: string) => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onChange, ...props }, ref) => {
    const handleChange = useCallback(
      (value: string) => {
        onChange(value)
        onSearch?.(value)
      },
      [onChange, onSearch]
    )

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
        <DebouncedInput
          ref={ref}
          type="search"
          onChange={handleChange}
          className={cn('pl-10', className)}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

// Hook para debounce de valores
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastExecuted = useRef(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecuted.current

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, interval - timeSinceLastExecution)

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

// Importar useRef que faltou
import { useRef } from 'react'
