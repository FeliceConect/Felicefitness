'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trophy, Ruler, Target, Camera, X, Check, ImageIcon, History, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileHeader, ProfileStats, ProfilePhotoUpload } from '@/components/profile'
import { useProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Lista de objetivos predefinidos
const OBJECTIVES = [
  { id: 'ski_suica', title: 'Preparação para Esqui', icon: '🎿', defaultDate: '2026-03-12' },
  { id: 'maratona', title: 'Maratona', icon: '🏃', defaultDate: '' },
  { id: 'hipertrofia', title: 'Ganho de Massa', icon: '💪', defaultDate: '' },
  { id: 'emagrecimento', title: 'Emagrecimento', icon: '⚖️', defaultDate: '' },
  { id: 'saude', title: 'Saúde e Bem-estar', icon: '❤️', defaultDate: '' },
  { id: 'competicao', title: 'Competição', icon: '🏆', defaultDate: '' },
  { id: 'viagem', title: 'Viagem/Evento', icon: '✈️', defaultDate: '' },
  { id: 'outro', title: 'Outro', icon: '🎯', defaultDate: '' },
]

interface BodyCompositionData {
  gordura: number | null
  musculo: number | null
}

export default function PerfilPage() {
  const router = useRouter()
  const { profile, stats, loading, updatePhoto, updateProfile } = useProfile()
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showObjectiveEditor, setShowObjectiveEditor] = useState(false)
  const [editingObjective, setEditingObjective] = useState({
    id: '',
    titulo: '',
    data: ''
  })
  const [savingObjective, setSavingObjective] = useState(false)
  const [bodyComposition, setBodyComposition] = useState<BodyCompositionData>({ gordura: null, musculo: null })

  // Fetch latest body composition data
  useEffect(() => {
    async function fetchBodyComposition() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_body_compositions')
        .select('percentual_gordura, massa_muscular_esqueletica_kg')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setBodyComposition({
          gordura: data.percentual_gordura,
          musculo: data.massa_muscular_esqueletica_kg
        })
      }
    }

    fetchBodyComposition()
  }, [])

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

  // Get body data from profile (fields from database are altura_cm, peso_atual)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileData = profile as any
  const bodyData = {
    altura: profileData.altura_cm || null,
    peso: profileData.peso_atual || null,
    pesoMeta: profileData.meta_peso || null,
    gordura: bodyComposition.gordura,
    musculo: bodyComposition.musculo
  }

  // Get objective from profile - stored as JSON string: "id|titulo|data"
  // Or just the ID for backward compatibility
  const parseObjective = () => {
    const obj = profileData.objetivo || 'ski_suica'
    if (obj.includes('|')) {
      const [id, titulo, data] = obj.split('|')
      return { id, titulo, data }
    }
    // Old format - just ID
    const found = OBJECTIVES.find(o => o.id === obj)
    return {
      id: obj,
      titulo: found?.title || 'Preparação para Esqui',
      data: found?.defaultDate || '2026-03-12'
    }
  }

  const parsedObjective = parseObjective()
  const currentObjective = OBJECTIVES.find(o => o.id === parsedObjective.id) || OBJECTIVES[0]
  const objectiveDate = parsedObjective.data || currentObjective.defaultDate || '2026-03-12'
  const objectiveTitle = parsedObjective.titulo || currentObjective.title

  const objective = {
    id: parsedObjective.id,
    title: objectiveTitle,
    icon: currentObjective.icon,
    date: objectiveDate ? format(new Date(objectiveDate), "d MMM yyyy", { locale: ptBR }) : '',
    daysLeft: objectiveDate ? Math.ceil((new Date(objectiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  }

  // Calculate progress based on days passed since start of year
  const startDate = new Date('2025-01-01')
  const endDate = new Date(objectiveDate)
  const today = new Date()
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)))

  const handleEditObjective = () => {
    setEditingObjective({
      id: parsedObjective.id,
      titulo: parsedObjective.titulo,
      data: parsedObjective.data
    })
    setShowObjectiveEditor(true)
  }

  const handleSaveObjective = async () => {
    setSavingObjective(true)
    try {
      // Store as "id|titulo|data" format
      const objetivoStr = `${editingObjective.id}|${editingObjective.titulo}|${editingObjective.data}`
      await updateProfile({
        objetivo: objetivoStr
      } as Record<string, string>)
      setShowObjectiveEditor(false)
    } catch (error) {
      console.error('Erro ao salvar objetivo:', error)
    } finally {
      setSavingObjective(false)
    }
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
                  <p className="text-lg font-semibold">{bodyData.altura ? `${bodyData.altura} cm` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso atual</p>
                  <p className="text-lg font-semibold">{bodyData.peso ? `${bodyData.peso} kg` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="text-lg font-semibold">{bodyData.pesoMeta ? `${bodyData.pesoMeta} kg` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">% Gordura</p>
                  <p className="text-lg font-semibold">{bodyData.gordura !== null ? `${bodyData.gordura}%` : '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Massa muscular</p>
                  <p className="text-lg font-semibold">{bodyData.musculo !== null ? `${bodyData.musculo} kg` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objective */}
        <div className="px-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivo Principal
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditObjective}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {objective.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{objective.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {objective.date} • {objective.daysLeft > 0 ? `${objective.daysLeft} dias restantes` : 'Data passada'}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
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
        <div className="px-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <Link href="/fotos">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <ImageIcon className="h-5 w-5" />
                <span>Ver Fotos</span>
              </Button>
            </Link>
            <Link href="/relatorios/evolucao">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <History className="h-5 w-5" />
                <span>Evolução</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/formularios">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <ClipboardList className="h-5 w-5" />
                <span>Formulários</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Photo Upload Dialog */}
      <ProfilePhotoUpload
        open={showPhotoUpload}
        onOpenChange={setShowPhotoUpload}
        currentPhoto={profile.foto_url}
        onUpload={updatePhoto}
      />

      {/* Objective Editor Modal */}
      <AnimatePresence>
        {showObjectiveEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center"
            onClick={() => setShowObjectiveEditor(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-background rounded-t-3xl max-h-[90vh] flex flex-col"
            >
              {/* Handle */}
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3 mb-4 flex-shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold">Editar Objetivo</h2>
                <button
                  onClick={() => setShowObjectiveEditor(false)}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                {/* Objective Type Selection */}
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-3 block">Tipo de Objetivo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJECTIVES.map((obj) => (
                      <button
                        key={obj.id}
                        onClick={() => {
                          setEditingObjective(prev => ({
                            ...prev,
                            id: obj.id,
                            titulo: obj.title,
                            data: prev.data || obj.defaultDate
                          }))
                        }}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          editingObjective.id === obj.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl">{obj.icon}</span>
                        <span className="text-sm font-medium text-left">{obj.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Title */}
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-2 block">Título Personalizado</label>
                  <input
                    type="text"
                    value={editingObjective.titulo}
                    onChange={(e) => setEditingObjective(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Viagem para Suíça"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Target Date */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">Data Alvo</label>
                  <input
                    type="date"
                    value={editingObjective.data}
                    onChange={(e) => setEditingObjective(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Actions - Fixed at bottom */}
              <div className="flex gap-3 p-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom)+80px)] border-t border-border bg-background flex-shrink-0">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowObjectiveEditor(false)}
                  disabled={savingObjective}
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleSaveObjective}
                  disabled={savingObjective}
                >
                  {savingObjective ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
