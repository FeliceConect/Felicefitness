'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Check, Plus, Trash2 } from 'lucide-react'
import type { NutritionPreferences } from '@/types/settings'
import { dietaryRestrictions, commonProteins, commonCarbs, defaultNutritionPreferences } from '@/lib/settings/defaults'
import { cn } from '@/lib/utils'

interface NutritionPreferencesFormProps {
  preferences: NutritionPreferences | null | undefined
  onSubmit: (preferences: NutritionPreferences) => Promise<void>
}

export function NutritionPreferencesForm({
  preferences: initialPreferences,
  onSubmit
}: NutritionPreferencesFormProps) {
  // Merge with defaults to ensure all fields exist
  const mergedPreferences: NutritionPreferences = {
    ...defaultNutritionPreferences,
    ...initialPreferences
  }
  const [preferences, setPreferences] = useState<NutritionPreferences>(mergedPreferences)
  const [loading, setLoading] = useState(false)
  const [newAllergy, setNewAllergy] = useState('')

  const handleChange = <K extends keyof NutritionPreferences>(
    field: K,
    value: NutritionPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
  }

  const toggleMeal = (index: number) => {
    const updated = [...preferences.refeicoes]
    updated[index] = { ...updated[index], ativo: !updated[index].ativo }
    handleChange('refeicoes', updated)
  }

  const updateMealTime = (index: number, horario: string) => {
    const updated = [...preferences.refeicoes]
    updated[index] = { ...updated[index], horario }
    handleChange('refeicoes', updated)
  }

  const toggleRestriction = (id: string) => {
    const current = preferences.restricoes
    const updated = current.includes(id)
      ? current.filter(r => r !== id)
      : [...current, id]
    handleChange('restricoes', updated)
  }

  const toggleProtein = (id: string) => {
    const current = preferences.proteinas_preferidas
    const updated = current.includes(id)
      ? current.filter(p => p !== id)
      : [...current, id]
    handleChange('proteinas_preferidas', updated)
  }

  const toggleCarb = (id: string) => {
    const current = preferences.carboidratos_preferidos
    const updated = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id]
    handleChange('carboidratos_preferidos', updated)
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !preferences.alergias.includes(newAllergy.trim())) {
      handleChange('alergias', [...preferences.alergias, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    handleChange('alergias', preferences.alergias.filter(a => a !== allergy))
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
      {/* Refeições */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horário das Refeições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preferences.refeicoes.map((refeicao, index) => (
            <div
              key={refeicao.nome}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                refeicao.ativo ? 'bg-muted' : 'bg-muted/30'
              )}
            >
              <Switch
                checked={refeicao.ativo}
                onCheckedChange={() => toggleMeal(index)}
              />
              <span className={cn(
                'flex-1 font-medium',
                !refeicao.ativo && 'text-muted-foreground'
              )}>
                {refeicao.nome}
              </span>
              <Input
                type="time"
                value={refeicao.horario}
                onChange={(e) => updateMealTime(index, e.target.value)}
                disabled={!refeicao.ativo}
                className="w-28"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Restrições alimentares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restrições Alimentares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {dietaryRestrictions.map((restriction) => (
              <button
                key={restriction.id}
                onClick={() => toggleRestriction(restriction.id)}
                className={cn(
                  'p-3 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2',
                  preferences.restricoes.includes(restriction.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {preferences.restricoes.includes(restriction.id) && (
                  <Check className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{restriction.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alergias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alergias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma alergia..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
            />
            <Button onClick={addAllergy} size="icon" variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {preferences.alergias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {preferences.alergias.map((allergy) => (
                <span
                  key={allergy}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm"
                >
                  {allergy}
                  <button
                    onClick={() => removeAllergy(allergy)}
                    className="p-0.5 hover:bg-destructive/20 rounded-full"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alimentos favoritos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alimentos Favoritos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Proteínas preferidas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonProteins.map((protein) => (
                <button
                  key={protein.id}
                  onClick={() => toggleProtein(protein.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    preferences.proteinas_preferidas.includes(protein.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {protein.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Carboidratos preferidos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonCarbs.map((carb) => (
                <button
                  key={carb.id}
                  onClick={() => toggleCarb(carb.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    preferences.carboidratos_preferidos.includes(carb.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {carb.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise por IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise por IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Usar análise por IA</p>
              <p className="text-sm text-muted-foreground">
                Análises restantes: Ilimitado
              </p>
            </div>
            <Switch
              checked={preferences.usar_analise_ia}
              onCheckedChange={(checked) => handleChange('usar_analise_ia', checked)}
            />
          </div>

          {preferences.usar_analise_ia && (
            <div className="space-y-2">
              <Label>Qualidade de análise</Label>
              <div className="flex gap-2">
                {[
                  { id: 'rapida', label: 'Rápida' },
                  { id: 'balanceada', label: 'Balanceada' },
                  { id: 'detalhada', label: 'Detalhada' }
                ].map((quality) => (
                  <Button
                    key={quality.id}
                    variant={preferences.qualidade_analise === quality.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('qualidade_analise', quality.id as NutritionPreferences['qualidade_analise'])}
                    className="flex-1"
                  >
                    {quality.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
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
