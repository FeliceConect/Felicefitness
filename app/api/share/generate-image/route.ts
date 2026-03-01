import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This API route provides server-side image generation metadata
// The actual image generation happens client-side using html-to-image

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, contentId } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Missing type parameter' },
        { status: 400 }
      )
    }

    // Fetch data based on type
    let data: Record<string, unknown> | null = null

    switch (type) {
      case 'workout': {
        if (!contentId) {
          return NextResponse.json(
            { error: 'Missing contentId for workout' },
            { status: 400 }
          )
        }

        const { data: workout } = await supabase
          .from('fitness_workouts')
          .select('*')
          .eq('id', contentId)
          .eq('user_id', user.id)
          .single() as { data: {
            nome: string
            duracao_minutos: number
            exercises_count: number
            sets_count: number
            calorias_estimadas: number
            data: string
            prs_count: number
          } | null }

        if (workout) {
          const hrs = Math.floor(workout.duracao_minutos / 60)
          const mins = workout.duracao_minutos % 60
          const duration = hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`

          data = {
            workoutName: workout.nome,
            duration,
            exercises: workout.exercises_count,
            sets: workout.sets_count,
            calories: workout.calorias_estimadas,
            date: workout.data,
            prs: workout.prs_count || 0,
            userName: user.user_metadata?.name || 'Atleta',
          }
        }
        break
      }

      case 'achievement': {
        if (!contentId) {
          return NextResponse.json(
            { error: 'Missing contentId for achievement' },
            { status: 400 }
          )
        }

        const { data: userAchievement } = await supabase
          .from('user_achievements')
          .select(`
            id,
            unlocked_at,
            achievement:achievements(name, description, icon, rarity)
          `)
          .eq('id', contentId)
          .eq('user_id', user.id)
          .single() as { data: {
            id: string
            unlocked_at: string
            achievement: {
              name: string
              description: string
              icon: string
              rarity: string
            }
          } | null }

        if (userAchievement) {
          data = {
            name: userAchievement.achievement.name,
            description: userAchievement.achievement.description,
            icon: userAchievement.achievement.icon,
            rarity: userAchievement.achievement.rarity,
            date: userAchievement.unlocked_at,
            userName: user.user_metadata?.name || 'Atleta',
          }
        }
        break
      }

      case 'streak': {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('current_streak, best_streak')
          .eq('user_id', user.id)
          .single() as { data: { current_streak: number; best_streak: number } | null }

        if (stats) {
          const days = stats.current_streak || 0
          let message = 'Comecando a jornada!'

          if (days >= 30) {
            message = 'Imparavel! Um mes de dedicacao!'
          } else if (days >= 14) {
            message = 'Duas semanas de consistencia!'
          } else if (days >= 7) {
            message = 'Uma semana de foco total!'
          } else if (days >= 3) {
            message = 'Mantendo o ritmo!'
          } else if (days > 0) {
            message = 'Cada dia conta!'
          }

          data = {
            days,
            message,
            record: stats.best_streak || 0,
            userName: user.user_metadata?.name || 'Atleta',
          }
        }
        break
      }

      case 'pr': {
        if (!contentId) {
          return NextResponse.json(
            { error: 'Missing contentId for PR' },
            { status: 400 }
          )
        }

        const { data: pr } = await supabase
          .from('personal_records')
          .select('*')
          .eq('id', contentId)
          .eq('user_id', user.id)
          .single() as { data: {
            exercise_name: string
            weight: number
            previous_weight: number
            achieved_at: string
          } | null }

        if (pr) {
          data = {
            exercise: pr.exercise_name,
            weight: pr.weight,
            previousWeight: pr.previous_weight,
            improvement: pr.weight - pr.previous_weight,
            date: pr.achieved_at,
            userName: user.user_metadata?.name || 'Atleta',
          }
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in generate-image API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
