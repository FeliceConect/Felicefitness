"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  UserCog,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Users,
  X,
  Search,
  Upload,
  Camera
} from 'lucide-react'

interface Professional {
  id: string
  user_id: string
  type: 'nutritionist' | 'trainer'
  registration: string | null
  specialty: string | null
  bio: string | null
  max_clients: number
  display_name: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  clientCount: number
  fitness_profiles: {
    nome: string
    email: string
    avatar_url?: string
  }
}

interface User {
  id: string
  nome: string
  email: string
  role: string | null
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    type: 'trainer' as 'nutritionist' | 'trainer',
    registration: '',
    specialty: '',
    bio: '',
    maxClients: 30,
    displayName: '',
    avatarUrl: ''
  })

  const fetchProfessionals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/admin/professionals?${params}`)
      const data = await response.json()

      if (data.success) {
        setProfessionals(data.professionals || [])
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error)
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true)
    try {
      // Buscar usuários que não são profissionais ainda (exclui quem já está cadastrado como profissional)
      const response = await fetch('/api/admin/users?role=not_admin&excludeProfessionals=true&limit=100')
      const data = await response.json()

      if (data.success) {
        setAvailableUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddProfessional = async () => {
    if (!formData.userId) {
      alert('Selecione um usuário')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchProfessionals()
        setShowAddModal(false)
        resetForm()
      } else {
        alert(data.error || 'Erro ao criar profissional')
      }
    } catch (error) {
      console.error('Erro ao criar profissional:', error)
      alert('Erro ao criar profissional')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfessional = async () => {
    if (!selectedProfessional) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/professionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: selectedProfessional.id,
          registration: formData.registration,
          specialty: formData.specialty,
          bio: formData.bio,
          maxClients: formData.maxClients,
          displayName: formData.displayName,
          avatarUrl: formData.avatarUrl
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchProfessionals()
        setShowEditModal(false)
        setSelectedProfessional(null)
        resetForm()
      } else {
        alert(data.error || 'Erro ao atualizar profissional')
      }
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error)
      alert('Erro ao atualizar profissional')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProfessional = async (professional: Professional) => {
    const displayName = professional.display_name || professional.fitness_profiles?.nome || 'este profissional'
    if (!confirm(`Tem certeza que deseja remover ${displayName} como profissional? Os clientes atribuídos serão desvinculados.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/professionals?id=${professional.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchProfessionals()
      } else {
        alert(data.error || 'Erro ao remover profissional')
      }
    } catch (error) {
      console.error('Erro ao remover profissional:', error)
      alert('Erro ao remover profissional')
    }
  }

  const handleToggleActive = async (professional: Professional) => {
    try {
      const response = await fetch('/api/admin/professionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: professional.id,
          isActive: !professional.is_active
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchProfessionals()
      } else {
        alert(data.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      userId: '',
      type: 'trainer',
      registration: '',
      specialty: '',
      bio: '',
      maxClients: 30,
      displayName: '',
      avatarUrl: ''
    })
    setSearchUser('')
  }

  const openAddModal = () => {
    resetForm()
    fetchAvailableUsers()
    setShowAddModal(true)
  }

  const openEditModal = (professional: Professional) => {
    setSelectedProfessional(professional)
    setFormData({
      userId: professional.user_id,
      type: professional.type,
      registration: professional.registration || '',
      specialty: professional.specialty || '',
      bio: professional.bio || '',
      maxClients: professional.max_clients,
      displayName: professional.display_name || '',
      avatarUrl: professional.avatar_url || ''
    })
    setShowEditModal(true)
  }

  const filteredUsers = availableUsers.filter(user =>
    user.nome?.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUser.toLowerCase())
  )

  const getTypeLabel = (type: string) => {
    return type === 'nutritionist' ? 'Nutricionista' : 'Personal Trainer'
  }

  const getTypeBadgeColor = (type: string) => {
    return type === 'nutritionist'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      // Use a unique identifier for the professional photo
      const professionalId = selectedProfessional?.id || formData.userId || `new_${Date.now()}`
      const fileName = `professionals/${professionalId}/avatar.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      // Add timestamp to bust cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`

      // Update form data
      setFormData(prev => ({ ...prev, avatarUrl: urlWithTimestamp }))
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handlePhotoUpload(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Profissionais</h1>
          <p className="text-slate-400">Gerenciar nutricionistas e personal trainers</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Profissional
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todos os tipos</option>
            <option value="trainer">Personal Trainers</option>
            <option value="nutritionist">Nutricionistas</option>
          </select>
        </div>
      </div>

      {/* Professionals List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum profissional cadastrado</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-violet-400 hover:text-violet-300"
            >
              Adicionar primeiro profissional
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {professionals.map((professional) => (
              <div key={professional.id} className="p-4 hover:bg-slate-700/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      professional.type === 'nutritionist'
                        ? 'bg-green-500/20'
                        : 'bg-blue-500/20'
                    }`}>
                      {(professional.avatar_url || professional.fitness_profiles?.avatar_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={professional.avatar_url || professional.fitness_profiles?.avatar_url}
                          alt={professional.display_name || professional.fitness_profiles?.nome}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className={`text-lg font-medium ${
                          professional.type === 'nutritionist' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {(professional.display_name || professional.fitness_profiles?.nome || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {professional.display_name || professional.fitness_profiles?.nome || 'Sem nome'}
                        </p>
                        {!professional.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {professional.fitness_profiles?.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getTypeBadgeColor(professional.type)}`}>
                          {professional.type === 'nutritionist' ? '🥗' : '💪'}
                          {getTypeLabel(professional.type)}
                        </span>
                        {professional.registration && (
                          <span className="text-xs text-slate-500">
                            {professional.type === 'nutritionist' ? 'CRN' : 'CREF'}: {professional.registration}
                          </span>
                        )}
                        {professional.specialty && (
                          <span className="text-xs text-slate-500">
                            {professional.specialty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {professional.clientCount} / {professional.max_clients} clientes
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(professional)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          professional.is_active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                        }`}
                      >
                        {professional.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button
                        onClick={() => openEditModal(professional)}
                        className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProfessional(professional)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-lg font-semibold text-white">Adicionar Profissional</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Profissional</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, type: 'trainer' }))}
                    className={`p-3 rounded-lg border transition-colors ${
                      formData.type === 'trainer'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl">💪</span>
                    <p className={`mt-1 font-medium ${formData.type === 'trainer' ? 'text-blue-400' : 'text-white'}`}>
                      Personal Trainer
                    </p>
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, type: 'nutritionist' }))}
                    className={`p-3 rounded-lg border transition-colors ${
                      formData.type === 'nutritionist'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl">🥗</span>
                    <p className={`mt-1 font-medium ${formData.type === 'nutritionist' ? 'text-green-400' : 'text-white'}`}>
                      Nutricionista
                    </p>
                  </button>
                </div>
              </div>

              {/* Selecionar Usuário */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Selecionar Usuário</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Buscar usuário..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-slate-400">Carregando...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Nenhum usuário disponível</div>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            userId: user.id,
                            // Se o usuário já tem role de profissional, pré-selecionar o tipo
                            type: user.role === 'nutritionist' ? 'nutritionist' :
                                  user.role === 'trainer' ? 'trainer' : prev.type
                          }))
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors ${
                          formData.userId === user.id ? 'bg-violet-500/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm text-white">
                          {user.nome?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm">{user.nome || 'Sem nome'}</p>
                            {user.role === 'nutritionist' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Nutricionista</span>
                            )}
                            {user.role === 'trainer' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Personal</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        {formData.userId === user.id && (
                          <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Nome de Exibição */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Nome de Exibição <span className="text-violet-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Nome que aparece para os clientes"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-xs text-slate-500 mt-1">Este é o nome que os clientes verão</p>
              </div>

              {/* Foto do Profissional */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Foto do Profissional (opcional)
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-700 flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.avatarUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.avatarUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-violet-400 transition-colors">
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-500"></div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span className="text-[10px] mt-1">Enviar</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Escolher foto'}
                    </button>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                        className="mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Registro */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {formData.type === 'nutritionist' ? 'CRN' : 'CREF'} (opcional)
                </label>
                <input
                  type="text"
                  value={formData.registration}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration: e.target.value }))}
                  placeholder={formData.type === 'nutritionist' ? 'Ex: CRN-1 12345' : 'Ex: CREF 012345-G/SP'}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Especialidade */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Especialidade (opcional)</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder={formData.type === 'nutritionist' ? 'Ex: Nutrição Esportiva' : 'Ex: Musculação e Funcional'}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Max Clientes */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Máximo de Clientes</label>
                <input
                  type="number"
                  value={formData.maxClients}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxClients: parseInt(e.target.value) || 30 }))}
                  min={1}
                  max={100}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProfessional}
                disabled={saving || !formData.userId}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Editar Profissional</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedProfessional(null)
                }}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Info do profissional */}
              <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedProfessional.type === 'nutritionist' ? 'bg-green-500/20' : 'bg-blue-500/20'
                }`}>
                  {formData.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.avatarUrl}
                      alt={formData.displayName || 'Profissional'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className={`font-medium ${
                      selectedProfessional.type === 'nutritionist' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {(formData.displayName || selectedProfessional.fitness_profiles?.nome || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{formData.displayName || selectedProfessional.fitness_profiles?.nome}</p>
                  <p className="text-sm text-slate-400">{getTypeLabel(selectedProfessional.type)}</p>
                </div>
              </div>

              {/* Nome de Exibição */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Nome de Exibição</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Nome que aparece para os clientes"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Foto do Profissional */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Foto do Profissional</label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-700 flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.avatarUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.avatarUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-violet-400 transition-colors">
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-500"></div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span className="text-[10px] mt-1">Enviar</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Escolher foto'}
                    </button>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                        className="mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Registro */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {selectedProfessional.type === 'nutritionist' ? 'CRN' : 'CREF'}
                </label>
                <input
                  type="text"
                  value={formData.registration}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Especialidade */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Especialidade</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Biografia</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Max Clientes */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Máximo de Clientes</label>
                <input
                  type="number"
                  value={formData.maxClients}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxClients: parseInt(e.target.value) || 30 }))}
                  min={1}
                  max={100}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedProfessional(null)
                }}
                className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateProfessional}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
