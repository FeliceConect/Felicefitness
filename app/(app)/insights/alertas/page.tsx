'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AlertCard } from '@/components/insights/alert-card'
import { useAlerts } from '@/hooks/use-alerts'
import { ArrowLeft, Settings, Loader2 } from 'lucide-react'

export default function AlertsPage() {
  const router = useRouter()
  const {
    alerts,
    criticalCount,
    highCount,
    byPriority,
    resolveAlert,
    snoozeAlert,
    settings,
    updateSettings,
    loading,
  } = useAlerts()

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
              <h1 className="text-lg font-bold">Alertas</h1>
              {(criticalCount > 0 || highCount > 0) && (
                <p className="text-xs text-muted-foreground">
                  {criticalCount > 0 && `${criticalCount} crítico${criticalCount > 1 ? 's' : ''}`}
                  {criticalCount > 0 && highCount > 0 && ' • '}
                  {highCount > 0 && `${highCount} alto${highCount > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <>
            {/* Alertas Críticos */}
            {byPriority.critical.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Críticos ({byPriority.critical.length})
                </h2>
                {byPriority.critical.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                    onSnooze={snoozeAlert}
                  />
                ))}
              </div>
            )}

            {/* Alertas de Alta Prioridade */}
            {byPriority.high.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Alta Prioridade ({byPriority.high.length})
                </h2>
                {byPriority.high.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                    onSnooze={snoozeAlert}
                  />
                ))}
              </div>
            )}

            {/* Alertas de Média Prioridade */}
            {byPriority.medium.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  Média Prioridade ({byPriority.medium.length})
                </h2>
                {byPriority.medium.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                    onSnooze={snoozeAlert}
                  />
                ))}
              </div>
            )}

            {/* Alertas de Baixa Prioridade */}
            {byPriority.low.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Baixa Prioridade ({byPriority.low.length})
                </h2>
                {byPriority.low.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                    onSnooze={snoozeAlert}
                  />
                ))}
              </div>
            )}

            {/* Estado vazio */}
            {alerts.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">
                    Nenhum alerta ativo no momento
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Você está em dia com tudo!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Configurações de Alertas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notificar alertas críticos</p>
                    <p className="text-xs text-muted-foreground">
                      Receber notificação push imediatamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyCritical}
                    onCheckedChange={(checked) =>
                      updateSettings({ notifyCritical: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notificar alertas altos</p>
                    <p className="text-xs text-muted-foreground">
                      Receber notificação push para alertas importantes
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyHigh}
                    onCheckedChange={(checked) =>
                      updateSettings({ notifyHigh: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Resumo diário</p>
                    <p className="text-xs text-muted-foreground">
                      Receber resumo de alertas pela manhã
                    </p>
                  </div>
                  <Switch
                    checked={settings.dailySummary}
                    onCheckedChange={(checked) =>
                      updateSettings({ dailySummary: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
