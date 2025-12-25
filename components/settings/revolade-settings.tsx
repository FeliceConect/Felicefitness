'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, AlertTriangle, Clock, Pill, Milk, Check } from 'lucide-react'
import type { RevoladeSettings } from '@/types/settings'
import { defaultRevoladeSettings } from '@/lib/settings/defaults'
import { cn } from '@/lib/utils'

interface RevoladeSettingsFormProps {
  settings: RevoladeSettings | null | undefined
  onSubmit: (settings: RevoladeSettings) => Promise<void>
  errors?: Record<string, string>
}

export function RevoladeSettingsForm({
  settings: initialSettings,
  onSubmit,
  errors = {}
}: RevoladeSettingsFormProps) {
  // Merge with defaults to ensure all fields exist
  const mergedSettings: RevoladeSettings = {
    ...defaultRevoladeSettings,
    ...initialSettings
  }
  const [settings, setSettings] = useState<RevoladeSettings>(mergedSettings)
  const [loading, setLoading] = useState(false)

  const handleChange = <K extends keyof RevoladeSettings>(
    field: K,
    value: RevoladeSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit(settings)
    } finally {
      setLoading(false)
    }
  }

  // Parse times for visualization
  const parseTime = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const jejumInicio = parseTime(settings.jejum_inicio)
  const jejumFim = parseTime(settings.jejum_fim)
  const medicamento = parseTime(settings.horario_medicamento)
  // laticFim not used currently but kept for future use
  // const laticFim = parseTime(settings.restricao_laticinios_fim)

  // Calculate percentages for timeline (6:00 to 22:00 = 960 minutes)
  const timelineStart = 6 * 60 // 6:00
  const timelineEnd = 22 * 60 // 22:00
  const timelineRange = timelineEnd - timelineStart

  const getPercent = (minutes: number) => {
    return Math.max(0, Math.min(100, ((minutes - timelineStart) / timelineRange) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Ativação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Revolade</CardTitle>
              <CardDescription>
                Controle de horários para o medicamento
              </CardDescription>
            </div>
            <Switch
              checked={settings.ativo}
              onCheckedChange={(checked) => handleChange('ativo', checked)}
            />
          </div>
        </CardHeader>
        {settings.ativo && (
          <CardContent>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  O Revolade requer jejum de 2h antes e após, e evitar laticínios
                  por 4h após o medicamento. Este módulo ajuda a gerenciar esses horários.
                </span>
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {settings.ativo && (
        <>
          {/* Horário do medicamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Horário do Medicamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Horário do Revolade</Label>
                <Input
                  type="time"
                  value={settings.horario_medicamento}
                  onChange={(e) => handleChange('horario_medicamento', e.target.value)}
                  className={cn(errors.horario_medicamento && 'border-destructive')}
                />
                {errors.horario_medicamento && (
                  <p className="text-xs text-destructive">{errors.horario_medicamento}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tome com estômago vazio, 2 horas após a última refeição
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Janela de jejum */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Janela de Jejum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início do jejum</Label>
                  <Input
                    type="time"
                    value={settings.jejum_inicio}
                    onChange={(e) => handleChange('jejum_inicio', e.target.value)}
                    className={cn(errors.jejum_inicio && 'border-destructive')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Última refeição antes
                  </p>
                  {errors.jejum_inicio && (
                    <p className="text-xs text-destructive">{errors.jejum_inicio}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fim do jejum</Label>
                  <Input
                    type="time"
                    value={settings.jejum_fim}
                    onChange={(e) => handleChange('jejum_fim', e.target.value)}
                    className={cn(errors.jejum_fim && 'border-destructive')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Após tomar o Revolade
                  </p>
                  {errors.jejum_fim && (
                    <p className="text-xs text-destructive">{errors.jejum_fim}</p>
                  )}
                </div>
              </div>

              {/* Timeline visualization */}
              <div className="mt-6 space-y-2">
                <Label>Visualização</Label>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  {/* Normal eating time */}
                  <div className="absolute inset-y-0 left-0 bg-green-500/30"
                       style={{ width: `${getPercent(jejumInicio)}%` }} />

                  {/* Fasting window */}
                  <div
                    className="absolute inset-y-0 bg-red-500/30"
                    style={{
                      left: `${getPercent(jejumInicio)}%`,
                      width: `${getPercent(jejumFim) - getPercent(jejumInicio)}%`
                    }}
                  />

                  {/* After fasting */}
                  <div
                    className="absolute inset-y-0 right-0 bg-green-500/30"
                    style={{ width: `${100 - getPercent(jejumFim)}%` }}
                  />

                  {/* Medication marker */}
                  <div
                    className="absolute inset-y-0 w-1 bg-primary"
                    style={{ left: `${getPercent(medicamento)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>06:00</span>
                  <span>{settings.jejum_inicio}</span>
                  <span className="text-primary font-medium">{settings.horario_medicamento}</span>
                  <span>{settings.jejum_fim}</span>
                  <span>22:00</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500/30" />
                    Alimentação liberada
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500/30" />
                    Jejum
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restrição de laticínios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Milk className="h-4 w-4" />
                Restrição de Laticínios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Laticínios liberados após</Label>
                <Input
                  type="time"
                  value={settings.restricao_laticinios_fim}
                  onChange={(e) => handleChange('restricao_laticinios_fim', e.target.value)}
                  className={cn(errors.restricao_laticinios_fim && 'border-destructive')}
                />
                <p className="text-xs text-muted-foreground">
                  4 horas após o medicamento
                </p>
                {errors.restricao_laticinios_fim && (
                  <p className="text-xs text-destructive">{errors.restricao_laticinios_fim}</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Evitar até {settings.restricao_laticinios_fim}:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Leite e derivados</li>
                  <li>• Queijos</li>
                  <li>• Iogurte</li>
                  <li>• Whey com leite</li>
                  <li>• Alimentos ricos em cálcio</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta início jejum</p>
                  <p className="text-sm text-muted-foreground">
                    30 min antes ({subtractMinutes(settings.jejum_inicio, 30)})
                  </p>
                </div>
                <Switch
                  checked={settings.alerta_jejum}
                  onCheckedChange={(checked) => handleChange('alerta_jejum', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta do medicamento</p>
                  <p className="text-sm text-muted-foreground">
                    No horário ({settings.horario_medicamento})
                  </p>
                </div>
                <Switch
                  checked={settings.alerta_medicamento}
                  onCheckedChange={(checked) => handleChange('alerta_medicamento', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta liberação</p>
                  <p className="text-sm text-muted-foreground">
                    Quando pode comer ({settings.jejum_fim})
                  </p>
                </div>
                <Switch
                  checked={settings.alerta_liberacao}
                  onCheckedChange={(checked) => handleChange('alerta_liberacao', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta laticínios</p>
                  <p className="text-sm text-muted-foreground">
                    Quando pode consumir ({settings.restricao_laticinios_fim})
                  </p>
                </div>
                <Switch
                  checked={settings.alerta_laticinios}
                  onCheckedChange={(checked) => handleChange('alerta_laticinios', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
          <>
            <Check className="h-4 w-4 mr-2" />
            Salvar Configurações
          </>
        )}
      </Button>
    </div>
  )
}

// Helper to subtract minutes from time string
function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m - minutes
  const newH = Math.floor(totalMinutes / 60)
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}
