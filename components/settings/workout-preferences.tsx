'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Check } from 'lucide-react'
import type { WorkoutPreferences } from '@/types/settings'
import { weekDays, workoutTypes, experienceLevels, defaultWorkoutPreferences } from '@/lib/settings/defaults'
import { cn } from '@/lib/utils'

interface WorkoutPreferencesFormProps {
  preferences: WorkoutPreferences | null | undefined
  onSubmit: (preferences: WorkoutPreferences) => Promise<void>
  errors?: Record<string, string>
}

export function WorkoutPreferencesForm({
  preferences: initialPreferences,
  onSubmit,
  errors = {}
}: WorkoutPreferencesFormProps) {
  // Merge with defaults to ensure all fields exist
  const mergedPreferences: WorkoutPreferences = {
    ...defaultWorkoutPreferences,
    ...initialPreferences
  }
  const [preferences, setPreferences] = useState<WorkoutPreferences>(mergedPreferences)
  const [loading, setLoading] = useState(false)

  const handleChange = <K extends keyof WorkoutPreferences>(
    field: K,
    value: WorkoutPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
  }

  const toggleDay = (dayId: string) => {
    const current = preferences.dias_preferidos
    const updated = current.includes(dayId)
      ? current.filter(d => d !== dayId)
      : [...current, dayId]
    handleChange('dias_preferidos', updated)
  }

  const toggleWorkoutType = (typeId: string) => {
    const current = preferences.tipos_preferidos
    const updated = current.includes(typeId)
      ? current.filter(t => t !== typeId)
      : [...current, typeId]
    handleChange('tipos_preferidos', updated)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit(preferences)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Horário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Horário preferido</Label>
            <Input
              type="time"
              value={preferences.horario_preferido}
              onChange={(e) => handleChange('horario_preferido', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Duração média</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={preferences.duracao_media}
                onChange={(e) => handleChange('duracao_media', Number(e.target.value))}
                min={10}
                max={180}
                className={cn(errors.duracao_media && 'border-destructive')}
              />
              <span className="text-muted-foreground">min</span>
            </div>
            {errors.duracao_media && (
              <p className="text-xs text-destructive">{errors.duracao_media}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dias da semana */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dias Preferidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {weekDays.map((day) => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                  preferences.dias_preferidos.includes(day.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
                title={day.fullLabel}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {preferences.dias_preferidos.length} dias selecionados
          </p>
          {errors.dias_preferidos && (
            <p className="text-xs text-destructive">{errors.dias_preferidos}</p>
          )}
        </CardContent>
      </Card>

      {/* Tipos de treino */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipos de Treino</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {workoutTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleWorkoutType(type.id)}
                className={cn(
                  'p-3 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2',
                  preferences.tipos_preferidos.includes(type.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {preferences.tipos_preferidos.includes(type.id) && (
                  <Check className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nível de experiência */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nível de Experiência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {experienceLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleChange('nivel_experiencia', level.id as WorkoutPreferences['nivel_experiencia'])}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between',
                  preferences.nivel_experiencia === level.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <div>
                  <p className="font-medium">{level.label}</p>
                  <p className={cn(
                    'text-sm',
                    preferences.nivel_experiencia === level.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}>
                    {level.description}
                  </p>
                </div>
                {preferences.nivel_experiencia === level.id && (
                  <Check className="h-5 w-5 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Afeta: sugestões de carga, descanso entre séries, progressão automática
          </p>
        </CardContent>
      </Card>

      {/* Timer de descanso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timer de Descanso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Som do timer</p>
            </div>
            <Switch
              checked={preferences.som_timer}
              onCheckedChange={(checked) => handleChange('som_timer', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Vibração do timer</p>
            </div>
            <Switch
              checked={preferences.vibracao_timer}
              onCheckedChange={(checked) => handleChange('vibracao_timer', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Descanso padrão</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={preferences.descanso_padrao}
                onChange={(e) => handleChange('descanso_padrao', Number(e.target.value))}
                min={10}
                max={300}
                className={cn(errors.descanso_padrao && 'border-destructive')}
              />
              <span className="text-muted-foreground">seg</span>
            </div>
            {errors.descanso_padrao && (
              <p className="text-xs text-destructive">{errors.descanso_padrao}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unidades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Peso</Label>
            <div className="flex gap-2">
              <Button
                variant={preferences.unidade_peso === 'kg' ? 'default' : 'outline'}
                onClick={() => handleChange('unidade_peso', 'kg')}
                className="flex-1"
              >
                kg
              </Button>
              <Button
                variant={preferences.unidade_peso === 'lb' ? 'default' : 'outline'}
                onClick={() => handleChange('unidade_peso', 'lb')}
                className="flex-1"
              >
                lb
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Altura</Label>
            <div className="flex gap-2">
              <Button
                variant={preferences.unidade_altura === 'cm' ? 'default' : 'outline'}
                onClick={() => handleChange('unidade_altura', 'cm')}
                className="flex-1"
              >
                cm
              </Button>
              <Button
                variant={preferences.unidade_altura === 'ft' ? 'default' : 'outline'}
                onClick={() => handleChange('unidade_altura', 'ft')}
                className="flex-1"
              >
                ft/in
              </Button>
            </div>
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
          'Salvar Preferências'
        )}
      </Button>
    </div>
  )
}
