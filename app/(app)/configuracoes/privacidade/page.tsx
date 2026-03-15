'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Database, Share2, Rss } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings } from '@/hooks/use-settings'
import { formatFileSize, calculateDataSize } from '@/lib/settings/exporters'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PrivacySettings } from '@/types/settings'

export default function PrivacidadePage() {
  const router = useRouter()
  const { settings, loading, updatePrivacy } = useSettings()
  const [localSettings, setLocalSettings] = useState<PrivacySettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [dataSize, setDataSize] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)
  const [autoPublishFeed, setAutoPublishFeed] = useState(true)
  const [savingAutoPublish, setSavingAutoPublish] = useState(false)

  const supabase = createClient()

  // Load auto_publish_feed setting
  useEffect(() => {
    async function loadAutoPublish() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('fitness_profiles')
        .select('auto_publish_feed')
        .eq('id', user.id)
        .single()
      if (data) setAutoPublishFeed(data.auto_publish_feed !== false)
    }
    loadAutoPublish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize local settings when loaded
  if (settings && !localSettings) {
    setLocalSettings(settings.privacy)
    // Calculate data size
    fetchDataSize()
  }

  async function fetchDataSize() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const size = await calculateDataSize(user.id)
        setDataSize(size)
      }
    } catch (err) {
      console.error('Error calculating data size:', err)
    }
  }

  const handleChange = <K extends keyof PrivacySettings>(
    field: K,
    value: PrivacySettings[K]
  ) => {
    setLocalSettings(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!localSettings) return

    setSaving(true)
    try {
      await updatePrivacy(localSettings)
      toast.success('Configurações de privacidade salvas!')
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
            <h1 className="font-semibold">Privacidade e Dados</h1>
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
          <h1 className="font-semibold">Privacidade e Dados</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Data Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataSize && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Treinos</p>
                    <p className="font-medium">{formatFileSize(dataSize.breakdown.treinos)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Refeições</p>
                    <p className="font-medium">{formatFileSize(dataSize.breakdown.refeicoes)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Água</p>
                    <p className="font-medium">{formatFileSize(dataSize.breakdown.agua)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Fotos</p>
                    <p className="font-medium">{formatFileSize(dataSize.breakdown.fotos)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Espaço total usado: <span className="font-medium">{formatFileSize(dataSize.total)}</span>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Auto-Publish Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rss className="h-4 w-4" />
              Feed Automático
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Publicar no feed automaticamente</p>
                <p className="text-sm text-muted-foreground">
                  Treinos, conquistas, check-ins e level ups aparecem no feed
                </p>
              </div>
              <Switch
                checked={autoPublishFeed}
                disabled={savingAutoPublish}
                onCheckedChange={async (checked) => {
                  setAutoPublishFeed(checked)
                  setSavingAutoPublish(true)
                  try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (supabase as any)
                      .from('fitness_profiles')
                      .update({ auto_publish_feed: checked })
                      .eq('id', user.id)
                    toast.success(checked ? 'Auto-posts ativados' : 'Auto-posts desativados')
                  } catch {
                    setAutoPublishFeed(!checked)
                    toast.error('Erro ao salvar')
                  } finally {
                    setSavingAutoPublish(false)
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Estatísticas anônimas</p>
                <p className="text-sm text-muted-foreground">
                  Ajuda a melhorar o app
                </p>
              </div>
              <Switch
                checked={localSettings.compartilhar_estatisticas}
                onCheckedChange={(checked) => handleChange('compartilhar_estatisticas', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Acesso do treinador</p>
                <p className="text-sm text-muted-foreground">
                  Permitir que treinador veja dados
                </p>
              </div>
              <Switch
                checked={localSettings.permitir_treinador}
                onCheckedChange={(checked) => handleChange('permitir_treinador', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Perfil público</p>
                <p className="text-sm text-muted-foreground">
                  Mostrar perfil para outros usuários
                </p>
              </div>
              <Switch
                checked={localSettings.mostrar_perfil_publico}
                onCheckedChange={(checked) => handleChange('mostrar_perfil_publico', checked)}
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Seus dados são armazenados de forma segura e nunca compartilhados
          sem sua permissão explícita.
        </p>
      </div>
    </div>
  )
}
