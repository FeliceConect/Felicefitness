'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, ChevronRight, Activity, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecovery } from '@/hooks/use-recovery'
import {
  RecoveryScoreDisplay,
  TrainingRecommendation,
  RecoveryHistory,
} from '@/components/recovery'
import Link from 'next/link'

export default function RecuperacaoPage() {
  const router = useRouter()
  const {
    todayScore,
    todayCheckin,
    components,
    recommendation,
    history,
    weeklyAverage,
    loading,
  } = useRecovery()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recuperação
            </h1>
          </div>
          <Link href="/recuperacao/checkin">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Check-in
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">{greeting}! ☀️</p>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>

        {/* Today's Score */}
        {todayScore !== null && components ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Score de Recuperação</CardTitle>
            </CardHeader>
            <CardContent>
              <RecoveryScoreDisplay
                score={todayScore}
                components={components}
                size="lg"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-2">Check-in não realizado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Faça seu check-in matinal para ver seu score de recuperação
              </p>
              <Link href="/recuperacao/checkin">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Check-in
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Training Recommendation */}
        {recommendation && (
          <TrainingRecommendation recommendation={recommendation} />
        )}

        {/* Weekly Average */}
        {weeklyAverage > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média da semana</p>
                  <p className="text-2xl font-bold">{weeklyAverage}/100</p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  weeklyAverage >= 80 ? 'bg-green-500/20' :
                  weeklyAverage >= 60 ? 'bg-yellow-500/20' :
                  weeklyAverage >= 40 ? 'bg-orange-500/20' : 'bg-red-500/20'
                }`}>
                  <span className="text-2xl">
                    {weeklyAverage >= 80 ? '🟢' :
                     weeklyAverage >= 60 ? '🟡' :
                     weeklyAverage >= 40 ? '🟠' : '🔴'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Chart */}
        {history.length > 0 && (
          <RecoveryHistory history={history} />
        )}

        {/* Quick Links */}
        <div className="space-y-2">
          <Link href="/sono">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl">😴</span>
                  </div>
                  <div>
                    <p className="font-medium">Sono</p>
                    <p className="text-sm text-muted-foreground">
                      Gerenciar registros de sono
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Check-in Button */}
        {!todayCheckin && (
          <Link href="/recuperacao/checkin">
            <Button className="w-full" size="lg">
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Fazer Check-in Matinal
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
