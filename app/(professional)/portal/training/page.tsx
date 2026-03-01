"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Users,
  Calendar,
  Target,
  Dumbbell,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

interface TrainingProgram {
  id: string
  name: string
  description?: string
  goal?: string
  difficulty?: string
  duration_weeks: number
  days_per_week: number
  session_duration: number
  equipment_needed: string[]
  is_template: boolean
  is_active: boolean
  starts_at?: string
  ends_at?: string
  client_id?: string
  client?: Client
  created_at: string
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Força',
  endurance: 'Resistência',
  weight_loss: 'Emagrecimento',
  functional: 'Funcional',
  custom: 'Personalizado'
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado'
}

export default function TrainingPage() {
  const router = useRouter()
  const { isTrainer, loading: professionalLoading } = useProfessional()
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'templates' | 'assigned'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalLoading && !isTrainer) {
      router.push('/portal')
    }
  }, [isTrainer, professionalLoading, router])

  useEffect(() => {
    fetchPrograms()
    fetchClients()
  }, [])

  async function fetchPrograms() {
    try {
      const response = await fetch('/api/portal/training-programs')
      const data = await response.json()
      if (data.success) {
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Erro ao buscar programas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchClients() {
    try {
      const response = await fetch('/api/professional/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  async function deleteProgram(programId: string) {
    try {
      const response = await fetch(`/api/portal/training-programs?id=${programId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setPrograms(programs.filter(p => p.id !== programId))
        setShowDeleteModal(null)
      }
    } catch (error) {
      console.error('Erro ao deletar programa:', error)
    }
  }

  async function duplicateProgram(program: TrainingProgram) {
    try {
      const response = await fetch('/api/portal/training-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${program.name} (Cópia)`,
          description: program.description,
          goal: program.goal,
          difficulty: program.difficulty,
          durationWeeks: program.duration_weeks,
          daysPerWeek: program.days_per_week,
          sessionDuration: program.session_duration,
          equipmentNeeded: program.equipment_needed,
          isTemplate: false // Cópia é um programa normal, não template
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchPrograms()
      }
    } catch (error) {
      console.error('Erro ao duplicar programa:', error)
    }
    setActionMenuOpen(null)
  }

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.client?.nome?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === 'templates') return matchesSearch && program.is_template
    if (filterType === 'assigned') return matchesSearch && !program.is_template && program.client_id
    return matchesSearch
  })

  const templates = programs.filter(p => p.is_template)
  const assignedPrograms = programs.filter(p => !p.is_template && p.client_id)

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (!isTrainer) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programas de Treino</h1>
          <p className="text-foreground-secondary">Crie e gerencie programas de treino para seus clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Programa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{programs.length}</p>
              <p className="text-sm text-foreground-secondary">Total de Programas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dourado/10 flex items-center justify-center">
              <Copy className="w-5 h-5 text-dourado" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{templates.length}</p>
              <p className="text-sm text-foreground-secondary">Templates</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{assignedPrograms.length}</p>
              <p className="text-sm text-foreground-secondary">Atribuídos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder="Buscar programas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-dourado text-white'
                : 'bg-white text-foreground-secondary border border-border hover:bg-background-elevated'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'templates'
                ? 'bg-dourado text-white'
                : 'bg-white text-foreground-secondary border border-border hover:bg-background-elevated'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setFilterType('assigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'assigned'
                ? 'bg-dourado text-white'
                : 'bg-white text-foreground-secondary border border-border hover:bg-background-elevated'
            }`}
          >
            Atribuídos
          </button>
        </div>
      </div>

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Dumbbell className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum programa encontrado</h3>
          <p className="text-foreground-secondary mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece criando seu primeiro programa de treino'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Programa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-xl border border-border overflow-hidden hover:border-dourado/40 transition-colors flex flex-col"
            >
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{program.name}</h3>
                      {program.is_template && (
                        <span className="px-2 py-0.5 text-xs bg-dourado/20 text-dourado rounded-full">
                          Template
                        </span>
                      )}
                    </div>
                    <p className="text-sm flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {program.client ? (
                        <span className="text-blue-600 font-medium">{program.client.nome}</span>
                      ) : program.is_template ? (
                        <span className="text-foreground-muted">Template reutilizável</span>
                      ) : (
                        <span className="text-orange-500">Sem cliente atribuído</span>
                      )}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === program.id ? null : program.id)}
                      className="p-1 hover:bg-background-elevated rounded"
                    >
                      <MoreVertical className="w-5 h-5 text-foreground-secondary" />
                    </button>
                    {actionMenuOpen === program.id && (
                      <div className="absolute right-0 top-8 bg-white border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                        <Link
                          href={`/portal/training/${program.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-elevated"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </Link>
                        <button
                          onClick={() => duplicateProgram(program)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-elevated"
                        >
                          <Copy className="w-4 h-4" /> Duplicar
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(program.id)
                            setActionMenuOpen(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-background-elevated"
                        >
                          <Trash2 className="w-4 h-4" /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {program.description && (
                  <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">{program.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {program.goal && (
                    <span className="px-2 py-1 text-xs bg-background-elevated text-foreground rounded-lg flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {GOAL_LABELS[program.goal] || program.goal}
                    </span>
                  )}
                  {program.difficulty && (
                    <span className={`px-2 py-1 text-xs rounded-lg flex items-center gap-1 ${
                      program.difficulty === 'beginner' ? 'bg-green-50 text-green-600' :
                      program.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      <Zap className="w-3 h-3" />
                      {DIFFICULTY_LABELS[program.difficulty] || program.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 text-xs text-foreground-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {program.duration_weeks} semanas
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    {program.days_per_week}x/semana
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {program.session_duration}min
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 bg-background-elevated border-t border-border">
                <Link
                  href={`/portal/training/${program.id}`}
                  className="flex items-center justify-between text-sm text-dourado hover:text-dourado/80"
                >
                  <span>Ver detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateProgramModal
          clients={clients}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-border max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir Programa</h3>
                <p className="text-sm text-foreground-secondary">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-foreground mb-6">
              Tem certeza que deseja excluir este programa de treino? Todos os dados serão perdidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteProgram(showDeleteModal)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Create Program Modal Component
function CreateProgramModal({
  clients,
  onClose
}: {
  clients: Client[]
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    goal: 'hypertrophy',
    difficulty: 'intermediate',
    durationWeeks: '4',
    daysPerWeek: '4',
    sessionDuration: '60',
    isTemplate: false
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/portal/training-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          clientId: formData.clientId || null,
          goal: formData.goal,
          difficulty: formData.difficulty,
          durationWeeks: parseInt(formData.durationWeeks),
          daysPerWeek: parseInt(formData.daysPerWeek),
          sessionDuration: parseInt(formData.sessionDuration),
          isTemplate: formData.isTemplate
        })
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/portal/training/${data.program.id}`)
      }
    } catch (error) {
      console.error('Erro ao criar programa:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-border max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Novo Programa de Treino</h2>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome do Programa *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Treino de Hipertrofia ABC"
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo e características do programa..."
                rows={2}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Objetivo
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                >
                  <option value="hypertrophy">Hipertrofia</option>
                  <option value="strength">Força</option>
                  <option value="endurance">Resistência</option>
                  <option value="weight_loss">Emagrecimento</option>
                  <option value="functional">Funcional</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Dificuldade
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Duração (semanas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Dias por Semana
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.daysPerWeek}
                  onChange={(e) => setFormData({ ...formData, daysPerWeek: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={formData.sessionDuration}
                  onChange={(e) => setFormData({ ...formData, sessionDuration: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                />
              </div>
            </div>
          </div>

          {/* Client or Template */}
          <div className="p-4 bg-background-elevated rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTemplate}
                onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked, clientId: '' })}
                className="w-5 h-5 rounded border-border text-dourado focus:ring-dourado/50 bg-white"
              />
              <div>
                <span className="text-foreground font-medium">Salvar como Template</span>
                <p className="text-sm text-foreground-secondary">Templates podem ser reutilizados para vários clientes</p>
              </div>
            </label>

            {!formData.isTemplate && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Atribuir a Cliente
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                >
                  <option value="">Selecione um cliente (opcional)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Criar e Configurar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
