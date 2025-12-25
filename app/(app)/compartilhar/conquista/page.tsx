'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserAchievement {
  id: string
  achievement_id: string
  unlocked_at: string
  achievement: {
    name: string
    description: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  }
}

const rarityColors = {
  common: 'bg-gray-500/10 text-gray-500',
  rare: 'bg-blue-500/10 text-blue-500',
  epic: 'bg-violet-500/10 text-violet-500',
  legendary: 'bg-amber-500/10 text-amber-500',
}

const rarityLabels = {
  common: 'Comum',
  rare: 'Rara',
  epic: 'Epica',
  legendary: 'Lendaria',
}

export default function CompartilharConquistaPage() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_achievements')
      .select(`
        id,
        achievement_id,
        unlocked_at,
        achievement:achievements(name, description, icon, rarity)
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(50) as { data: UserAchievement[] | null }

    if (data) {
      setAchievements(data)
    }
    setLoading(false)
  }

  const filteredAchievements = achievements.filter(a =>
    a.achievement.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Compartilhar Conquista</h1>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conquista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Achievements List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma conquista encontrada</p>
            <p className="text-sm mt-1">
              Desbloqueie conquistas para poder compartilhar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAchievements.map((ua) => (
              <Link
                key={ua.id}
                href={`/compartilhar/conquista/${ua.id}`}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                <div className="text-3xl">{ua.achievement.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{ua.achievement.name}</h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      rarityColors[ua.achievement.rarity]
                    )}>
                      {rarityLabels[ua.achievement.rarity]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {ua.achievement.description}
                  </p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {format(parseISO(ua.unlocked_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
