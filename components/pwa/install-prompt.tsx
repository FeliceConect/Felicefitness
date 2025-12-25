'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download, Smartphone, Bell, Zap, Wifi } from 'lucide-react'

interface InstallPromptProps {
  onInstall: () => void
  onDismiss: () => void
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  className?: string
}

export function InstallPrompt({
  onInstall,
  onDismiss,
  platform,
  className,
}: InstallPromptProps) {
  const [showDetails, setShowDetails] = useState(false)

  const benefits = [
    {
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      title: 'Acesso rapido',
      description: 'Abra o app direto da home',
    },
    {
      icon: <Bell className="w-4 h-4 text-purple-400" />,
      title: 'Notificacoes',
      description: 'Lembretes e alertas',
    },
    {
      icon: <Wifi className="w-4 h-4 text-blue-400" />,
      title: 'Funciona offline',
      description: 'Acesse sem internet',
    },
    {
      icon: <Smartphone className="w-4 h-4 text-green-400" />,
      title: 'Atalhos rapidos',
      description: 'Ações com um toque',
    },
  ]

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-purple-900/50 to-background/95 border-purple-500/30 backdrop-blur-lg shadow-2xl',
        className
      )}
    >
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-2xl">💪</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg">Instalar FeliceFit</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione a home screen para melhor experiencia
                </p>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/20"
                  >
                    {benefit.icon}
                    <div>
                      <p className="text-xs font-medium">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {platform !== 'ios' && (
                <Button
                  onClick={onInstall}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar
                </Button>
              )}

              {platform === 'ios' && (
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {showDetails ? 'Ver menos' : 'Como instalar'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={onDismiss}
                className="border-purple-500/30 hover:bg-purple-500/10"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
