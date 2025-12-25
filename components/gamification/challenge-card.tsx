"use client"

import { motion } from 'framer-motion'
import type { ActiveChallenge } from '@/types/gamification'
import {
  getChallengeTypeColor,
  getChallengeTypeLabel,
  getChallengeProgressPercentage,
  getChallengeTimeRemaining
} from '@/lib/gamification'

interface ChallengeCardProps {
  challenge: ActiveChallenge
  onClick?: () => void
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const typeColor = getChallengeTypeColor(challenge.type)
  const typeLabel = getChallengeTypeLabel(challenge.type)
  const progressPercentage = getChallengeProgressPercentage(challenge)
  const timeRemaining = getChallengeTimeRemaining(challenge)

  return (
    <motion.div
      className={`relative p-4 rounded-xl border bg-card/50 ${
        challenge.completed
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-border hover:border-primary/50'
      } cursor-pointer transition-colors`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge de Tipo */}
      <div
        className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: typeColor }}
      >
        {typeLabel}
      </div>

      <div className="flex items-start gap-3 mt-2">
        {/* Ícone */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
            challenge.completed ? 'bg-green-500/20' : 'bg-primary/20'
          }`}
        >
          {challenge.completed ? '✅' : challenge.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${challenge.completed ? 'text-green-500' : 'text-foreground'}`}>
            {challenge.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {challenge.description}
          </p>

          {/* Progresso */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{challenge.progress}/{challenge.target}</span>
              <span
                className={`font-medium ${timeRemaining.expired ? 'text-red-500' : ''}`}
              >
                {timeRemaining.label}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  challenge.completed ? 'bg-green-500' : ''
                }`}
                style={challenge.completed ? {} : { backgroundColor: typeColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* XP Reward */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs">⭐</span>
              <span className="text-xs text-amber-500 font-medium">
                +{challenge.xpReward} XP
              </span>
            </div>

            {challenge.completed && (
              <motion.span
                className="text-xs text-green-500 font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Completo!
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Efeito de completo */}
      {challenge.completed && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
          }}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  )
}
