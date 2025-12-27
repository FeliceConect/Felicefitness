"use client"

import { User, Bell, Shield } from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

export default function SettingsPage() {
  const { professional, isNutritionist } = useProfessional()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400">Gerencie suas preferências</p>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <User className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Perfil Profissional</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Tipo</p>
              <p className="text-sm text-slate-400">Seu tipo de profissional</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              isNutritionist
                ? 'bg-green-500/20 text-green-400'
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              {isNutritionist ? 'Nutricionista' : 'Personal Trainer'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Registro Profissional</p>
              <p className="text-sm text-slate-400">{isNutritionist ? 'CRN' : 'CREF'}</p>
            </div>
            <span className="text-slate-300">{professional?.registration || 'Não informado'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Especialidade</p>
              <p className="text-sm text-slate-400">Sua área de atuação</p>
            </div>
            <span className="text-slate-300">{professional?.specialty || 'Não informado'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Máximo de Clientes</p>
              <p className="text-sm text-slate-400">Limite de clientes atribuídos</p>
            </div>
            <span className="text-slate-300">{professional?.max_clients || 30}</span>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Notificações</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Clientes Inativos</p>
              <p className="text-sm text-slate-400">Alertar quando cliente ficar inativo</p>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              Ativo
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Novas Refeições</p>
              <p className="text-sm text-slate-400">Notificar quando cliente registrar refeição</p>
            </div>
            <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-sm">
              Em breve
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Novos Treinos</p>
              <p className="text-sm text-slate-400">Notificar quando cliente registrar treino</p>
            </div>
            <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-sm">
              Em breve
            </span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">Segurança</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Status da Conta</p>
              <p className="text-sm text-slate-400">Sua conta está ativa</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              professional?.is_active
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {professional?.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
        <p className="text-sm text-slate-400 text-center">
          Para alterar seus dados de perfil profissional, entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
