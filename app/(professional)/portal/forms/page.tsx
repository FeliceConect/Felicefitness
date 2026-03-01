"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Send,
  Search,
  FileText,
  Users,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Eye,
  Loader2,
  Plus
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import {
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS,
  FORM_TYPE_LABELS,
  type FormAssignmentStatus
} from '@/types/forms'

interface Template {
  id: string
  name: string
  description: string | null
  specialty: string
  form_type: string
  is_system_template: boolean
  questions: { count: number }[]
}

interface Assignment {
  id: string
  template_id: string
  status: FormAssignmentStatus
  due_date: string | null
  sent_at: string
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  template: {
    id: string
    name: string
    description: string | null
    specialty: string
    form_type: string
  }
  client: {
    id: string
    nome: string
    email: string
  }
}

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

export default function FormsPage() {
  const router = useRouter()
  const { isProfessional, isNutritionist, loading: professionalLoading } = useProfessional()
  const [activeTab, setActiveTab] = useState<'templates' | 'sent'>('templates')
  const [templates, setTemplates] = useState<{ system: Template[]; custom: Template[] }>({ system: [], custom: [] })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FormAssignmentStatus>('all')

  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [sendDueDate, setSendDueDate] = useState('')
  const [sendNotes, setSendNotes] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!professionalLoading && !isProfessional) {
      router.push('/portal')
    }
  }, [isProfessional, professionalLoading, router])

  useEffect(() => {
    if (isProfessional) {
      fetchTemplates()
      fetchAssignments()
      fetchClients()
    }
  }, [isProfessional])

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/portal/forms/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data || { system: [], custom: [] })
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAssignments() {
    try {
      const response = await fetch('/api/portal/forms/assignments')
      const data = await response.json()
      if (data.success) {
        setAssignments(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar envios:', error)
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

  function openSendModal(template: Template) {
    setSelectedTemplate(template)
    setSelectedClientIds([])
    setSendDueDate('')
    setSendNotes('')
    setShowSendModal(true)
  }

  async function handleSendForm() {
    if (!selectedTemplate || selectedClientIds.length === 0) return

    setSending(true)
    try {
      const response = await fetch('/api/portal/forms/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientIds: selectedClientIds,
          dueDate: sendDueDate || null,
          notes: sendNotes || null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowSendModal(false)
        setActiveTab('sent')
        fetchAssignments()
      } else {
        alert(data.error || 'Erro ao enviar formulário')
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
      alert('Erro ao enviar formulário')
    } finally {
      setSending(false)
    }
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  function getQuestionCount(template: Template): number {
    if (template.questions && template.questions.length > 0) {
      return template.questions[0].count || 0
    }
    return 0
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const allTemplates = [...templates.system, ...templates.custom]

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch =
      a.template?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.client?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = assignments.filter(a => a.status === 'pending').length
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length
  const completedCount = assignments.filter(a => a.status === 'completed').length

  const gradientClass = isNutritionist
    ? 'from-green-500 to-emerald-600'
    : 'from-orange-500 to-red-600'
  const gradientHoverClass = isNutritionist
    ? 'hover:from-green-600 hover:to-emerald-700'
    : 'hover:from-orange-600 hover:to-red-700'

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!isProfessional) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Formulários</h1>
          <p className="text-slate-400">Envie formulários pré-consulta para seus pacientes</p>
        </div>
        <button
          onClick={() => router.push('/portal/forms/create')}
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${gradientClass} text-white rounded-lg ${gradientHoverClass} transition-all text-sm font-medium`}
        >
          <Plus className="w-4 h-4" />
          Novo Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{allTemplates.length}</p>
              <p className="text-sm text-slate-400">Templates</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-sm text-slate-400">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{inProgressCount}</p>
              <p className="text-sm text-slate-400">Em Preenchimento</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedCount}</p>
              <p className="text-sm text-slate-400">Preenchidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        <button
          onClick={() => { setActiveTab('templates'); setSearchTerm(''); setStatusFilter('all') }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
            activeTab === 'templates'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Templates Disponíveis
        </button>
        <button
          onClick={() => { setActiveTab('sent'); setSearchTerm(''); setStatusFilter('all') }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
            activeTab === 'sent'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Formulários Enviados
          {assignments.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
              {assignments.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'templates' ? 'Buscar templates...' : 'Buscar por formulário ou paciente...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>
        {activeTab === 'sent' && (
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'in_progress', 'completed', 'expired'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s === 'all' ? 'Todos' : FORM_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <>
          {/* System Templates */}
          {templates.system.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-violet-400" />
                Templates do Sistema
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.system
                  .filter(t =>
                    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      gradientClass={gradientClass}
                      gradientHoverClass={gradientHoverClass}
                      questionCount={getQuestionCount(template)}
                      onSend={() => openSendModal(template)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Custom Templates */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Meus Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.custom
                .filter(t =>
                  t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    gradientClass={gradientClass}
                    gradientHoverClass={gradientHoverClass}
                    questionCount={getQuestionCount(template)}
                    onSend={() => openSendModal(template)}
                  />
                ))}

              {/* Create new template card */}
              <button
                onClick={() => router.push('/portal/forms/create')}
                className="bg-slate-800 rounded-xl border-2 border-dashed border-slate-700 p-4 hover:border-slate-500 transition-colors flex flex-col items-center justify-center gap-3 min-h-[160px]"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-sm text-slate-400 font-medium">Criar Novo Template</span>
              </button>
            </div>
          </div>

          {/* Empty state */}
          {allTemplates.length === 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum template disponível</h3>
              <p className="text-slate-400">
                Os templates do sistema precisam ser inicializados pelo administrador.
              </p>
            </div>
          )}
        </>
      )}

      {/* Sent Tab */}
      {activeTab === 'sent' && (
        <>
          {filteredAssignments.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
              <Send className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'Nenhum formulário encontrado'
                  : 'Nenhum formulário enviado'}
              </h3>
              <p className="text-slate-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente buscar com outros termos ou filtros'
                  : 'Envie formulários na aba "Templates Disponíveis"'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {assignment.template?.name || 'Formulário'}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${FORM_STATUS_COLORS[assignment.status]}`}>
                          {FORM_STATUS_LABELS[assignment.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {assignment.client?.nome || 'Cliente'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          Enviado {formatDate(assignment.sent_at || assignment.created_at)}
                        </span>
                        {assignment.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Prazo: {formatDate(assignment.due_date)}
                          </span>
                        )}
                        {assignment.completed_at && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Preenchido {formatDateTime(assignment.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.status === 'completed' && (
                      <button
                        onClick={() => router.push(`/portal/forms/${assignment.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-violet-400 rounded-lg hover:bg-slate-600 transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Respostas
                      </button>
                    )}
                    {assignment.status !== 'completed' && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        Aguardando
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Send Modal */}
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Enviar Formulário</h2>
                <p className="text-sm text-slate-400">{selectedTemplate.name}</p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Selecionar Clientes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selecione os pacientes *
                </label>
                {clients.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    Nenhum paciente encontrado. Adicione pacientes na aba Clientes.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {clients.map((client) => (
                      <label
                        key={client.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedClientIds.includes(client.id)
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClientIds.includes(client.id)}
                          onChange={() => toggleClient(client.id)}
                          className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500 bg-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{client.nome}</p>
                          <p className="text-xs text-slate-400 truncate">{client.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedClientIds.length > 0 && (
                  <p className="text-xs text-violet-400 mt-2">
                    {selectedClientIds.length} paciente(s) selecionado(s)
                  </p>
                )}
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Prazo para preenchimento (opcional)
                </label>
                <input
                  type="date"
                  value={sendDueDate}
                  onChange={(e) => setSendDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Mensagem para o paciente (opcional)
                </label>
                <textarea
                  value={sendNotes}
                  onChange={(e) => setSendNotes(e.target.value)}
                  placeholder="Ex: Por favor preencha antes da nossa consulta de quinta-feira..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendForm}
                  disabled={sending || selectedClientIds.length === 0}
                  className={`flex-1 px-4 py-2 bg-gradient-to-r ${gradientClass} text-white rounded-lg ${gradientHoverClass} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Template Card Component
function TemplateCard({
  template,
  gradientClass,
  gradientHoverClass,
  questionCount,
  onSend,
}: {
  template: Template
  gradientClass: string
  gradientHoverClass: string
  questionCount: number
  onSend: () => void
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {template.is_system_template && (
                <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded-full">
                  Sistema
                </span>
              )}
              <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
                {FORM_TYPE_LABELS[template.form_type as keyof typeof FORM_TYPE_LABELS] || template.form_type}
              </span>
            </div>
          </div>
        </div>

        {template.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {questionCount} perguntas
          </span>
        </div>

        <button
          onClick={onSend}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${gradientClass} text-white rounded-lg ${gradientHoverClass} transition-all text-sm font-medium`}
        >
          <Send className="w-4 h-4" />
          Enviar para Paciente
        </button>
      </div>
    </div>
  )
}
