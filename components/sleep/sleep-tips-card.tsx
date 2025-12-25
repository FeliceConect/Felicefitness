'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Lightbulb } from 'lucide-react'

interface SleepTipsCardProps {
  tips: string[]
  className?: string
}

export function SleepTipsCard({ tips, className }: SleepTipsCardProps) {
  if (tips.length === 0) return null

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Dicas Personalizadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="text-primary mt-0.5">💡</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
