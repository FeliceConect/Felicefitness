"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, MoreVertical, Copy, Trash2, Edit, Loader2, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWorkoutTemplates } from '@/hooks/use-workout-templates'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const diasSemanaFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const tipoIcons: Record<string, string> = {
  tradicional: '🏋️',
  circuito: '🔄',
  hiit: '🔥',
  mobilidade: '🧘'
}

const tipoLabels: Record<string, string> = {
  tradicional: 'Tradicional',
  circuito: 'Circuito',
  hiit: 'HIIT',
  mobilidade: 'Mobilidade'
}

const tipoColors: Record<string, string> = {
  tradicional: 'text-violet-400',
  circuito: 'text-cyan-400',
  hiit: 'text-red-400',
  mobilidade: 'text-emerald-400'
}

export default function WorkoutTemplatesPage() {
  const router = useRouter()
  const { templates, loading, deleteTemplate, duplicateTemplate } = useWorkoutTemplates()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteTemplate(deleteId)
    } catch (error) {
      console.error('Erro ao deletar template:', error)
    } finally {
      setDeleteId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setDuplicating(id)
    try {
      const newTemplate = await duplicateTemplate(id)
      router.push(`/treino/templates/${newTemplate.id}`)
    } catch (error) {
      console.error('Erro ao duplicar template:', error)
    } finally {
      setDuplicating(null)
    }
  }

  // Group templates by day
  const templatesByDay = templates.reduce((acc, template) => {
    const day = template.dia_semana
    if (!acc[day]) acc[day] = []
    acc[day].push(template)
    return acc
  }, {} as Record<number, typeof templates>)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Treinos</h1>
            <p className="text-slate-400 text-sm mt-1">
              {templates.length} template{templates.length !== 1 ? 's' : ''} cadastrado{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/treino/templates/novo">
            <Button variant="gradient" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Treino
            </Button>
          </Link>
        </div>
      </div>

      {/* Templates List */}
      <div className="px-4">
        {templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-8 text-center"
          >
            <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum treino cadastrado
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Crie seu primeiro template de treino para começar a treinar!
            </p>
            <Link href="/treino/templates/novo">
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Treino
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Week overview */}
            <div className="flex justify-between gap-1 bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3">
              {diasSemana.map((dia, index) => {
                const hasTemplate = templatesByDay[index]?.length > 0
                return (
                  <div
                    key={dia}
                    className={cn(
                      'flex-1 text-center py-2 rounded-lg text-sm font-medium',
                      hasTemplate
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'text-slate-500'
                    )}
                  >
                    {dia}
                    {hasTemplate && (
                      <div className="text-xs mt-1">
                        {templatesByDay[index].length}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Templates by day */}
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
              const dayTemplates = templatesByDay[dayIndex]
              if (!dayTemplates || dayTemplates.length === 0) return null

              return (
                <div key={dayIndex}>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    {diasSemanaFull[dayIndex]}
                  </h3>
                  <div className="space-y-3">
                    {dayTemplates.map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 hover:border-violet-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/treino/templates/${template.id}`}
                            className="flex-1"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {tipoIcons[template.tipo] || '🏋️'}
                              </span>
                              <div>
                                <h4 className="text-white font-medium">
                                  {template.nome}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-sm">
                                  <span className={cn('uppercase text-xs font-medium', tipoColors[template.tipo])}>
                                    {tipoLabels[template.tipo]}
                                  </span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-400">
                                    {template.duracao_estimada} min
                                  </span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-400">
                                    {template.exercicios.length} exercício{template.exercicios.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/treino/templates/${template.id}`)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(template.id)}
                                disabled={duplicating === template.id}
                              >
                                {duplicating === template.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Copy className="w-4 h-4 mr-2" />
                                )}
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(template.id)}
                                className="text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Exercise preview */}
                        {template.exercicios.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#2E2E3E]">
                            <div className="flex flex-wrap gap-2">
                              {template.exercicios.slice(0, 4).map((ex) => (
                                <span
                                  key={ex.id}
                                  className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded"
                                >
                                  {ex.nome}
                                </span>
                              ))}
                              {template.exercicios.length > 4 && (
                                <span className="text-xs text-slate-500 px-2 py-1">
                                  +{template.exercicios.length - 4} mais
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template de treino será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
