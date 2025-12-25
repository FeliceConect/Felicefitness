'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`
      }
    })

    return unsubscribe
  }, [springValue, decimals, prefix, suffix])

  if (prefersReducedMotion) {
    return (
      <span className={className}>
        {prefix}{value.toFixed(decimals)}{suffix}
      </span>
    )
  }

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>
}
