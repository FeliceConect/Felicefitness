'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
