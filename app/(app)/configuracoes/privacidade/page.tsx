'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Download, Trash2, AlertTriangle, Database, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSettings } from '@/hooks/use-settings'
import { exportAllData, exportToJSON, downloadBlob, clearLocalCache, formatFileSize, calculateDataSize } from '@/lib/settings/exporters'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PrivacySettings } from '@/types/settings'

export default function PrivacidadePage() {
  const router = useRouter()
  const { settings, loading, updatePrivacy } = useSettings()
  const [localSettings, setLocalSettings] = useState<PrivacySettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dataSize, setDataSize] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

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

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const data = await exportAllData(user.id)
      const blob = exportToJSON(data)
      const filename = `felicefit-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadBlob(blob, filename)
      toast.success('Dados exportados com sucesso!')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  const handleClearCache = () => {
    clearLocalCache()
    toast.success('Cache limpo com sucesso!')
  }

  const handleDeleteData = async () => {
    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Delete all user data from all tables
      await Promise.all([
        supabase.from('workout_sessions').delete().eq('user_id', user.id),
        supabase.from('nutrition_logs').delete().eq('user_id', user.id),
        supabase.from('water_logs').delete().eq('user_id', user.id),
        supabase.from('body_measurements').delete().eq('user_id', user.id),
        supabase.from('progress_photos').delete().eq('user_id', user.id),
        supabase.from('personal_records').delete().eq('user_id', user.id),
        supabase.from('daily_scores').delete().eq('user_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('xp_logs').delete().eq('user_id', user.id)
      ])

      toast.success('Todos os dados foram excluídos')
      setShowDeleteDialog(false)
      router.push('/dashboard')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Erro ao excluir dados')
    } finally {
      setDeleting(false)
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

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar todos os dados
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleClearCache}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar cache
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Excluir todos os dados
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Seus dados são armazenados de forma segura e nunca compartilhados
          sem sua permissão explícita.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todos os dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus treinos, refeições, medições,
              fotos e conquistas serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteData}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
