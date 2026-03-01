"use client"

import { Settings, Shield, Bell, Database, Globe } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-foreground-secondary">Configurações do sistema</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* General */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Settings className="w-5 h-5 text-dourado" />
            <h2 className="text-lg font-semibold text-foreground">Geral</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Modo de Manutenção</p>
                <p className="text-sm text-foreground-secondary">Desabilitar acesso ao app para usuários</p>
              </div>
              <button className="px-4 py-2 bg-background-elevated text-foreground-muted rounded-lg text-sm">
                Desativado
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Versão do App</p>
                <p className="text-sm text-foreground-secondary">Versão atual do Complexo Wellness</p>
              </div>
              <span className="text-foreground-muted">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Autenticação de Dois Fatores</p>
                <p className="text-sm text-foreground-secondary">Exigir 2FA para admins</p>
              </div>
              <button className="px-4 py-2 bg-background-elevated text-foreground-muted rounded-lg text-sm">
                Em breve
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Logs de Auditoria</p>
                <p className="text-sm text-foreground-secondary">Registrar todas as ações de admin</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Alertas de Custo</p>
                <p className="text-sm text-foreground-secondary">Notificar quando custos excederem limite</p>
              </div>
              <button className="px-4 py-2 bg-background-elevated text-foreground-muted rounded-lg text-sm">
                Configurar
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Clientes Inativos</p>
                <p className="text-sm text-foreground-secondary">Alertar sobre clientes sem atividade</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-foreground">Banco de Dados</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Backup Automático</p>
                <p className="text-sm text-foreground-secondary">Backups diários do Supabase</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Retenção de Dados</p>
                <p className="text-sm text-foreground-secondary">Período de retenção de logs</p>
              </div>
              <span className="text-foreground-muted">90 dias</span>
            </div>
          </div>
        </div>

        {/* API */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-foreground">API OpenAI</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Limite Diário por Usuário</p>
                <p className="text-sm text-foreground-secondary">Máximo de requisições por dia</p>
              </div>
              <span className="text-foreground-muted">50 requisições</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Modelo Padrão</p>
                <p className="text-sm text-foreground-secondary">Modelo para análise de alimentos</p>
              </div>
              <span className="text-foreground-muted font-mono text-sm">gpt-4-vision-preview</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Taxa de Câmbio</p>
                <p className="text-sm text-foreground-secondary">USD para BRL (custos)</p>
              </div>
              <span className="text-foreground-muted">R$ 5,50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-background-elevated/30 rounded-xl p-4 border border-border">
        <p className="text-sm text-foreground-secondary text-center">
          Algumas configurações requerem alteração direta no código ou variáveis de ambiente.
          Entre em contato com o desenvolvedor para alterações avançadas.
        </p>
      </div>
    </div>
  )
}
