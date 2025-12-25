'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share, Plus, MoreVertical, Download, Smartphone } from 'lucide-react'

interface AddToHomeProps {
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  onDone?: () => void
  className?: string
}

export function AddToHome({ platform, onDone, className }: AddToHomeProps) {
  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Adicionar ao iPhone',
          steps: [
            {
              icon: <Share className="w-5 h-5" />,
              text: 'Toque no botao de compartilhar',
              detail: 'Na barra inferior do Safari',
            },
            {
              icon: <Plus className="w-5 h-5" />,
              text: 'Selecione "Adicionar a Tela de Inicio"',
              detail: 'Role para baixo se necessario',
            },
            {
              icon: <Smartphone className="w-5 h-5" />,
              text: 'Toque em "Adicionar"',
              detail: 'O app aparecera na sua home',
            },
          ],
        }
      case 'android':
        return {
          title: 'Adicionar ao Android',
          steps: [
            {
              icon: <MoreVertical className="w-5 h-5" />,
              text: 'Toque no menu (3 pontos)',
              detail: 'No canto superior direito',
            },
            {
              icon: <Download className="w-5 h-5" />,
              text: 'Selecione "Instalar app" ou "Adicionar a tela inicial"',
              detail: 'O nome pode variar',
            },
            {
              icon: <Smartphone className="w-5 h-5" />,
              text: 'Confirme a instalacao',
              detail: 'O app aparecera na sua home',
            },
          ],
        }
      case 'desktop':
        return {
          title: 'Instalar no computador',
          steps: [
            {
              icon: <Download className="w-5 h-5" />,
              text: 'Clique no icone de instalacao',
              detail: 'Na barra de endereco do navegador',
            },
            {
              icon: <Plus className="w-5 h-5" />,
              text: 'Confirme a instalacao',
              detail: 'Clique em "Instalar"',
            },
            {
              icon: <Smartphone className="w-5 h-5" />,
              text: 'Pronto!',
              detail: 'O app aparecera no seu sistema',
            },
          ],
        }
      default:
        return {
          title: 'Adicionar a tela inicial',
          steps: [
            {
              icon: <MoreVertical className="w-5 h-5" />,
              text: 'Abra o menu do navegador',
              detail: 'Geralmente no canto superior',
            },
            {
              icon: <Download className="w-5 h-5" />,
              text: 'Procure por "Adicionar a tela inicial" ou "Instalar"',
              detail: '',
            },
            {
              icon: <Smartphone className="w-5 h-5" />,
              text: 'Confirme a instalacao',
              detail: '',
            },
          ],
        }
    }
  }

  const instructions = getInstructions()

  return (
    <Card className={cn('bg-card/50 backdrop-blur border-border/50', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-purple-400" />
          {instructions.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                    Passo {index + 1}
                  </span>
                </div>
                <p className="font-medium mt-1">{step.text}</p>
                {step.detail && (
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {platform === 'ios' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              <strong>Importante:</strong> Use o Safari para instalar no iPhone.
              Outros navegadores nao suportam a instalacao.
            </p>
          </div>
        )}

        {onDone && (
          <Button
            onClick={onDone}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Entendi
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
