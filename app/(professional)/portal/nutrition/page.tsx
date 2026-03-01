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
  Flame,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  FileText,
  FileUp
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

interface MealPlan {
  id: string
  name: string
  description?: string
  goal?: string
  calories_target?: number
  protein_target?: number
  carbs_target?: number
  fat_target?: number
  duration_weeks: number
  is_template: boolean
  is_active: boolean
  starts_at?: string
  ends_at?: string
  client_id?: string
  client?: Client
  created_at: string
}

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Emagrecimento',
  muscle_gain: 'Ganho de Massa',
  maintenance: 'Manutenção',
  health: 'Saúde',
  custom: 'Personalizado'
}

export default function NutritionPage() {
  const router = useRouter()
  const { isNutritionist, loading: professionalLoading } = useProfessional()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'templates' | 'assigned'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalLoading && !isNutritionist) {
      router.push('/portal')
    }
  }, [isNutritionist, professionalLoading, router])

  useEffect(() => {
    fetchPlans()
    fetchClients()
  }, [])

  async function fetchPlans() {
    try {
      const response = await fetch('/api/portal/meal-plans')
      const data = await response.json()
      if (data.success) {
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
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

  async function deletePlan(planId: string) {
    try {
      const response = await fetch(`/api/portal/meal-plans?id=${planId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setPlans(plans.filter(p => p.id !== planId))
        setShowDeleteModal(null)
      }
    } catch (error) {
      console.error('Erro ao deletar plano:', error)
    }
  }

  async function duplicatePlan(plan: MealPlan) {
    try {
      const response = await fetch('/api/portal/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${plan.name} (Cópia)`,
          description: plan.description,
          goal: plan.goal,
          caloriesTarget: plan.calories_target,
          proteinTarget: plan.protein_target,
          carbsTarget: plan.carbs_target,
          fatTarget: plan.fat_target,
          durationWeeks: plan.duration_weeks,
          isTemplate: true
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Erro ao duplicar plano:', error)
    }
    setActionMenuOpen(null)
  }

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.client?.nome?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === 'templates') return matchesSearch && plan.is_template
    if (filterType === 'assigned') return matchesSearch && !plan.is_template && plan.client_id
    return matchesSearch
  })

  const templates = plans.filter(p => p.is_template)
  const assignedPlans = plans.filter(p => !p.is_template && p.client_id)

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (!isNutritionist) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos Alimentares</h1>
          <p className="text-foreground-secondary">Crie e gerencie planos alimentares para seus clientes</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal/nutrition/import"
            className="flex items-center gap-2 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-all border border-border"
          >
            <FileUp className="w-5 h-5" />
            Importar
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Plano
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plans.length}</p>
              <p className="text-sm text-foreground-secondary">Total de Planos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dourado/20 flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{assignedPlans.length}</p>
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
            placeholder="Buscar planos..."
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

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum plano encontrado</h3>
          <p className="text-foreground-secondary mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece criando seu primeiro plano alimentar'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Plano
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-border overflow-hidden hover:border-dourado/50 hover:shadow-md transition-all flex flex-col"
            >
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{plan.name}</h3>
                      {plan.is_template && (
                        <span className="px-2 py-0.5 text-xs bg-dourado/20 text-dourado rounded-full">
                          Template
                        </span>
                      )}
                    </div>
                    <p className="text-sm flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {plan.client ? (
                        <span className="text-green-600 font-medium">{plan.client.nome}</span>
                      ) : plan.is_template ? (
                        <span className="text-foreground-muted">Template reutilizável</span>
                      ) : (
                        <span className="text-orange-500">Sem cliente atribuído</span>
                      )}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === plan.id ? null : plan.id)}
                      className="p-1 hover:bg-background-elevated rounded"
                    >
                      <MoreVertical className="w-5 h-5 text-foreground-muted" />
                    </button>
                    {actionMenuOpen === plan.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-border py-1 z-10 min-w-[140px]">
                        <Link
                          href={`/portal/nutrition/${plan.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-elevated"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </Link>
                        <button
                          onClick={() => duplicatePlan(plan)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-elevated"
                        >
                          <Copy className="w-4 h-4" /> Duplicar
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(plan.id)
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

                {plan.description && (
                  <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">{plan.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {plan.goal && (
                    <span className="px-2 py-1 text-xs bg-background-elevated text-foreground-secondary rounded-lg flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {GOAL_LABELS[plan.goal] || plan.goal}
                    </span>
                  )}
                  {plan.calories_target && (
                    <span className="px-2 py-1 text-xs bg-orange-500/10 text-orange-600 rounded-lg flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {plan.calories_target} kcal
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs bg-background-elevated text-foreground-secondary rounded-lg flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {plan.duration_weeks} semanas
                  </span>
                </div>

                {/* Macros */}
                {(plan.protein_target || plan.carbs_target || plan.fat_target) && (
                  <div className="flex gap-3 text-xs text-foreground-muted">
                    {plan.protein_target && (
                      <span>P: {plan.protein_target}g</span>
                    )}
                    {plan.carbs_target && (
                      <span>C: {plan.carbs_target}g</span>
                    )}
                    {plan.fat_target && (
                      <span>G: {plan.fat_target}g</span>
                    )}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-background-elevated border-t border-border">
                <Link
                  href={`/portal/nutrition/${plan.id}`}
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
        <CreatePlanModal
          clients={clients}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir Plano</h3>
                <p className="text-sm text-foreground-secondary">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-foreground-secondary mb-6">
              Tem certeza que deseja excluir este plano alimentar? Todos os dados serão perdidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deletePlan(showDeleteModal)}
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

// Create Plan Modal Component
function CreatePlanModal({
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
    goal: 'health',
    caloriesTarget: '',
    proteinTarget: '',
    carbsTarget: '',
    fatTarget: '',
    fiberTarget: '',
    waterTarget: '',
    durationWeeks: '4',
    isTemplate: false
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/portal/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          clientId: formData.clientId || null,
          goal: formData.goal,
          caloriesTarget: formData.caloriesTarget ? parseInt(formData.caloriesTarget) : null,
          proteinTarget: formData.proteinTarget ? parseInt(formData.proteinTarget) : null,
          carbsTarget: formData.carbsTarget ? parseInt(formData.carbsTarget) : null,
          fatTarget: formData.fatTarget ? parseInt(formData.fatTarget) : null,
          fiberTarget: formData.fiberTarget ? parseInt(formData.fiberTarget) : null,
          waterTarget: formData.waterTarget ? parseInt(formData.waterTarget) : null,
          durationWeeks: parseInt(formData.durationWeeks),
          isTemplate: formData.isTemplate
        })
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/portal/nutrition/${data.plan.id}`)
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full my-8 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Novo Plano Alimentar</h2>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nome do Plano *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Plano de Emagrecimento"
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
              placeholder="Descreva o objetivo e características do plano..."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Objetivo
              </label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
              >
                <option value="weight_loss">Emagrecimento</option>
                <option value="muscle_gain">Ganho de Massa</option>
                <option value="maintenance">Manutenção</option>
                <option value="health">Saúde</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

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
          </div>

          {/* Client or Template */}
          <div className="p-3 bg-background-elevated rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTemplate}
                onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked, clientId: '' })}
                className="w-5 h-5 rounded border-border text-dourado focus:ring-dourado/50"
              />
              <div>
                <span className="text-foreground font-medium">Salvar como Template</span>
                <p className="text-sm text-foreground-secondary">Templates podem ser reutilizados para vários clientes</p>
              </div>
            </label>

            {!formData.isTemplate && (
              <div className="mt-3">
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

          {/* Macros */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Metas Nutricionais (opcional)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Calorias</label>
                <input
                  type="number"
                  value={formData.caloriesTarget}
                  onChange={(e) => setFormData({ ...formData, caloriesTarget: e.target.value })}
                  placeholder="2000"
                  className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Proteína (g)</label>
                <input
                  type="number"
                  value={formData.proteinTarget}
                  onChange={(e) => setFormData({ ...formData, proteinTarget: e.target.value })}
                  placeholder="150"
                  className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Carbos (g)</label>
                <input
                  type="number"
                  value={formData.carbsTarget}
                  onChange={(e) => setFormData({ ...formData, carbsTarget: e.target.value })}
                  placeholder="200"
                  className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Gorduras (g)</label>
                <input
                  type="number"
                  value={formData.fatTarget}
                  onChange={(e) => setFormData({ ...formData, fatTarget: e.target.value })}
                  placeholder="60"
                  className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Fibras (g)</label>
                <input
                  type="number"
                  value={formData.fiberTarget}
                  onChange={(e) => setFormData({ ...formData, fiberTarget: e.target.value })}
                  placeholder="25"
                  className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Água (ml)</label>
                <input
                  type="number"
                  value={formData.waterTarget}
                  onChange={(e) => setFormData({ ...formData, waterTarget: e.target.value })}
                  placeholder="2500"
                  className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Actions - fixed at bottom */}
        <div className="flex gap-3 p-5 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              const form = (e.target as HTMLElement).closest('.bg-white')?.querySelector('form')
              form?.requestSubmit()
            }}
            disabled={saving || !formData.name.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </div>
    </div>
  )
}
