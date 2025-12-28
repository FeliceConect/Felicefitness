'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  User,
  Target,
  Dumbbell,
  Utensils,
  Pill,
  Palette,
  Shield,
  UserCog,
  Download,
  Info,
  MessageSquare,
  LogOut,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/use-notifications'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Email do superadmin que pode ver a opção Revolade
const SUPERADMIN_EMAIL = 'felicemed@gmail.com'

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  description?: string
  href?: string
  onClick?: () => void
  badge?: React.ReactNode
  variant?: 'default' | 'danger'
}

function SettingsItem({
  icon,
  label,
  description,
  href,
  onClick,
  badge,
  variant = 'default'
}: SettingsItemProps) {
  const content = (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg transition-colors hover:bg-muted/50',
      variant === 'danger' && 'hover:bg-destructive/10'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      )}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={cn(
          'font-medium',
          variant === 'danger' && 'text-destructive'
        )}>{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {badge}
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return (
    <button onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { isSubscribed, unreadCount } = useNotifications()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)
    }
    fetchUser()
  }, [supabase])

  const isSuperAdmin = userEmail === SUPERADMIN_EMAIL

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg">Configurações</h1>
        </div>
      </div>

      {/* Settings list */}
      <div className="px-4 py-2 space-y-6">
        {/* Perfil */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Perfil
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            <SettingsItem
              icon={<User className="w-5 h-5" />}
              label="Meu Perfil"
              description="Dados pessoais, foto"
              href="/perfil"
            />
            <SettingsItem
              icon={<Target className="w-5 h-5" />}
              label="Metas"
              description="Calorias, macros, peso, treino"
              href="/configuracoes/metas"
            />
          </div>
        </section>

        {/* Preferências */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Preferências
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            <SettingsItem
              icon={<Dumbbell className="w-5 h-5" />}
              label="Treino"
              description="Horários, dias, tipos"
              href="/configuracoes/treino"
            />
            <SettingsItem
              icon={<Utensils className="w-5 h-5" />}
              label="Alimentação"
              description="Refeições, restrições"
              href="/configuracoes/alimentacao"
            />
            {isSuperAdmin && (
              <SettingsItem
                icon={<Pill className="w-5 h-5" />}
                label="Revolade"
                description="Horários, jejum, alertas"
                href="/configuracoes/revolade"
              />
            )}
          </div>
        </section>

        {/* App */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Aplicativo
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            <SettingsItem
              icon={<Bell className="w-5 h-5" />}
              label="Notificações"
              description={isSubscribed ? 'Ativadas' : 'Desativadas'}
              href="/configuracoes/notificacoes"
              badge={unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {unreadCount}
                </span>
              ) : undefined}
            />
            <SettingsItem
              icon={<Palette className="w-5 h-5" />}
              label="Aparência"
              description="Tema, cores, fonte"
              href="/configuracoes/aparencia"
            />
          </div>
        </section>

        {/* Dados */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Dados e Privacidade
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            <SettingsItem
              icon={<Shield className="w-5 h-5" />}
              label="Privacidade"
              description="Compartilhamento, dados"
              href="/configuracoes/privacidade"
            />
            <SettingsItem
              icon={<Download className="w-5 h-5" />}
              label="Exportar Dados"
              description="Backup, download"
              href="/configuracoes/privacidade"
            />
            <SettingsItem
              icon={<UserCog className="w-5 h-5" />}
              label="Conta"
              description="Email, senha, excluir"
              href="/configuracoes/conta"
            />
          </div>
        </section>

        {/* Outros */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Outros
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            <SettingsItem
              icon={<Info className="w-5 h-5" />}
              label="Sobre o FeliceFit"
              description="Versão, créditos"
              href="/configuracoes/sobre"
            />
            <SettingsItem
              icon={<MessageSquare className="w-5 h-5" />}
              label="Feedback"
              description="Enviar sugestões"
              href="mailto:feedback@feliceconect.com.br"
            />
            <SettingsItem
              icon={<LogOut className="w-5 h-5" />}
              label="Sair"
              description="Encerrar sessão"
              onClick={handleLogout}
              variant="danger"
            />
          </div>
        </section>

        {/* Version info */}
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">FeliceFit v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
