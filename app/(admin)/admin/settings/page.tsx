"use client"

import { Settings, Shield, Bell, Database, Globe } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400">Configurações do sistema</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* General */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <Settings className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Geral</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Modo de Manutenção</p>
                <p className="text-sm text-slate-400">Desabilitar acesso ao app para usuários</p>
              </div>
              <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm">
                Desativado
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Versão do App</p>
                <p className="text-sm text-slate-400">Versão atual do Complexo Wellness</p>
              </div>
              <span className="text-slate-300">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Segurança</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Autenticação de Dois Fatores</p>
                <p className="text-sm text-slate-400">Exigir 2FA para admins</p>
              </div>
              <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm">
                Em breve
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Logs de Auditoria</p>
                <p className="text-sm text-slate-400">Registrar todas as ações de admin</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Notificações</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Alertas de Custo</p>
                <p className="text-sm text-slate-400">Notificar quando custos excederem limite</p>
              </div>
              <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm">
                Configurar
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Clientes Inativos</p>
                <p className="text-sm text-slate-400">Alertar sobre clientes sem atividade</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Banco de Dados</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Backup Automático</p>
                <p className="text-sm text-slate-400">Backups diários do Supabase</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Retenção de Dados</p>
                <p className="text-sm text-slate-400">Período de retenção de logs</p>
              </div>
              <span className="text-slate-300">90 dias</span>
            </div>
          </div>
        </div>

        {/* API */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">API OpenAI</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Limite Diário por Usuário</p>
                <p className="text-sm text-slate-400">Máximo de requisições por dia</p>
              </div>
              <span className="text-slate-300">50 requisições</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Modelo Padrão</p>
                <p className="text-sm text-slate-400">Modelo para análise de alimentos</p>
              </div>
              <span className="text-slate-300 font-mono text-sm">gpt-4-vision-preview</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Taxa de Câmbio</p>
                <p className="text-sm text-slate-400">USD para BRL (custos)</p>
              </div>
              <span className="text-slate-300">R$ 5,50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
        <p className="text-sm text-slate-400 text-center">
          Algumas configurações requerem alteração direta no código ou variáveis de ambiente.
          Entre em contato com o desenvolvedor para alterações avançadas.
        </p>
      </div>
    </div>
  )
}
