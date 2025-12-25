'use client'

import { useState } from 'react'
import { Camera, Settings, Flame, Star, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProfileHeaderProps {
  profile: {
    nome: string
    sobrenome?: string
    foto_url?: string
    nivel?: number
    titulo?: string
    xp_total?: number
    streak_atual?: number
  }
  onEditPhoto?: () => void
  className?: string
}

export function ProfileHeader({ profile, onEditPhoto, className }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false)

  const initials = `${profile.nome?.[0] || ''}${profile.sobrenome?.[0] || ''}`.toUpperCase()
  const fullName = [profile.nome, profile.sobrenome].filter(Boolean).join(' ')
  const nivel = profile.nivel || 1
  const titulo = profile.titulo || 'Iniciante'
  const xp = profile.xp_total || 0
  const streak = profile.streak_atual || 0

  return (
    <div className={cn('relative', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-b-3xl" />

      {/* Settings button */}
      <div className="absolute top-4 right-4 z-10">
        <Link href="/configuracoes">
          <Button variant="ghost" size="icon" className="rounded-full bg-background/50 backdrop-blur">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="relative pt-8 pb-6 px-6 flex flex-col items-center">
        {/* Profile photo */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-muted border-4 border-background shadow-xl overflow-hidden">
            {profile.foto_url && !imageError ? (
              <img
                src={profile.foto_url}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/20">
                <span className="text-3xl font-bold text-primary">{initials}</span>
              </div>
            )}
          </div>

          {/* Edit photo button */}
          {onEditPhoto && (
            <button
              onClick={onEditPhoto}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background"
            >
              <Camera className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Name */}
        <h1 className="mt-4 text-2xl font-bold">{fullName}</h1>

        {/* Level badge */}
        <div className="mt-2 flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center gap-1.5">
            <Award className="h-4 w-4" />
            <span>Nível {nivel}</span>
            <span className="mx-1">•</span>
            <span>{titulo}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-orange-500">
            <Flame className="h-4 w-4" />
            <span className="font-semibold">{streak}</span>
            <span className="text-muted-foreground">dias</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-500">
            <Star className="h-4 w-4" />
            <span className="font-semibold">{xp.toLocaleString()}</span>
            <span className="text-muted-foreground">XP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
