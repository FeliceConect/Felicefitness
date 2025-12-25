import type {
  WeightPrediction,
  MusclePrediction,
  PRPrediction,
  SkiReadiness,
  UserAnalysisData,
} from '@/types/insights'
import { average, calculateTrend } from './patterns'

/**
 * Projeta peso futuro baseado no histórico
 */
export function projectWeight(data: UserAnalysisData): WeightPrediction | null {
  const weightHistory = data.weightHistory
  const targetWeight = data.goals.weightTarget

  if (!weightHistory || weightHistory.length < 4 || !targetWeight) {
    return null
  }

  // Calcular taxa média de mudança semanal
  const recentWeights = weightHistory.slice(-8).map((w) => w.value)
  const oldestWeight = recentWeights[0]
  const latestWeight = recentWeights[recentWeights.length - 1]
  const weeksElapsed = recentWeights.length / 7 || 1

  const weeklyChange = (latestWeight - oldestWeight) / weeksElapsed

  // Se não está mudando, não há previsão
  if (Math.abs(weeklyChange) < 0.05) {
    return {
      currentWeight: latestWeight,
      targetWeight,
      predictedDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      daysToTarget: 365,
      weeklyChange: 0,
      confidence: 0.2,
    }
  }

  // Calcular dias até o objetivo
  const weightDiff = targetWeight - latestWeight
  const weeksToTarget = weightDiff / weeklyChange
  const daysToTarget = Math.round(Math.abs(weeksToTarget * 7))

  // Verificar se está indo na direção certa
  const isCorrectDirection =
    (weightDiff > 0 && weeklyChange > 0) || (weightDiff < 0 && weeklyChange < 0)

  if (!isCorrectDirection) {
    return {
      currentWeight: latestWeight,
      targetWeight,
      predictedDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      daysToTarget: 365,
      weeklyChange,
      confidence: 0.1,
    }
  }

  // Calcular confiança baseada na consistência
  const trend = calculateTrend(recentWeights)
  const confidence = trend.confidence * 0.8

  const predictedDate = new Date()
  predictedDate.setDate(predictedDate.getDate() + daysToTarget)

  return {
    currentWeight: latestWeight,
    targetWeight,
    predictedDate,
    daysToTarget,
    weeklyChange,
    confidence,
  }
}

/**
 * Projeta ganho de massa muscular
 */
export function projectMuscle(data: UserAnalysisData): MusclePrediction | null {
  const bodyComps = data.bodyComps

  if (!bodyComps || bodyComps.length < 3) {
    return null
  }

  // Ordenar por data
  const sorted = [...bodyComps].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const muscleValues = sorted.map((b) => b.musculo)
  const trend = calculateTrend(muscleValues)

  const latestMuscle = muscleValues[muscleValues.length - 1]
  const firstMuscle = muscleValues[0]

  // Calcular ganho mensal médio
  const firstDate = new Date(sorted[0].date)
  const lastDate = new Date(sorted[sorted.length - 1].date)
  const monthsElapsed = (lastDate.getTime() - firstDate.getTime()) / (30 * 24 * 60 * 60 * 1000)

  const monthlyGain = monthsElapsed > 0 ? (latestMuscle - firstMuscle) / monthsElapsed : 0

  // Estimar objetivo (2kg acima do atual ou mantendo ritmo)
  const targetMuscle = latestMuscle + 2

  const monthsToTarget = monthlyGain > 0 ? 2 / monthlyGain : 12
  const predictedDate = new Date()
  predictedDate.setMonth(predictedDate.getMonth() + Math.ceil(monthsToTarget))

  return {
    currentMuscle: latestMuscle,
    targetMuscle,
    predictedDate,
    monthlyGain,
    confidence: trend.confidence,
  }
}

/**
 * Prevê próximos PRs baseado na progressão
 */
export function predictNextPRs(
  workouts: Array<{
    exercises?: Array<{
      name: string
      sets: Array<{ weight: number; reps: number }>
    }>
  }>
): PRPrediction[] {
  const predictions: PRPrediction[] = []

  // Agrupar exercícios por nome
  const exerciseProgress: Record<string, number[]> = {}

  workouts.forEach((workout) => {
    if (!workout.exercises) return

    workout.exercises.forEach((exercise) => {
      if (!exercise.sets || exercise.sets.length === 0) return

      const maxWeight = Math.max(...exercise.sets.map((s) => s.weight))
      if (!exerciseProgress[exercise.name]) {
        exerciseProgress[exercise.name] = []
      }
      exerciseProgress[exercise.name].push(maxWeight)
    })
  })

  // Analisar tendência de cada exercício
  Object.entries(exerciseProgress).forEach(([name, weights]) => {
    if (weights.length < 4) return

    const trend = calculateTrend(weights)
    const currentMax = Math.max(...weights)

    if (trend.direction === 'up' && trend.percentage > 3) {
      const avgIncrease = (weights[weights.length - 1] - weights[0]) / weights.length
      const predictedWeight = Math.round(currentMax + avgIncrease * 2)

      const predictedDate = new Date()
      predictedDate.setDate(predictedDate.getDate() + 14)

      predictions.push({
        exercise: name,
        currentWeight: currentMax,
        predictedWeight,
        predictedDate,
        likely: trend.confidence > 0.5,
      })
    }
  })

  return predictions.slice(0, 3) // Limitar a 3 previsões
}

/**
 * Calcula a preparação para viagem de esqui
 */
