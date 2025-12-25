'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  direction?: 'up' | 'down'
  delay?: number
  className?: string
  decimalPlaces?: number
  duration?: number
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  duration = 1
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [isInView, setIsInView] = useState(false)

  const springValue = useSpring(direction === 'up' ? 0 : value, {
    damping: 60,
    stiffness: 100,
    duration: duration * 1000
  })

  const displayValue = useTransform(springValue, (current) =>
    current.toFixed(decimalPlaces)
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        springValue.set(direction === 'up' ? value : 0)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [isInView, value, direction, delay, springValue])

  return (
    <motion.span ref={ref} className={cn('tabular-nums', className)}>
      {displayValue}
    </motion.span>
  )
}

// Versão com prefixo/sufixo
export function NumberTickerWithUnit({
  value,
  prefix,
  suffix,
  className,
  ...props
}: NumberTickerProps & {
  prefix?: string
  suffix?: string
}) {
  return (
    <span className={cn('inline-flex items-baseline', className)}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <NumberTicker value={value} {...props} />
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  )
}

// Para porcentagens
export function PercentageTicker({
  value,
  className,
  ...props
}: Omit<NumberTickerProps, 'decimalPlaces'>) {
  return (
    <NumberTickerWithUnit
      value={value}
      suffix="%"
      decimalPlaces={0}
      className={className}
      {...props}
    />
  )
}
