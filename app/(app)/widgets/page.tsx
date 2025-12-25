'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGallery } from '@/components/widgets/widget-gallery'
import { AppShortcuts } from '@/components/pwa/app-shortcuts'
import { useWidgets } from '@/hooks/use-widgets'
import { DEFAULT_WIDGETS } from '@/types/widgets'

export default function WidgetsPage() {
  const router = useRouter()
  const {
    activeWidgets,
    reorderWidgets,
    addWidget,
    removeWidget,
    toggleWidget,
    saveLayout,
    loading,
  } = useWidgets()

  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [activeWidgets])

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaults = DEFAULT_WIDGETS.slice(0, 5).map((w, i) => ({
      id: `${w.type}-${Date.now()}-${i}`,
      type: w.type,
      size: w.defaultSize,
      enabled: true,
      order: i,
    }))
    reorderWidgets(defaults)
  }, [reorderWidgets])

  // Save changes
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveLayout()
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="font-semibold">Widgets</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-9 w-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <WidgetGallery
              activeWidgets={activeWidgets}
              onReorder={reorderWidgets}
              onToggle={toggleWidget}
              onAdd={(type) => {
                const def = DEFAULT_WIDGETS.find((w) => w.type === type)
                if (def) {
                  addWidget(def.type, def.defaultSize)
                }
              }}
              onRemove={removeWidget}
            />

            {/* App Shortcuts Section */}
            <AppShortcuts />
          </>
        )}
      </main>
    </div>
  )
}