export function calculateSkiReadiness(data: UserAnalysisData): SkiReadiness | null {
  const skiGoal = data.goals.skiTrip

  if (!skiGoal) {
    return null
  }

  const targetDate = new Date(skiGoal.date)
  const now = new Date()
  const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Calcular componentes
  const legStrength = calculateLegStrengthScore(data)
  const core = calculateCoreScore(data)
  const endurance = calculateEnduranceScore(data)
  const bodyComposition = calculateBodyCompositionScore(data)

  // Média ponderada
  const percentage = Math.round(
    legStrength * 0.35 + core * 0.2 + endurance * 0.25 + bodyComposition * 0.2
  )

  // Gerar recomendações
  const recommendations: string[] = []

  if (core < 70) {
    recommendations.push('Adicione exercícios de core 3x por semana')
  }
  if (legStrength < 80) {
    recommendations.push('Aumente volume de treino de pernas')
  }
  if (endurance < 75) {
    recommendations.push('Inclua HIIT 2x por semana para resistência')
  }
  if (bodyComposition < 75) {
    recommendations.push('Mantenha déficit moderado para composição ideal')
  }

  return {
    percentage,
    daysRemaining,
    components: {
      legStrength,
      core,
      endurance,
      bodyComposition,
    },
    recommendations,
  }
}

/**
 * Calcula score de força de pernas
 */
function calculateLegStrengthScore(data: UserAnalysisData): number {
  // Baseado no volume de treino de pernas e PRs
  let score = 50 // Base

  const workouts = data.workouts || []

  // Verificar frequência de treino de pernas
  const legWorkouts = workouts.filter((w) =>
    w.name?.toLowerCase().includes('leg') || w.name?.toLowerCase().includes('perna')
  )

  const weeklyLegFrequency = legWorkouts.length / Math.max(1, workouts.length / 7)
  score += weeklyLegFrequency * 20

  // Verificar progressão
  const volumes = data.weeklyVolumes || []
  if (volumes.length > 0) {
    const trend = calculateTrend(volumes)
    if (trend.direction === 'up') {
      score += 15
    }
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Calcula score de core
 */
function calculateCoreScore(data: UserAnalysisData): number {
  let score = 40 // Base

  // Verificar exercícios de core nos treinos
  const workouts = data.workouts || []
  const coreKeywords = ['core', 'abs', 'abdominal', 'prancha', 'plank']

  const hasCoreWork = workouts.some((w) =>
    coreKeywords.some((kw) => w.name?.toLowerCase().includes(kw))
  )

  if (hasCoreWork) {
    score += 30
  }

  // Verificar postura/wellness
  const wellnessCheckins = data.wellnessCheckins || []
  if (wellnessCheckins.length > 0) {
    const avgEnergy = average(wellnessCheckins.map((w) => w.energy))
    score += avgEnergy * 6 // Max 30 points
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Calcula score de resistência
 */
function calculateEnduranceScore(data: UserAnalysisData): number {
  let score = 40 // Base

  // Baseado em duração dos treinos
  const workouts = data.workouts || []
  if (workouts.length > 0) {
    const avgDuration = average(workouts.map((w) => w.duration))
    score += Math.min(30, avgDuration / 2)
  }

  // Baseado em consistência
  if (data.gamification) {
    const streak = data.gamification.streak
    score += Math.min(20, streak)
  }

  // Baseado em sono (recuperação)
  const sleepQuality = data.sleepQuality || []
  if (sleepQuality.length > 0) {
    const avgSleep = average(sleepQuality)
    score += avgSleep * 0.1 // Max ~10 points
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Calcula score de composição corporal
 */
function calculateBodyCompositionScore(data: UserAnalysisData): number {
  let score = 50 // Base

  const bodyComps = data.bodyComps || []
  if (bodyComps.length === 0) return score

  const latest = bodyComps[0]

  // Baseado em % gordura (ideal: 12-18% para homens)
  if (latest.gordura <= 15) {
    score += 30
  } else if (latest.gordura <= 20) {
    score += 20
  } else if (latest.gordura <= 25) {
    score += 10
  }

  // Verificar tendência
  if (bodyComps.length >= 2) {
    const previous = bodyComps[1]
    if (latest.gordura < previous.gordura) {
      score += 10 // Está diminuindo
    }
    if (latest.musculo > previous.musculo) {
      score += 10 // Músculo aumentando
    }
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Calcula risco de overtraining
 */
export function calculateOvertrainingRisk(data: UserAnalysisData): number {
  let risk = 0

  // Volume alto
  const volumes = data.weeklyVolumes || []
  if (volumes.length > 0) {
    const avgVolume = average(volumes.slice(-4))
    const recentVolume = volumes[volumes.length - 1] || 0
    if (recentVolume > avgVolume * 1.3) {
      risk += 0.3
    }
  }

  // Sono baixo
  const sleepDurations = data.sleepDurations || []
  if (sleepDurations.length > 0) {
    const avgSleep = average(sleepDurations.slice(-7))
    if (avgSleep < 6) {
      risk += 0.3
    } else if (avgSleep < 7) {
      risk += 0.15
    }
  }

  // Stress alto
  const wellnessCheckins = data.wellnessCheckins || []
  if (wellnessCheckins.length > 0) {
    const recentStress = wellnessCheckins.slice(-7).map((w) => w.stress)
    const avgStress = average(recentStress)
    if (avgStress > 4) {
      risk += 0.25
    } else if (avgStress > 3) {
      risk += 0.1
    }
  }

  // Energia baixa
  if (wellnessCheckins.length > 0) {
    const recentEnergy = wellnessCheckins.slice(-7).map((w) => w.energy)
    const avgEnergy = average(recentEnergy)
    if (avgEnergy < 2.5) {
      risk += 0.2
    }
  }

  return Math.min(1, risk)
}
