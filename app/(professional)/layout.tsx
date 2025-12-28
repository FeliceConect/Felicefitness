"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Utensils,
  Dumbbell,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Apple,
  Activity
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface ProfessionalLayoutProps {
  children: React.ReactNode
}

export default function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const router = useRouter()
  const { professional, loading, isProfessional, isNutritionist, isTrainer, isActive } = useProfessional()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirecionar se não for profissional
  useEffect(() => {
    if (!loading && !isProfessional) {
      router.push('/')
    }
  }, [loading, isProfessional, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  // Não autorizado
  if (!isProfessional) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400">Você não tem permissão para acessar esta área.</p>
          <Link href="/login" className="mt-4 inline-block text-violet-400 hover:text-violet-300">
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  // Profissional inativo
  if (!isActive) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Conta Inativa</h1>
          <p className="text-slate-400">Sua conta de profissional está inativa. Entre em contato com o administrador.</p>
          <Link href="/login" className="mt-4 inline-block text-violet-400 hover:text-violet-300">
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  const menuItems = [
    { href: '/portal', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { href: '/portal/clients', icon: Users, label: 'Meus Clientes', show: true },
    { href: '/portal/meals', icon: Utensils, label: 'Refeições', show: isNutritionist },
    { href: '/portal/workouts', icon: Dumbbell, label: 'Treinos', show: isTrainer },
    { href: '/portal/nutrition', icon: Apple, label: 'Planos Alimentares', show: isNutritionist },
    { href: '/portal/training', icon: Activity, label: 'Planos de Treino', show: isTrainer },
    { href: '/portal/messages', icon: MessageSquare, label: 'Mensagens', show: true },
    { href: '/portal/settings', icon: Settings, label: 'Configurações', show: true },
  ].filter(item => item.show)

  const professionalTypeLabel = isNutritionist ? 'Nutricionista' : 'Personal Trainer'

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-700"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
        <span className="text-white font-semibold">Portal Profissional</span>
        <div className="w-10" />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 z-50
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <Link href="/portal" className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isNutritionist
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gradient-to-br from-orange-500 to-red-600'
              }`}>
                {isNutritionist ? (
                  <Apple className="w-4 h-4 text-white" />
                ) : (
                  <Dumbbell className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white font-semibold">Portal</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-slate-700"
          >
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-slate-300 hover:text-white hover:bg-slate-700
                transition-colors
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {professional?.avatar_url ? (
                  <img
                    src={professional.avatar_url}
                    alt={professional.display_name || professionalTypeLabel}
                    className="w-10 h-10 rounded-full object-cover border-2 border-violet-500"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isNutritionist ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    {isNutritionist ? (
                      <Apple className={`w-5 h-5 text-green-400`} />
                    ) : (
                      <Dumbbell className={`w-5 h-5 text-orange-400`} />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{professional?.display_name || professional?.specialty || professionalTypeLabel}</p>
                  <p className="text-xs text-slate-400">{professional?.registration || 'Sem registro'}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="flex items-center justify-center p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-700 w-full"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`
        min-h-screen transition-all duration-300
        pt-16 lg:pt-0
        ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
