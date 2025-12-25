'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useSleep } from '@/hooks/use-sleep'
import {
  SleepTimePicker,
  SleepQualityInput,
  SleepDurationDisplay,
  SleepFactorsSelector,
  TimesWokenInput,
  WakeFeelingInput,
} from '@/components/sleep'
import { calculateSleepDuration } from '@/lib/sleep/calculations'
import { toast } from 'sonner'

export default function RegistrarSonoPage() {
  const router = useRouter()
  const { logSleep } = useSleep()

  // Get yesterday's date as default (registering previous night's sleep)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const defaultDate = yesterday.toISOString().split('T')[0]

  const [saving, setSaving] = useState(false)
  const [date] = useState(defaultDate)
  const [bedtime, setBedtime] = useState('22:00')
  const [wakeTime, setWakeTime] = useState('05:00')
  const [quality, setQuality] = useState(4)
  const [timesWoken, setTimesWoken] = useState(0)
  const [wakeFeeling, setWakeFeeling] = useState(4)
  const [positiveFactors, setPositiveFactors] = useState<string[]>([])
  const [negativeFactors, setNegativeFactors] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const duration = calculateSleepDuration(bedtime, wakeTime)

  const handleSave = async () => {
    setSaving(true)
    try {
      await logSleep({
        date,
        bedtime,
        wake_time: wakeTime,
        quality,
        times_woken: timesWoken,
        wake_feeling: wakeFeeling,
        positive_factors: positiveFactors,
        negative_factors: negativeFactors,
        notes: notes || undefined,
      })

      toast.success('Sono registrado com sucesso!')
      router.push('/sono')
    } catch (err) {
      console.error('Error saving sleep:', err)
      toast.error('Erro ao registrar sono')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Registrar Sono</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Bedtime */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quando dormiu?</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepTimePicker
              value={bedtime}
              onChange={setBedtime}
              type="bedtime"
            />
          </CardContent>
        </Card>

        {/* Wake Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quando acordou?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SleepTimePicker
              value={wakeTime}
              onChange={setWakeTime}
              type="wake"
            />

            {/* Duration display */}
            <SleepDurationDisplay duration={duration} goalHours={7} />
          </CardContent>
        </Card>

        {/* Quality */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Como foi a qualidade do sono?</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepQualityInput value={quality} onChange={setQuality} />
          </CardContent>
        </Card>

        {/* Times Woken */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acordou durante a noite?</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm text-muted-foreground mb-3 block">
              Quantas vezes?
            </Label>
            <TimesWokenInput value={timesWoken} onChange={setTimesWoken} />
          </CardContent>
        </Card>

        {/* Factors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fatores que afetaram o sono</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepFactorsSelector
              selectedPositive={positiveFactors}
              selectedNegative={negativeFactors}
              onChangePositive={setPositiveFactors}
              onChangeNegative={setNegativeFactors}
            />
          </CardContent>
        </Card>

        {/* Wake Feeling */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Como acordou?</CardTitle>
          </CardHeader>
          <CardContent>
            <WakeFeelingInput value={wakeFeeling} onChange={setWakeFeeling} />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notas (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Sonhos, observações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Salvar Registro
        </Button>
      </div>
    </div>
  )
}
