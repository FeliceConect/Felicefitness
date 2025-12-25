'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholderClassName?: string
  priority?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholderClassName,
  priority = false,
  quality = 75,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-800 text-slate-500',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-2xl">🖼️</span>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Skeleton className={cn('w-full h-full', placeholderClassName)} />
          </motion.div>
        )}
      </AnimatePresence>

      {isInView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            className={cn('object-cover', className)}
            onLoad={handleLoad}
            onError={handleError}
          />
        </motion.div>
      )}
    </div>
  )
}

// Avatar com lazy loading
export function LazyAvatar({
  src,
  alt,
  size = 40,
  fallback,
  className
}: {
  src?: string | null
  alt: string
  size?: number
  fallback?: string
  className?: string
}) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-500 text-white font-bold rounded-full',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <LazyImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      onError={() => setHasError(true)}
      priority
    />
  )
}
