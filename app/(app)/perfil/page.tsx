'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trophy, Ruler, Target, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileHeader, ProfileStats, ProfilePhotoUpload } from '@/components/profile'
import { useProfile } from '@/hooks/use-profile'
import Link from 'next/link'

export default function PerfilPage() {
  const router = useRouter()
  const { profile, stats, loading, updatePhoto } = useProfile()
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar perfil</p>
      </div>
    )
  }

  // Mock data for display (would come from actual data)
  const bodyData = {
    altura: 181,
    peso: 81.8,
    pesoMeta: 80.0,
    gordura: 16.5,
    musculo: 38.8
  }

  const objective = {
    title: 'Preparação para Esqui',
    icon: '🎿',
    date: '12 Mar 2026',
    daysLeft: Math.ceil((new Date('2026-03-12').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const recentAchievements = [
    { id: 1, icon: '🔥', name: 'Semana Perfeita' },
    { id: 2, icon: '🏆', name: 'Quebrador de Records' },
    { id: 3, icon: '💧', name: 'Oceano Interior' }
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Perfil</h1>
          <Link href="/configuracoes">
            <Button variant="ghost" size="icon">
              <Edit className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          onEditPhoto={() => setShowPhotoUpload(true)}
        />

        {/* Stats */}
        {stats && (
          <div className="px-4">
            <ProfileStats stats={stats} />
          </div>
        )}

        {/* Body Data */}
        <div className="px-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Dados Físicos
              </CardTitle>
              <Link href="/perfil/editar">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Altura</p>
                  <p className="text-lg font-semibold">{bodyData.altura} cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso atual</p>
                  <p className="text-lg font-semibold">{bodyData.peso} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="text-lg font-semibold">{bodyData.pesoMeta} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">% Gordura</p>
                  <p className="text-lg font-semibold">{bodyData.gordura}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Massa muscular</p>
                  <p className="text-lg font-semibold">{bodyData.musculo} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objective */}
        <div className="px-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivo Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {objective.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{objective.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {objective.date} • {objective.daysLeft} dias restantes
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">68%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        <div className="px-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Conquistas Recentes
              </CardTitle>
              <Link href="/conquistas">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {recentAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex-1 p-3 rounded-lg bg-muted/50 text-center"
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <p className="text-xs font-medium truncate">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="px-4 grid grid-cols-2 gap-3">
          <Link href="/corpo/nova-medicao">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Ruler className="h-5 w-5" />
              <span>Nova Medição</span>
            </Button>
          </Link>
          <Link href="/fotos/nova">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Camera className="h-5 w-5" />
              <span>Foto Progresso</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Photo Upload Dialog */}
      <ProfilePhotoUpload
        open={showPhotoUpload}
        onOpenChange={setShowPhotoUpload}
        currentPhoto={profile.foto_url}
        onUpload={updatePhoto}
      />
    </div>
  )
}
