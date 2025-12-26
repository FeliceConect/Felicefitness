'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEvolution } from '@/hooks/use-evolution'
import { PeriodSelector } from '@/components/reports/period-selector'
import { TrendIndicator } from '@/components/reports/trend-indicator'
import { LineChart } from '@/components/charts/line-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import {
  TrendingUp,
  ChevronLeft,
  Scale,
  Dumbbell,
  Target,
  Flame,
  Trophy,
  Activity,
  Droplets,
  Zap,
  Heart,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EvolucaoPage() {
  const {
    data,
    loading,
    period,
    setPeriod
  } = useEvolution()

  if (loading) {
    return (
      <div className="container max-w-6xl py-6 pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/relatorios">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-violet-500" />
              Evolução
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso ao longo do tempo
            </p>
          </div>
        </div>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {data && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Weight Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-blue-500" />
                  Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">
                      {data.weight.data.length > 0
                        ? `${data.weight.data[data.weight.data.length - 1].value}kg`
                        : '-'}
                    </p>
                    {data.weight.trend && (
                      <TrendIndicator
                        trend={data.weight.trend}
                        higherIsBetter={false}
                        showValue
                      />
                    )}
                  </div>
                  {data.weight.goal && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Meta</p>
                      <p className="font-semibold">{data.weight.goal}kg</p>
                      {data.weight.projectedGoalDate && (
                        <p className="text-xs text-muted-foreground">
                          Previsão: {data.weight.projectedGoalDate}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <AreaChart
                  data={data.weight.data}
                  color="#3b82f6"
                  height={120}
                  dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                  valueFormatter={(v) => `${v}kg`}
                />
              </CardContent>
            </Card>

            {/* Muscle Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-green-500" />
                  Massa Muscular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">
                      {data.muscle.data.length > 0
                        ? `${data.muscle.data[data.muscle.data.length - 1].value}kg`
                        : '-'}
                    </p>
                    {data.muscle.trend && (
                      <TrendIndicator trend={data.muscle.trend} showValue />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Ganho total</p>
                    <p className="font-semibold text-green-500">
                      +{data.muscle.totalGain}kg
                    </p>
                  </div>
                </div>
                <AreaChart
                  data={data.muscle.data}
                  color="#22c55e"
                  height={120}
                  dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                  valueFormatter={(v) => `${v}kg`}
                />
              </CardContent>
            </Card>

            {/* Fat Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Gordura Corporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">
                      {data.fat.data.length > 0
                        ? `${data.fat.data[data.fat.data.length - 1].value}%`
                        : '-'}
                    </p>
                    {data.fat.trend && (
                      <TrendIndicator
                        trend={data.fat.trend}
                        higherIsBetter={false}
                        showValue
                      />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Perda total</p>
                    <p className="font-semibold text-orange-500">
                      -{data.fat.totalLoss}%
                    </p>
                  </div>
                </div>
                <AreaChart
                  data={data.fat.data}
                  color="#f97316"
                  height={120}
                  dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                  valueFormatter={(v) => `${v}%`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="body" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="body">Composição Corporal</TabsTrigger>
              <TabsTrigger value="bioimpedance">Bioimpedância</TabsTrigger>
              <TabsTrigger value="strength">Força</TabsTrigger>
              <TabsTrigger value="consistency">Consistência</TabsTrigger>
            </TabsList>

            {/* Body Composition Tab */}
            <TabsContent value="body" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evolução do Peso</CardTitle>
                  <CardDescription>
                    Histórico completo de peso corporal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.weight.data.length > 0 ? (
                    <LineChart
                      data={data.weight.data}
                      color="#3b82f6"
                      height={300}
                      showGrid
                      goalValue={data.weight.goal || undefined}
                      goalLabel={data.weight.goal ? `Meta: ${data.weight.goal}kg` : undefined}
                      dateFormatter={(d) => format(new Date(d), 'dd/MM', { locale: ptBR })}
                      valueFormatter={(v) => `${v}kg`}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Scale className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma medição de peso registrada</p>
                        <p className="text-sm">Adicione medições para ver a evolução</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Massa Muscular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.muscle.data.length > 0 ? (
                      <LineChart
                        data={data.muscle.data}
                        color="#22c55e"
                        height={200}
                        showGrid
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}kg`}
                      />
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Sem dados de massa muscular
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gordura Corporal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.fat.data.length > 0 ? (
                      <LineChart
                        data={data.fat.data}
                        color="#f97316"
                        height={200}
                        showGrid
                        goalValue={data.fat.goal || undefined}
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}%`}
                      />
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Sem dados de gordura corporal
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bioimpedance Tab */}
            <TabsContent value="bioimpedance" className="space-y-4">
              {/* Latest Measurement Summary */}
              {data.bioimpedance?.latestMeasurement && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4 text-violet-500" />
                      Última Medição InBody
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(data.bioimpedance.latestMeasurement.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {data.bioimpedance.latestMeasurement.pontuacao_inbody && (
                        <div className="p-4 bg-violet-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-violet-500">
                            {data.bioimpedance.latestMeasurement.pontuacao_inbody}
                          </p>
                          <p className="text-xs text-muted-foreground">Pontuação InBody</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.peso && (
                        <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-blue-500">
                            {data.bioimpedance.latestMeasurement.peso}
                          </p>
                          <p className="text-xs text-muted-foreground">Peso (kg)</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.percentual_gordura && (
                        <div className="p-4 bg-orange-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-orange-500">
                            {data.bioimpedance.latestMeasurement.percentual_gordura}%
                          </p>
                          <p className="text-xs text-muted-foreground">Gordura Corporal</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.massa_muscular_esqueletica_kg && (
                        <div className="p-4 bg-green-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-green-500">
                            {data.bioimpedance.latestMeasurement.massa_muscular_esqueletica_kg}
                          </p>
                          <p className="text-xs text-muted-foreground">Músculo (kg)</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      {data.bioimpedance.latestMeasurement.imc && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xl font-bold">{data.bioimpedance.latestMeasurement.imc.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">IMC</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.gordura_visceral && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xl font-bold">{data.bioimpedance.latestMeasurement.gordura_visceral}</p>
                          <p className="text-xs text-muted-foreground">Gordura Visceral</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.taxa_metabolica_basal && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xl font-bold">{data.bioimpedance.latestMeasurement.taxa_metabolica_basal}</p>
                          <p className="text-xs text-muted-foreground">TMB (kcal)</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.agua_corporal_l && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xl font-bold">{data.bioimpedance.latestMeasurement.agua_corporal_l}L</p>
                          <p className="text-xs text-muted-foreground">Água Corporal</p>
                        </div>
                      )}
                      {data.bioimpedance.latestMeasurement.massa_livre_gordura_kg && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xl font-bold">{data.bioimpedance.latestMeasurement.massa_livre_gordura_kg}kg</p>
                          <p className="text-xs text-muted-foreground">Massa Magra</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Charts Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* InBody Score Evolution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4 text-violet-500" />
                      Pontuação InBody
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bioimpedance?.inbodyScore && data.bioimpedance.inbodyScore.length > 0 ? (
                      <LineChart
                        data={data.bioimpedance.inbodyScore}
                        color="#8b5cf6"
                        height={180}
                        showGrid
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}pts`}
                      />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        Sem dados de pontuação InBody
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* IMC Evolution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-500" />
                      IMC
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bioimpedance?.imc && data.bioimpedance.imc.length > 0 ? (
                      <LineChart
                        data={data.bioimpedance.imc}
                        color="#06b6d4"
                        height={180}
                        showGrid
                        goalValue={25}
                        goalLabel="Limite sobrepeso"
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => v.toFixed(1)}
                      />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        Sem dados de IMC
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Visceral Fat Evolution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Gordura Visceral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bioimpedance?.visceralFat && data.bioimpedance.visceralFat.length > 0 ? (
                      <LineChart
                        data={data.bioimpedance.visceralFat}
                        color="#ef4444"
                        height={180}
                        showGrid
                        goalValue={10}
                        goalLabel="Limite saudável"
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}`}
                      />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        Sem dados de gordura visceral
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* BMR Evolution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Taxa Metabólica Basal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bioimpedance?.bmr && data.bioimpedance.bmr.length > 0 ? (
                      <LineChart
                        data={data.bioimpedance.bmr}
                        color="#f59e0b"
                        height={180}
                        showGrid
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}kcal`}
                      />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        Sem dados de taxa metabólica
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Body Water Evolution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Água Corporal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bioimpedance?.bodyWater && data.bioimpedance.bodyWater.length > 0 ? (
                      <LineChart
                        data={data.bioimpedance.bodyWater}
                        color="#3b82f6"
                        height={180}
                        showGrid
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}L`}
                      />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        Sem dados de água corporal
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lean Mass Evolution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-green-500" />
                      Massa Livre de Gordura
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bioimpedance?.leanMass && data.bioimpedance.leanMass.length > 0 ? (
                      <LineChart
                        data={data.bioimpedance.leanMass}
                        color="#22c55e"
                        height={180}
                        showGrid
                        dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                        valueFormatter={(v) => `${v}kg`}
                      />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        Sem dados de massa magra
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* No data state */}
              {(!data.bioimpedance?.latestMeasurement &&
                (!data.bioimpedance?.inbodyScore || data.bioimpedance.inbodyScore.length === 0)) && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma medição de bioimpedância registrada</p>
                      <p className="text-sm">Adicione medições InBody para ver a evolução completa</p>
                      <Link href="/corpo/nova-medicao">
                        <Button className="mt-4" variant="outline">
                          <Scale className="h-4 w-4 mr-2" />
                          Nova Medição
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Strength Tab */}
            <TabsContent value="strength" className="space-y-4">
              {data.strength.exercises.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.strength.exercises.map((exercise) => (
                    <Card key={exercise.name}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{exercise.name}</CardTitle>
                          <Badge variant="secondary" className="gap-1">
                            <Trophy className="h-3 w-3" />
                            {exercise.prs} PRs
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold">
                              {exercise.data.length > 0
                                ? `${exercise.data[exercise.data.length - 1].value}kg`
                                : '-'}
                            </p>
                            <TrendIndicator trend={exercise.trend} />
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Início: {exercise.data[0]?.value || 0}kg</p>
                            <p>Atual: {exercise.data[exercise.data.length - 1]?.value || 0}kg</p>
                          </div>
                        </div>
                        <LineChart
                          data={exercise.data}
                          color="#8b5cf6"
                          height={150}
                          dateFormatter={(d) => format(new Date(d), 'dd/MM')}
                          valueFormatter={(v) => `${v}kg`}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum PR registrado no período</p>
                      <p className="text-sm">Continue treinando para bater recordes!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Consistency Tab */}
            <TabsContent value="consistency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pontuação Diária</CardTitle>
                  <CardDescription>
                    Evolução da sua consistência ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.consistency.data.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-3xl font-bold">{data.consistency.avgScore}pts</p>
                          <p className="text-sm text-muted-foreground">Média do período</p>
                        </div>
                        {data.consistency.trend && (
                          <TrendIndicator trend={data.consistency.trend} size="lg" />
                        )}
                      </div>
                      <AreaChart
                        data={data.consistency.data}
                        color="#8b5cf6"
                        height={300}
                        showGrid
                        dateFormatter={(d) => format(new Date(d), 'dd/MM', { locale: ptBR })}
                        valueFormatter={(v) => `${v}pts`}
                      />
                    </>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma pontuação registrada</p>
                        <p className="text-sm">Complete atividades para ver sua evolução</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score distribution */}
              {data.consistency.data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição de Pontuação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={[
                        {
                          label: '90-100',
                          value: data.consistency.data.filter(d => d.value >= 90).length,
                          color: '#22c55e'
                        },
                        {
                          label: '70-89',
                          value: data.consistency.data.filter(d => d.value >= 70 && d.value < 90).length,
                          color: '#84cc16'
                        },
                        {
                          label: '50-69',
                          value: data.consistency.data.filter(d => d.value >= 50 && d.value < 70).length,
                          color: '#eab308'
                        },
                        {
                          label: '0-49',
                          value: data.consistency.data.filter(d => d.value < 50).length,
                          color: '#ef4444'
                        }
                      ]}
                      height={200}
                      valueFormatter={(v) => `${v} dias`}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
