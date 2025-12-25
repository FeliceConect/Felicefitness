'use client'

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => ReactNode
  overscan?: number
  className?: string
  containerClassName?: string
  emptyMessage?: ReactNode
  keyExtractor: (item: T, index: number) => string
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  containerClassName,
  emptyMessage = 'Nenhum item',
  keyExtractor
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      setContainerHeight(container.clientHeight)
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (container) {
      setScrollTop(container.scrollTop)
    }
  }, [])

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8 text-slate-400', className)}>
        {emptyMessage}
      </div>
    )
  }

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const offsetTop = startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('overflow-auto', containerClassName)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetTop,
            left: 0,
            right: 0
          }}
          className={className}
        >
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, startIndex + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Lista simples com lazy loading (sem virtualização)
interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  batchSize?: number
  className?: string
  loadingComponent?: ReactNode
  keyExtractor: (item: T, index: number) => string
}

export function LazyList<T>({
  items,
  renderItem,
  batchSize = 10,
  className,
  loadingComponent,
  keyExtractor
}: LazyListProps<T>) {
  const [displayCount, setDisplayCount] = useState(batchSize)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && displayCount < items.length) {
          setDisplayCount(prev => Math.min(prev + batchSize, items.length))
        }
      },
      { rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [displayCount, items.length, batchSize])

  const displayedItems = items.slice(0, displayCount)
  const hasMore = displayCount < items.length

  return (
    <div className={className}>
      {displayedItems.map((item, index) => (
        <div key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </div>
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {loadingComponent || (
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  )
}
