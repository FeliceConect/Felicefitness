'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, Info } from 'lucide-react'

interface RevoladeWarningProps {
  jejumInicio: string
  restricaoLaticíniosFim: string
  className?: string
}

export function RevoladeWarning({
  jejumInicio,
  restricaoLaticíniosFim,
  className,
}: RevoladeWarningProps) {
  return (
    <Card className={cn('border-red-500/50 bg-red-500/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-red-600 dark:text-red-400 mb-2">
              Restrição Revolade Ativa
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Jejum:</strong> {jejumInicio} - tomar Revolade em jejum
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Sem laticínios/cálcio até:</strong> {restricaoLaticíniosFim}
                </span>
              </div>
            </div>

            <div className="mt-3 p-2 bg-red-500/10 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">
                Evite suplementos com cálcio, laticínios ou antiácidos 4 horas antes e 2 horas depois do Revolade.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
