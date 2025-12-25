'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeSelector, ColorPicker } from '@/components/settings'
import { useSettings } from '@/hooks/use-settings'
import { themeColors, fontSizes } from '@/lib/settings/defaults'
import { toast } from 'sonner'
import type { AppearanceSettings } from '@/types/settings'

export default function AparenciaPage() {
  const router = useRouter()
  const { settings, loading, updateAppearance } = useSettings()
  const [localSettings, setLocalSettings] = useState<AppearanceSettings | null>(null)
  const [saving, setSaving] = useState(false)

  // Initialize local settings when loaded
  if (settings && !localSettings) {
    setLocalSettings(settings.appearance)
  }

  const handleChange = <K extends keyof AppearanceSettings>(
    field: K,
    value: AppearanceSettings[K]
  ) => {
    setLocalSettings(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!localSettings) return

    setSaving(true)
    try {
      await updateAppearance(localSettings)
      toast.success('Aparência atualizada!')
      router.back()
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings || !localSettings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Aparência</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Aparência</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tema</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeSelector
              currentTheme={localSettings.tema}
              onSelect={(theme) => handleChange('tema', theme)}
            />
          </CardContent>
        </Card>

        {/* Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cor de Destaque</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorPicker
              currentColor={localSettings.cor_primaria}
              colors={themeColors}
              onSelect={(color) => handleChange('cor_primaria', color)}
            />
          </CardContent>
        </Card>

        {/* Font Size */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tamanho da Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {fontSizes.map((size) => (
                <Button
                  key={size.id}
                  variant={localSettings.tamanho_fonte === size.id ? 'default' : 'outline'}
                  onClick={() => handleChange('tamanho_fonte', size.id as AppearanceSettings['tamanho_fonte'])}
                  className="flex-1"
                >
                  <span style={{ fontSize: `${size.scale}rem` }}>{size.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Animations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Animações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Animações</p>
                <p className="text-sm text-muted-foreground">
                  Transições e efeitos visuais
                </p>
              </div>
              <Switch
                checked={localSettings.animacoes}
                onCheckedChange={(checked) => handleChange('animacoes', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Confetti/Celebrações</p>
                <p className="text-sm text-muted-foreground">
                  Efeitos ao completar conquistas
                </p>
              </div>
              <Switch
                checked={localSettings.confetti}
                onCheckedChange={(checked) => handleChange('confetti', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reduzir movimento</p>
                <p className="text-sm text-muted-foreground">
                  Para sensibilidade a movimento
                </p>
              </div>
              <Switch
                checked={localSettings.movimento_reduzido}
                onCheckedChange={(checked) => handleChange('movimento_reduzido', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Aplicar Tema'
          )}
        </Button>
      </div>
    </div>
  )
}
