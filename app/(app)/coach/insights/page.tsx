'use client'

import { useState } from 'react'
import { ChevronLeft, Lightbulb, TrendingUp, Target, Zap, Dumbbell, Apple, Moon, Droplets, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCoachSuggestions } from '@/hooks/use-coach-suggestions'
import { CoachDailyBriefing, CoachInsightCard } from '@/components/coach'
import type { CoachSuggestion } from '@/types/coach'

const categoryIcons: Record<string, React.ReactNode> = {
  workout: <Dumbbell className="h-4 w-4" />,
  nutrition: <Apple className="h-4 w-4" />,
  recovery: <Moon className="h-4 w-4" />,
  hydration: <Droplets className="h-4 w-4" />,
  general: <Lightbulb className="h-4 w-4" />,
}

// Priority colors for potential future use
// const priorityColors: Record<string, string> = {
//   high: 'bg-red-500/10 text-red-600 border-red-500/20',
//   medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
//   low: 'bg-green-500/10 text-green-600 border-green-500/20',
// }

export default function CoachInsightsPage() {
  const {
    contextualSuggestions,
    dailyBriefing,
    isLoading,
    refreshSuggestions,
  } = useCoachSuggestions()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshSuggestions()
    setIsRefreshing(false)
  }

  const groupedSuggestions = contextualSuggestions.reduce<Record<string, CoachSuggestion[]>>(
    (acc, suggestion) => {
      const category = suggestion.category || 'general'
      if (!acc[category]) acc[category] = []
      acc[category].push(suggestion)
      return acc
    },
    {}
  )

  const categoryLabels: Record<string, string> = {
    workout: 'Treino',
    nutrition: 'Nutrição',
    recovery: 'Recuperação',
    hydration: 'Hidratação',
    general: 'Geral',
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Link href="/coach">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">Insights</h1>
            <p className="text-xs text-muted-foreground">Sugestões personalizadas</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Daily Briefing */}
        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : dailyBriefing ? (
          <CoachDailyBriefing briefing={dailyBriefing} />
        ) : null}

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-semibold">
                {contextualSuggestions.filter((s) => s.priority === 'high').length}
              </p>
              <p className="text-[10px] text-muted-foreground">Prioridade Alta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Target className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-semibold">{contextualSuggestions.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Insights</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-semibold">{Object.keys(groupedSuggestions).length}</p>
              <p className="text-[10px] text-muted-foreground">Categorias</p>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions by category */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-24 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedSuggestions).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-muted-foreground">Nenhum insight disponível</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Continue usando o app para receber sugestões personalizadas
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSuggestions).map(([category, suggestions]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {categoryIcons[category] || categoryIcons.general}
                </div>
                <h2 className="font-medium">{categoryLabels[category] || category}</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {suggestions.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {suggestions
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 }
                    return (
                      (priorityOrder[a.priority || 'low'] || 2) -
                      (priorityOrder[b.priority || 'low'] || 2)
                    )
                  })
                  .map((suggestion) => (
                    <CoachInsightCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onAskCoach={(question) => {
                        // Navigate to coach with question
                        window.location.href = `/coach?question=${encodeURIComponent(question)}`
                      }}
                    />
                  ))}
              </div>
            </div>
          ))
        )}

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/coach">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Perguntar ao Coach</p>
                  <p className="text-[10px] text-muted-foreground">Tire suas dúvidas</p>
                </div>
              </Button>
            </Link>
            <Link href="/treino">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Iniciar Treino</p>
                  <p className="text-[10px] text-muted-foreground">Treino de hoje</p>
                </div>
              </Button>
            </Link>
            <Link href="/nutricao">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Apple className="h-4 w-4 text-green-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Registrar Refeição</p>
                  <p className="text-[10px] text-muted-foreground">Adicionar refeição</p>
                </div>
              </Button>
            </Link>
            <Link href="/recuperacao">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Moon className="h-4 w-4 text-purple-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Ver Recuperação</p>
                  <p className="text-[10px] text-muted-foreground">Sono e estresse</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
