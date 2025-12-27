"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Shield,
  Activity,
  MoreVertical,
  X,
  Plus,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { roleLabels, UserRole } from '@/lib/admin/types'

interface User {
  id: string
  nome: string
  email: string
  role: UserRole | null
  created_at: string
  avatar_url?: string
  professionals?: Array<{ type: string; name: string }>
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)

  // Estados para criar usuário
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'client' as UserRole
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password) {
      alert('Email e senha são obrigatórios')
      return
    }
    if (newUser.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const data = await response.json()

      if (data.success) {
        // Limpar form e fechar modal
        setNewUser({ nome: '', email: '', password: '', role: 'client' })
        setShowCreateModal(false)
        setShowPassword(false)
        // Recarregar lista
        fetchUsers()
        alert('Usuário criado com sucesso!')
      } else {
        alert(data.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return

    setUpdatingRole(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole
        })
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar lista localmente
        setUsers(prev => prev.map(u =>
          u.id === selectedUser.id ? { ...u, role: newRole as UserRole } : u
        ))
        setShowRoleModal(false)
        setSelectedUser(null)
      } else {
        alert(data.error || 'Erro ao atualizar role')
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      alert('Erro ao atualizar role')
    } finally {
      setUpdatingRole(false)
    }
  }

  const getRoleBadgeColor = (role: UserRole | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'nutritionist':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'trainer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-slate-400">Gerenciar usuários do sistema</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {pagination.total} usuário(s) cadastrado(s)
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="pl-10 pr-8 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
            >
              <option value="">Todos os papéis</option>
              <option value="client">Clientes</option>
              <option value="trainer">Personal Trainers</option>
              <option value="nutritionist">Nutricionistas</option>
              <option value="admin">Administradores</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Profissionais
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                            {user.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.avatar_url}
                                alt={user.nome}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-violet-400 font-medium">
                                {user.nome?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.nome || 'Sem nome'}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          <Shield className="w-3 h-3" />
                          {roleLabels[user.role || 'client']}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.professionals && user.professionals.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.professionals.map((prof, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  prof.type === 'nutritionist'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-blue-500/10 text-blue-400'
                                }`}
                              >
                                {prof.type === 'nutritionist' ? '🥗' : '💪'}
                                {prof.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowRoleModal(true)
                          }}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <span className="text-violet-400 font-medium text-lg">
                          {user.nome?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.nome || 'Sem nome'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowRoleModal(true)
                      }}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                      <Shield className="w-3 h-3" />
                      {roleLabels[user.role || 'client']}
                    </span>
                    {user.professionals && user.professionals.map((prof, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          prof.type === 'nutritionist'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {prof.type === 'nutritionist' ? '🥗' : '💪'}
                        {prof.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>Cadastro: {formatDate(user.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Alterar Papel</h3>
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-700/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="text-violet-400 font-medium">
                    {selectedUser.nome?.charAt(0).toUpperCase() || selectedUser.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedUser.nome || 'Sem nome'}</p>
                  <p className="text-sm text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-3">Selecione o novo papel:</p>

              <div className="space-y-2">
                {[
                  { value: 'client', label: 'Cliente', icon: Activity, desc: 'Usuário padrão do app' },
                  { value: 'trainer', label: 'Personal Trainer', icon: Activity, desc: 'Acesso aos clientes atribuídos' },
                  { value: 'nutritionist', label: 'Nutricionista', icon: Activity, desc: 'Acesso aos clientes atribuídos' },
                  { value: 'admin', label: 'Administrador', icon: Shield, desc: 'Acesso total ao painel admin' },
                  { value: 'super_admin', label: 'Super Admin', icon: Shield, desc: 'Pode criar outros admins' },
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(role.value)}
                    disabled={updatingRole || selectedUser.role === role.value}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedUser.role === role.value
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                    } ${updatingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <role.icon className={`w-5 h-5 ${
                      selectedUser.role === role.value ? 'text-violet-400' : 'text-slate-400'
                    }`} />
                    <div className="text-left flex-1">
                      <p className={`font-medium ${
                        selectedUser.role === role.value ? 'text-violet-400' : 'text-white'
                      }`}>{role.label}</p>
                      <p className="text-xs text-slate-500">{role.desc}</p>
                    </div>
                    {selectedUser.role === role.value && (
                      <span className="text-xs text-violet-400 font-medium">Atual</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Criar Novo Usuário</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewUser({ nome: '', email: '', password: '', role: 'client' })
                  setShowPassword(false)
                }}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  placeholder="Nome do usuário"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Papel
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="client">Cliente</option>
                  <option value="trainer">Personal Trainer</option>
                  <option value="nutritionist">Nutricionista</option>
                  <option value="admin">Administrador</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewUser({ nome: '', email: '', password: '', role: 'client' })
                    setShowPassword(false)
                  }}
                  className="flex-1 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar Usuário
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
