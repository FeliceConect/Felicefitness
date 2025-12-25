import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllUserData } from '@/lib/insights/analyzer'
import {
  projectWeight,
  projectMuscle,
  predictNextPRs,
  calculateSkiReadiness,
} from '@/lib/insights/predictions'

export async function GET(request: NextRequest) {
  void request // Required by Next.js route handler
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar dados do usuário
    const userData = await fetchAllUserData(user.id)

    // Gerar previsões
    const weightPrediction = projectWeight(userData)
    const musclePrediction = projectMuscle(userData)
    const prPredictions = predictNextPRs(
      userData.workouts as unknown as Array<{
        exercises?: Array<{
          name: string
          sets: Array<{ weight: number; reps: number }>
        }>
      }>
    )
    const skiReadiness = calculateSkiReadiness(userData)

    return NextResponse.json({
      weight: weightPrediction
        ? {
            ...weightPrediction,
            predictedDate: weightPrediction.predictedDate.toISOString(),
          }
        : null,
      muscle: musclePrediction
        ? {
            ...musclePrediction,
            predictedDate: musclePrediction.predictedDate.toISOString(),
          }
        : null,
      prs: prPredictions.map((pr) => ({
        ...pr,
        predictedDate: pr.predictedDate.toISOString(),
      })),
      skiReadiness,
    })
  } catch (error) {
    console.error('Error generating predictions:', error)
    return NextResponse.json({ error: 'Erro ao gerar previsões' }, { status: 500 })
  }
}
