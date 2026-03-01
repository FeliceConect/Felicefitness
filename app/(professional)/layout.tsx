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
  Activity,
  ClipboardList,
  Brain,
  FileText,
  CalendarDays,
  Library,
  Stethoscope
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface ProfessionalLayoutProps {
  children: React.ReactNode
}

export default function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const router = useRouter()
  const { professional, loading, isProfessional, isSuperAdmin, isNutritionist, isTrainer, isCoach, isPhysiotherapist, isActive } = useProfessional()
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  // Não autorizado
  if (!isProfessional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-foreground-secondary">Você não tem permissão para acessar esta área.</p>
          <Link href="/login" className="mt-4 inline-block text-dourado hover:text-dourado/80">
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  // Profissional inativo
  if (!isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Conta Inativa</h1>
          <p className="text-foreground-secondary">Sua conta de profissional está inativa. Entre em contato com o administrador.</p>
          <Link href="/login" className="mt-4 inline-block text-dourado hover:text-dourado/80">
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  const menuItems = [
    { href: '/portal', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { href: '/portal/clients', icon: Users, label: 'Meus Pacientes', show: true },
    { href: '/portal/meals', icon: Utensils, label: 'Refeições', show: isNutritionist || isSuperAdmin },
    { href: '/portal/workouts', icon: Dumbbell, label: 'Treinos', show: isTrainer || isSuperAdmin },
    { href: '/portal/nutrition', icon: Apple, label: 'Planos Alimentares', show: isNutritionist || isSuperAdmin },
    { href: '/portal/training', icon: Activity, label: 'Planos de Treino', show: isTrainer || isSuperAdmin },
    { href: '/portal/coach', icon: Brain, label: 'Dashboard Coach', show: isCoach || isSuperAdmin },
    { href: '/portal/notes', icon: FileText, label: 'Prontuário', show: true },
    { href: '/portal/exercises', icon: Library, label: 'Exercícios', show: isTrainer || isSuperAdmin },
    { href: '/portal/agenda', icon: CalendarDays, label: 'Agenda', show: true },
    { href: '/portal/forms', icon: ClipboardList, label: 'Formulários', show: true },
    { href: '/portal/messages', icon: MessageSquare, label: 'Mensagens', show: true },
    { href: '/portal/settings', icon: Settings, label: 'Configurações', show: true },
  ].filter(item => item.show)

  const professionalTypeLabel = isSuperAdmin
    ? 'Super Admin'
    : isNutritionist
      ? 'Nutricionista'
      : isCoach
        ? 'Coach Alta Performance'
        : isPhysiotherapist
          ? 'Fisioterapeuta'
          : 'Personal Trainer'

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-cafe border-b border-cafe/80 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-vinho/30"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-seda" />
          ) : (
            <Menu className="w-6 h-6 text-seda" />
          )}
        </button>
        <span className="text-seda font-semibold truncate">{professional?.display_name || professionalTypeLabel}</span>
        <div className="w-10" />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — dark café premium */}
      <aside className={`
        fixed top-0 left-0 h-full bg-cafe border-r border-vinho/20 z-50
        transition-all duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-vinho/20">
          {sidebarOpen && (
            <Link href="/portal" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dourado to-vinho flex items-center justify-center">
                {isNutritionist ? (
                  <Apple className="w-4 h-4 text-white" />
                ) : isCoach ? (
                  <Brain className="w-4 h-4 text-white" />
                ) : isPhysiotherapist ? (
                  <Stethoscope className="w-4 h-4 text-white" />
                ) : (
                  <Dumbbell className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-seda font-semibold">{professional?.display_name || professionalTypeLabel}</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-vinho/30"
          >
            <ChevronDown className={`w-5 h-5 text-nude transition-transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-fendi hover:text-seda hover:bg-vinho/30
                transition-colors
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="flex-shrink-0 p-4 border-t border-vinho/20">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {professional?.avatar_url ? (
                  <img
                    src={professional.avatar_url}
                    alt={professional.display_name || professionalTypeLabel}
                    className="w-10 h-10 rounded-full object-cover border-2 border-dourado"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                    {isNutritionist ? (
                      <Apple className="w-5 h-5 text-dourado" />
                    ) : isCoach ? (
                      <Brain className="w-5 h-5 text-dourado" />
                    ) : isPhysiotherapist ? (
                      <Stethoscope className="w-5 h-5 text-dourado" />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-dourado" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-seda truncate">{professional?.display_name || professional?.specialty || professionalTypeLabel}</p>
                  <p className="text-xs text-nude">{professional?.registration || 'Sem registro'}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-error hover:text-error/80 hover:bg-error/10 transition-colors w-full"
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
                className="flex items-center justify-center p-2 rounded-lg text-error hover:text-error/80 hover:bg-error/10 w-full"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content — light warm background */}
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
