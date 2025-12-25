'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Info } from 'lucide-react'
import type { Goals, Recommendations, GoalProgress } from '@/types/settings'
import { waterPresets, sleepPresets, defaultGoals } from '@/lib/settings/defaults'
import { cn } from '@/lib/utils'

interface GoalsFormProps {
  initialValues: Goals | null | undefined
  recommendations: Recommendations
  progress?: GoalProgress
  onSubmit: (goals: Goals) => Promise<void>
  errors?: Record<string, string>
}

export function GoalsForm({
  initialValues,
  recommendations,
  progress,
  onSubmit,
  errors = {}
}: GoalsFormProps) {
  // Merge with defaults to ensure all fields exist
  const mergedValues: Goals = {
    ...defaultGoals,
    ...initialValues
  }
  const [values, setValues] = useState<Goals>(mergedValues)
  const [loading, setLoading] = useState(false)

  const handleChange = (field: keyof Goals, value: number) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit(values)
    } finally {
      setLoading(false)
    }
  }

  // Calculate macro distribution
  const totalMacroCalories = (values.proteina * 4) + (values.carboidratos * 4) + (values.gordura * 9)
  const proteinPercent = Math.round((values.proteina * 4 / totalMacroCalories) * 100) || 0
  const carbPercent = Math.round((values.carboidratos * 4 / totalMacroCalories) * 100) || 0
  const fatPercent = Math.round((values.gordura * 9 / totalMacroCalories) * 100) || 0

  return (
    <div className="space-y-6">
      {/* Nutrição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nutrição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calorias */}
          <div className="space-y-2">
            <Label>Calorias diárias</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.calorias}
                onChange={(e) => handleChange('calorias', Number(e.target.value))}
                className={cn('flex-1', errors.calorias && 'border-destructive')}
              />
              <span className="text-muted-foreground">kcal</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Recomendado: {recommendations.calorias.min}-{recommendations.calorias.max} kcal
            </p>
            {errors.calorias && (
              <p className="text-xs text-destructive">{errors.calorias}</p>
            )}
          </div>

          {/* Proteína */}
          <div className="space-y-2">
            <Label>Proteína</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.proteina}
                onChange={(e) => handleChange('proteina', Number(e.target.value))}
                className={cn('flex-1', errors.proteina && 'border-destructive')}
              />
              <span className="text-muted-foreground">g</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Recomendado: {recommendations.proteina.min}-{recommendations.proteina.max}g (1.8-2.2g/kg)
            </p>
            {errors.proteina && (
              <p className="text-xs text-destructive">{errors.proteina}</p>
            )}
          </div>

          {/* Carboidratos */}
          <div className="space-y-2">
            <Label>Carboidratos</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.carboidratos}
                onChange={(e) => handleChange('carboidratos', Number(e.target.value))}
                className={cn('flex-1', errors.carboidratos && 'border-destructive')}
              />
              <span className="text-muted-foreground">g</span>
            </div>
            {errors.carboidratos && (
              <p className="text-xs text-destructive">{errors.carboidratos}</p>
            )}
          </div>

          {/* Gordura */}
          <div className="space-y-2">
            <Label>Gordura</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.gordura}
                onChange={(e) => handleChange('gordura', Number(e.target.value))}
                className={cn('flex-1', errors.gordura && 'border-destructive')}
              />
              <span className="text-muted-foreground">g</span>
            </div>
            {errors.gordura && (
              <p className="text-xs text-destructive">{errors.gordura}</p>
            )}
          </div>

          {/* Macro distribution */}
          <div className="space-y-2">
            <Label>Distribuição de macros</Label>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-blue-500"
                style={{ width: `${proteinPercent}%` }}
                title={`Proteína: ${proteinPercent}%`}
              />
              <div
                className="bg-amber-500"
                style={{ width: `${carbPercent}%` }}
                title={`Carboidratos: ${carbPercent}%`}
              />
              <div
                className="bg-red-500"
                style={{ width: `${fatPercent}%` }}
                title={`Gordura: ${fatPercent}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Prot: {proteinPercent}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Carb: {carbPercent}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Gord: {fatPercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidratação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hidratação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta diária de água</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.agua}
                onChange={(e) => handleChange('agua', Number(e.target.value))}
                className={cn('flex-1', errors.agua && 'border-destructive')}
              />
              <span className="text-muted-foreground">ml</span>
            </div>
            {errors.agua && (
              <p className="text-xs text-destructive">{errors.agua}</p>
            )}
          </div>

          {/* Presets */}
          <div className="flex gap-2">
            {waterPresets.map((preset) => (
              <Button
                key={preset}
                variant={values.agua === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChange('agua', preset)}
              >
                {preset / 1000}L
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Composição corporal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composição Corporal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Peso meta */}
          <div className="space-y-2">
            <Label>Peso meta</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={values.peso_meta}
                onChange={(e) => handleChange('peso_meta', Number(e.target.value))}
                className={cn('flex-1', errors.peso_meta && 'border-destructive')}
              />
              <span className="text-muted-foreground">kg</span>
            </div>
            {progress?.weight && (
              <p className="text-xs text-muted-foreground">
                Atual: {progress.weight.current}kg | Faltam: {Math.abs(progress.weight.remaining).toFixed(1)}kg
              </p>
            )}
            {errors.peso_meta && (
              <p className="text-xs text-destructive">{errors.peso_meta}</p>
            )}
          </div>

          {/* Gordura meta */}
          <div className="space-y-2">
            <Label>% Gordura corporal meta</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={values.gordura_meta}
                onChange={(e) => handleChange('gordura_meta', Number(e.target.value))}
                className={cn('flex-1', errors.gordura_meta && 'border-destructive')}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {progress?.fat && (
              <p className="text-xs text-muted-foreground">
                Atual: {progress.fat.current}% | Faltam: {Math.abs(progress.fat.remaining).toFixed(1)}%
              </p>
            )}
            {errors.gordura_meta && (
              <p className="text-xs text-destructive">{errors.gordura_meta}</p>
            )}
          </div>

          {/* Músculo meta */}
          <div className="space-y-2">
            <Label>Massa muscular meta</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={values.musculo_meta}
                onChange={(e) => handleChange('musculo_meta', Number(e.target.value))}
                className={cn('flex-1', errors.musculo_meta && 'border-destructive')}
              />
              <span className="text-muted-foreground">kg</span>
            </div>
            {progress?.muscle && (
              <p className="text-xs text-muted-foreground">
                Atual: {progress.muscle.current}kg | Faltam: {Math.abs(progress.muscle.remaining).toFixed(1)}kg
              </p>
            )}
            {errors.musculo_meta && (
              <p className="text-xs text-destructive">{errors.musculo_meta}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Treino */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Treinos por semana */}
          <div className="space-y-2">
            <Label>Treinos por semana</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <Button
                  key={num}
                  variant={values.treinos_semana === num ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('treinos_semana', num)}
                  className="w-10"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* Minutos por treino */}
          <div className="space-y-2">
            <Label>Duração média do treino</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.minutos_treino}
                onChange={(e) => handleChange('minutos_treino', Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-muted-foreground">min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sono */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sono</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Horas de sono meta</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values.horas_sono}
                onChange={(e) => handleChange('horas_sono', Number(e.target.value))}
                className={cn('flex-1', errors.horas_sono && 'border-destructive')}
              />
              <span className="text-muted-foreground">h</span>
            </div>
            {errors.horas_sono && (
              <p className="text-xs text-destructive">{errors.horas_sono}</p>
            )}
          </div>

          {/* Presets */}
          <div className="flex gap-2">
            {sleepPresets.map((preset) => (
              <Button
                key={preset}
                variant={values.horas_sono === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChange('horas_sono', preset)}
              >
                {preset}h
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar Metas'
        )}
      </Button>
    </div>
  )
}
