'use client'

import { ArrowLeft, Dumbbell, Trophy, Flame, TrendingUp, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ShareOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
}

const shareOptions: ShareOption[] = [
  {
    id: 'workout',
    title: 'Treino',
    description: 'Compartilhe seu treino concluido',
    icon: <Dumbbell className="w-6 h-6" />,
    href: '/compartilhar/treino',
    color: 'bg-violet-500/10 text-violet-500',
  },
  {
    id: 'achievement',
    title: 'Conquista',
    description: 'Mostre suas conquistas desbloqueadas',
    icon: <Trophy className="w-6 h-6" />,
    href: '/compartilhar/conquista',
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    id: 'streak',
    title: 'Sequencia',
    description: 'Exiba sua sequencia de treinos',
    icon: <Flame className="w-6 h-6" />,
    href: '/compartilhar/streak',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    id: 'progress',
    title: 'Progresso',
    description: 'Compare seu antes e depois',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/compartilhar/progresso',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    id: 'weekly',
    title: 'Resumo Semanal',
    description: 'Compartilhe seu resumo da semana',
    icon: <BarChart3 className="w-6 h-6" />,
    href: '/compartilhar/semanal',
    color: 'bg-blue-500/10 text-blue-500',
  },
]

export default function CompartilharPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Compartilhar</h1>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Intro */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">O que voce quer compartilhar?</h2>
          <p className="text-muted-foreground">
            Escolha o tipo de conteudo para criar um card personalizado
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid gap-4">
          {shareOptions.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border',
                'hover:bg-muted/50 transition-colors'
              )}
            >
              <div className={cn('p-3 rounded-xl', option.color)}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{option.title}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
            </Link>
          ))}
        </div>

        {/* Recent Shares */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Compartilhamentos Recentes</h3>
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum compartilhamento recente</p>
            <p className="text-sm mt-1">
              Seus cards compartilhados aparecerao aqui
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
