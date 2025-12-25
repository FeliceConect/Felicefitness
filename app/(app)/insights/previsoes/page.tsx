'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PredictionCard, SkiReadinessCard } from '@/components/insights/prediction-card'
import { usePredictions } from '@/hooks/use-predictions'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'

export default function PredictionsPage() {
  const router = useRouter()
  const {
    weightPrediction,
    musclePrediction,
    prPredictions,
    skiReadiness,
    refreshPredictions,
    loading,
  } = usePredictions()

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Previsões</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshPredictions}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
            {/* Preparação para Esqui */}
            {skiReadiness && (
              <div>
                <h2 className="text-sm font-semibold mb-3">Objetivo Especial</h2>
                <SkiReadinessCard
                  percentage={skiReadiness.percentage}
                  daysRemaining={skiReadiness.daysRemaining}
                  components={skiReadiness.components}
                  recommendations={skiReadiness.recommendations}
                />
              </div>
            )}

            {/* Previsão de Peso */}
            {weightPrediction && (
              <div>
                <h2 className="text-sm font-semibold mb-3">Composição Corporal</h2>
                <div className="space-y-3">
                  <PredictionCard
                    title="Meta de Peso"
                    icon="⚖️"
                    current={weightPrediction.currentWeight}
                    target={weightPrediction.targetWeight}
                    unit="kg"
                    predictedDate={new Date(weightPrediction.predictedDate)}
                    confidence={weightPrediction.confidence}
                    trend={
                      weightPrediction.weeklyChange > 0
                        ? 'up'
                        : weightPrediction.weeklyChange < 0
                          ? 'down'
                          : 'stable'
                    }
                    description={`Mudança média de ${Math.abs(weightPrediction.weeklyChange).toFixed(2)}kg por semana`}
                  />

                  {musclePrediction && (
                    <PredictionCard
                      title="Massa Muscular"
                      icon="💪"
                      current={musclePrediction.currentMuscle}
                      target={musclePrediction.targetMuscle}
                      unit="kg"
                      predictedDate={new Date(musclePrediction.predictedDate)}
                      confidence={musclePrediction.confidence}
                      trend={
                        musclePrediction.monthlyGain > 0
                          ? 'up'
                          : musclePrediction.monthlyGain < 0
                            ? 'down'
                            : 'stable'
                      }
                      description={`Ganho estimado de ${musclePrediction.monthlyGain.toFixed(2)}kg por mês`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Previsões de PR */}
            {prPredictions.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-3">Próximos PRs</h2>
                <div className="space-y-3">
                  {prPredictions.map((pr, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🏆</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{pr.exercise}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Atual: {pr.currentWeight}kg → Previsto: {pr.predictedWeight}kg
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Estimativa: próximas 2-3 semanas
                            </p>
                          </div>
                          {pr.likely && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                              Provável
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Estado vazio */}
            {!weightPrediction && !skiReadiness && prPredictions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-2">🔮</div>
                  <p className="text-muted-foreground">
                    Continue registrando seus dados para gerar previsões
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Precisamos de pelo menos 2 semanas de dados
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Explicação */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <span>ℹ️</span>
                  Como funcionam as previsões?
                </h4>
                <p className="text-xs text-muted-foreground">
                  Nossas previsões são baseadas nos seus dados históricos e padrões
                  identificados. Quanto mais dados você registrar, mais precisas
                  serão as previsões. O nível de confiança indica a certeza da
                  estimativa.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
