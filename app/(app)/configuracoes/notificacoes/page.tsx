"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/use-notifications'
import {
  NotificationToggle,
  NotificationPreferencesForm,
  NotificationTestPanel
} from '@/components/notifications'
import type { NotificationPreferences } from '@/types/notifications'

export default function NotificationSettingsPage() {
  const {
    preferences,
    isLoadingPreferences,
    updatePreferences,
    isSubscribed
  } = useNotifications()

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local state with loaded preferences
  useEffect(() => {
    if (!isLoadingPreferences) {
      setLocalPrefs(preferences)
    }
  }, [preferences, isLoadingPreferences])

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(localPrefs) !== JSON.stringify(preferences)
    setHasChanges(changed)
  }, [localPrefs, preferences])

  const handleChange = (updates: Partial<NotificationPreferences>) => {
    setLocalPrefs(prev => ({ ...prev, ...updates }))
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)

    const success = await updatePreferences(localPrefs)

    setIsSaving(false)
    if (success) {
      setSaveSuccess(true)
      setHasChanges(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } else {
      setSaveError('Erro ao salvar preferências')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <Link
          href="/configuracoes"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
        <p className="text-foreground-secondary text-sm mt-1">
          Configure seus lembretes e alertas
        </p>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6">
        {/* Push subscription toggle */}
        <section>
          <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-3">
            Ativar Notificações
          </h2>
          <div className="bg-white border border-border rounded-xl p-4">
            <NotificationToggle />
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-3">
            Preferências
          </h2>

          {isLoadingPreferences ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-dourado animate-spin" />
            </div>
          ) : (
            <NotificationPreferencesForm
              preferences={localPrefs}
              onChange={handleChange}
              disabled={!isSubscribed}
            />
          )}
        </section>

        {/* Test notifications */}
        {isSubscribed && (
          <section>
            <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-3">
              Testar Notificações
            </h2>
            <div className="bg-white border border-border rounded-xl p-4">
              <NotificationTestPanel />
            </div>
          </section>
        )}

        {/* Info */}
        <section className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-foreground font-medium mb-2">Sobre as Notificações</h3>
          <ul className="space-y-2 text-sm text-foreground-secondary">
            <li className="flex items-start gap-2">
              <span className="text-dourado">•</span>
              As notificações são enviadas para este dispositivo
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dourado">•</span>
              No horário silencioso, apenas lembretes urgentes são enviados
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dourado">•</span>
              Você pode desativar tipos específicos a qualquer momento
            </li>
          </ul>
        </section>
      </div>

      {/* Save button */}
      {hasChanges && isSubscribed && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-dourado to-dourado text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Preferências
              </>
            )}
          </motion.button>

          {saveError && (
            <div className="mt-2 flex items-center justify-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {saveError}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
