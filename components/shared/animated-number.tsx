"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatFn?: (n: number) => string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  formatFn = (n) => Math.round(n).toString(),
  className = ''
}: AnimatedNumberProps) {
  const spring = useSpring(0, { duration: duration * 1000 })
  const display = useTransform(spring, (current) => formatFn(current))
  const [displayValue, setDisplayValue] = useState(formatFn(0))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    return display.on('change', (v) => setDisplayValue(v))
  }, [display])

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  )
}

// Versão simplificada sem framer-motion para SSR
export function SimpleAnimatedNumber({
  value,
  formatFn = (n) => Math.round(n).toString(),
  className = ''
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const duration = 600 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = startValue + (endValue - startValue) * eased
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        previousValue.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <span className={className}>
      {formatFn(displayValue)}
    </span>
  )
}
