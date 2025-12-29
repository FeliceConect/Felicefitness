'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatSleepDuration, formatSleepDate, getQualityStars } from '@/lib/sleep/calculations'
import type { SleepLog } from '@/types/sleep'
import { ChevronRight, Trash2, MoreVertical, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SleepLogCardProps {
  log: SleepLog
  className?: string
  showLink?: boolean
  onDelete?: (id: string) => Promise<void>
}

export function SleepLogCard({ log, className, showLink = false, onDelete }: SleepLogCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return

    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      await onDelete(log.id)
    } catch (error) {
      console.error('Erro ao deletar:', error)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
      setShowMenu(false)
    }
  }

  const content = (
    <Card className={cn('overflow-hidden relative', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">{formatSleepDate(log.date)}</p>
            <p className="text-2xl font-bold">{formatSleepDuration(log.duration)}</p>
            <p className="text-sm text-muted-foreground">
              {log.bedtime} → {log.wake_time}
            </p>
          </div>

          <div className="text-right space-y-1 flex items-center gap-2">
            <div>
              <p className="text-lg">{getQualityStars(log.quality)}</p>
            </div>
            {showLink && (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            {onDelete && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                    setConfirmDelete(false)
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-popover border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete()
                      }}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Overlay para fechar o menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowMenu(false)
            setConfirmDelete(false)
          }}
        />
      )}
    </Card>
  )

  if (showLink) {
    return (
      <Link href={`/sono/registro/${log.id}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}
