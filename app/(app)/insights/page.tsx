'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InsightsFeed } from '@/components/insights/insights-feed'
import { WeeklyDigest } from '@/components/insights/ai-report'
import { useInsights } from '@/hooks/use-insights'
import { useAIAnalysis } from '@/hooks/use-ai-analysis'
import {
  ArrowLeft,
  Bell,
  TrendingUp,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

export default function InsightsPage() {
  const router = useRouter()
  const {
    insights,
    criticalAlerts,
    unreadCount,
    dismissInsight,
    markAsRead,
    refreshInsights,
    generateNewInsights,
    loading,
    generating,
  } = useInsights()

  const { weeklyDigest, loadWeeklyDigest } = useAIAnalysis()

  useEffect(() => {
    loadWeeklyDigest()
  }, [loadWeeklyDigest])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Insights</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} novo{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <Link href="/insights/alertas">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {criticalAlerts.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/insights/analise">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Análise</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/insights/previsoes">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-3 text-center">
                <Sparkles className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Previsões</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/insights/alertas">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-3 text-center">
                <Bell className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Alertas</p>
                {criticalAlerts.length > 0 && (
                  <span className="text-xs text-red-500">
                    ({criticalAlerts.length})
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Weekly Digest */}
        {weeklyDigest && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resumo da Semana
              </h2>
              <Link href="/insights/analise">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  Ver completo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <WeeklyDigest report={weeklyDigest} compact />
          </div>
        )}

        {/* Feed de Insights */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Seus Insights</h2>
          <InsightsFeed
            insights={insights}
            onDismiss={dismissInsight}
            onMarkAsRead={markAsRead}
            onRefresh={refreshInsights}
            onGenerate={generateNewInsights}
            loading={loading}
            generating={generating}
          />
        </div>
      </main>
    </div>
  )
}
