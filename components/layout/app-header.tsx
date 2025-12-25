'use client'

import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  title: string
  showBack?: boolean
  rightContent?: React.ReactNode
  className?: string
}

export function AppHeader({
  title,
  showBack = false,
  rightContent,
  className,
}: AppHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-top',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="-ml-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="font-semibold text-lg truncate">{title}</h1>
        </div>

        {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
      </div>
    </header>
  )
}
