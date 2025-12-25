'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CompletedWorkout {
  id: string
  workout_name: string
  duration_minutes: number
  exercises_count: number
  sets_count: number
  calories_burned: number
  completed_at: string
  prs_count: number
}

export default function CompartilharTreinoPage() {
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get completed workouts from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        workout_name,
        duration_minutes,
        exercises_count,
        sets_count,
        calories_burned,
        completed_at,
        prs_count
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false })
      .limit(20) as { data: CompletedWorkout[] | null }

    if (data) {
      setWorkouts(data)
    }
    setLoading(false)
  }

  const filteredWorkouts = workouts.filter(w =>
    w.workout_name.toLowerCase().includes(search.toLowerCase())
  )

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}min`
    }
    return `${mins}min`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Compartilhar Treino</h1>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar treino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Workouts List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum treino encontrado</p>
            <p className="text-sm mt-1">
              Complete um treino para poder compartilhar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/compartilhar/treino/${workout.id}`}
                className={cn(
                  'block p-4 rounded-xl border',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{workout.workout_name}</h3>
                  {workout.prs_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500 font-medium">
                      {workout.prs_count} PR{workout.prs_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatDuration(workout.duration_minutes)}</span>
                  <span>{workout.exercises_count} exercicios</span>
                  <span>{workout.calories_burned}kcal</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {format(parseISO(workout.completed_at), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
