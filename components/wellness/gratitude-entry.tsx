'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Sparkles } from 'lucide-react'
import type { GratitudeEntry as GratitudeEntryType } from '@/types/wellness'

const GRATITUDE_PROMPTS = [
  'O que te fez sorrir hoje?',
  'Qual pequena alegria você teve hoje?',
  'Quem você agradece por estar na sua vida?',
  'O que você aprendeu recentemente?',
  'Qual conquista você está orgulhoso(a)?',
]

interface GratitudeInputProps {
  onAdd: (text: string) => Promise<void>
  canAddMore: boolean
  className?: string
}

export function GratitudeInput({
  onAdd,
  canAddMore,
  className,
}: GratitudeInputProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState(
    GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !canAddMore) return

    setLoading(true)
    try {
      await onAdd(text.trim())
      setText('')
      // New random prompt
      setPrompt(
        GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]
      )
    } catch (error) {
      console.error('Error adding gratitude:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!canAddMore) {
    return (
      <Card className={cn('bg-muted/50', className)}>
        <CardContent className="p-4 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            Você já registrou suas gratidões de hoje!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground italic">{prompt}</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sou grato(a) por..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !text.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

interface GratitudeListProps {
  entries: GratitudeEntryType[]
  onRemove?: (id: string) => Promise<void>
  editable?: boolean
  className?: string
}

export function GratitudeList({
  entries,
  onRemove,
  editable = false,
  className,
}: GratitudeListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (id: string) => {
    if (!onRemove) return
    setRemovingId(id)
    try {
      await onRemove(id)
    } catch (error) {
      console.error('Error removing gratitude:', error)
    } finally {
      setRemovingId(null)
    }
  }

  if (entries.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>Nenhuma gratidão registrada ainda.</p>
        <p className="text-sm">Comece adicionando algo pelo qual você é grato(a)!</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg bg-muted/50',
            removingId === entry.id && 'opacity-50'
          )}
        >
          <span className="text-lg">{index + 1}.</span>
          <p className="flex-1 text-sm">{entry.entrada}</p>
          {editable && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(entry.id)}
              disabled={removingId === entry.id}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

interface GratitudeHistoryProps {
  history: { date: string; entries: GratitudeEntryType[] }[]
  className?: string
}

export function GratitudeHistory({ history, className }: GratitudeHistoryProps) {
  if (history.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {history.map(({ date, entries }) => {
        const dateObj = new Date(date)
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })

        return (
          <Card key={date}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {formattedDate}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary">-</span>
                    <span>{entry.entrada}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface GratitudeStatsProps {
  streak: number
  totalEntries: number
  frequentThemes: string[]
  className?: string
}

export function GratitudeStats({
  streak,
  totalEntries,
  frequentThemes,
  className,
}: GratitudeStatsProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{streak}</p>
            <p className="text-xs text-muted-foreground">Dias seguidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totalEntries}</p>
            <p className="text-xs text-muted-foreground">Total de gratidões</p>
          </div>
        </div>

        {frequentThemes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Temas mais frequentes:
            </p>
            <div className="flex flex-wrap gap-1">
              {frequentThemes.map((theme) => (
                <span
                  key={theme}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
