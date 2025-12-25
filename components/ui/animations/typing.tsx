'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TypingAnimationProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  showCursor?: boolean
  onComplete?: () => void
}

export function TypingAnimation({
  text,
  speed = 50,
  delay = 0,
  className,
  showCursor = true,
  onComplete
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [showCursorState, setShowCursorState] = useState(true)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)

    const startTimeout = setTimeout(() => {
      let currentIndex = 0

      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(intervalId)
          setIsComplete(true)
          onComplete?.()
        }
      }, speed)

      return () => clearInterval(intervalId)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [text, speed, delay, onComplete])

  // Cursor blinking
  useEffect(() => {
    if (!showCursor) return

    const cursorInterval = setInterval(() => {
      setShowCursorState((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [showCursor])

  return (
    <span className={cn('inline', className)}>
      {displayedText}
      {showCursor && !isComplete && (
        <motion.span
          className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
          animate={{ opacity: showCursorState ? 1 : 0 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </span>
  )
}

// Typing com múltiplas linhas/frases
export function TypingSequence({
  texts,
  speed = 50,
  delayBetween = 1000,
  className,
  loop = false
}: {
  texts: string[]
  speed?: number
  delayBetween?: number
  className?: string
  loop?: boolean
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [key, setKey] = useState(0)

  const handleComplete = () => {
    setTimeout(() => {
      if (currentIndex < texts.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setKey((prev) => prev + 1)
      } else if (loop) {
        setCurrentIndex(0)
        setKey((prev) => prev + 1)
      }
    }, delayBetween)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <TypingAnimation
          text={texts[currentIndex]}
          speed={speed}
          onComplete={handleComplete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
