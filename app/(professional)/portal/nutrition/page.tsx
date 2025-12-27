"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
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
  FileText
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
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
          <h1 className="text-2xl font-bold text-white">Planos Alimentares</h1>
          <p className="text-slate-400">Crie e gerencie planos alimentares para seus clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{plans.length}</p>
              <p className="text-sm text-slate-400">Total de Planos</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Copy className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
              <p className="text-sm text-slate-400">Templates</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{assignedPlans.length}</p>
              <p className="text-sm text-slate-400">Atribuídos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar planos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'templates'
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setFilterType('assigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'assigned'
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Atribuídos
          </button>
        </div>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum plano encontrado</h3>
          <p className="text-slate-400 mb-4">
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
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{plan.name}</h3>
                      {plan.is_template && (
                        <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded-full">
                          Template
                        </span>
                      )}
                    </div>
                    {plan.client && (
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {plan.client.nome}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === plan.id ? null : plan.id)}
                      className="p-1 hover:bg-slate-700 rounded"
                    >
                      <MoreVertical className="w-5 h-5 text-slate-400" />
                    </button>
                    {actionMenuOpen === plan.id && (
                      <div className="absolute right-0 top-8 bg-slate-700 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                        <Link
                          href={`/portal/nutrition/${plan.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </Link>
                        <button
                          onClick={() => duplicatePlan(plan)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600"
                        >
                          <Copy className="w-4 h-4" /> Duplicar
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(plan.id)
                            setActionMenuOpen(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-600"
                        >
                          <Trash2 className="w-4 h-4" /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {plan.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{plan.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {plan.goal && (
                    <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {GOAL_LABELS[plan.goal] || plan.goal}
                    </span>
                  )}
                  {plan.calories_target && (
                    <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-lg flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {plan.calories_target} kcal
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {plan.duration_weeks} semanas
                  </span>
                </div>

                {/* Macros */}
                {(plan.protein_target || plan.carbs_target || plan.fat_target) && (
                  <div className="flex gap-3 text-xs text-slate-400">
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

              <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700">
                <Link
                  href={`/portal/nutrition/${plan.id}`}
                  className="flex items-center justify-between text-sm text-violet-400 hover:text-violet-300"
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
          onCreated={() => {
            setShowCreateModal(false)
            fetchPlans()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Excluir Plano</h3>
                <p className="text-sm text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja excluir este plano alimentar? Todos os dados serão perdidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
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
  onClose,
  onCreated
}: {
  clients: Client[]
  onClose: () => void
  onCreated: () => void
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
        // Redirect to edit page to add meals
        router.push(`/portal/nutrition/${data.plan.id}`)
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Novo Plano Alimentar</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nome do Plano *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano de Emagrecimento"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo e características do plano..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Objetivo
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="weight_loss">Emagrecimento</option>
                  <option value="muscle_gain">Ganho de Massa</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="health">Saúde</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Duração (semanas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Client or Template */}
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTemplate}
                onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked, clientId: '' })}
                className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-violet-500 bg-slate-700"
              />
              <div>
                <span className="text-white font-medium">Salvar como Template</span>
                <p className="text-sm text-slate-400">Templates podem ser reutilizados para vários clientes</p>
              </div>
            </label>

            {!formData.isTemplate && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Atribuir a Cliente
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
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
            <h3 className="text-sm font-medium text-slate-300 mb-3">Metas Nutricionais (opcional)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Calorias (kcal)</label>
                <input
                  type="number"
                  value={formData.caloriesTarget}
                  onChange={(e) => setFormData({ ...formData, caloriesTarget: e.target.value })}
                  placeholder="2000"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Proteína (g)</label>
                <input
                  type="number"
                  value={formData.proteinTarget}
                  onChange={(e) => setFormData({ ...formData, proteinTarget: e.target.value })}
                  placeholder="150"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Carboidratos (g)</label>
                <input
                  type="number"
                  value={formData.carbsTarget}
                  onChange={(e) => setFormData({ ...formData, carbsTarget: e.target.value })}
                  placeholder="200"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gorduras (g)</label>
                <input
                  type="number"
                  value={formData.fatTarget}
                  onChange={(e) => setFormData({ ...formData, fatTarget: e.target.value })}
                  placeholder="60"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fibras (g)</label>
                <input
                  type="number"
                  value={formData.fiberTarget}
                  onChange={(e) => setFormData({ ...formData, fiberTarget: e.target.value })}
                  placeholder="25"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Água (ml)</label>
                <input
                  type="number"
                  value={formData.waterTarget}
                  onChange={(e) => setFormData({ ...formData, waterTarget: e.target.value })}
                  placeholder="2500"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
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
        </form>
      </div>
    </div>
  )
}
