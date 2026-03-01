"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Link2,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CalendarDays,
  Trophy
} from 'lucide-react'
import { useUserRole } from '@/hooks/use-user-role'
import { roleLabels } from '@/lib/admin/types'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { role, loading, isAdmin, email } = useUserRole()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirecionar se não for admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/')
    }
  }, [loading, isAdmin, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  // Não autorizado
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/agenda', icon: CalendarDays, label: 'Agenda' },
    { href: '/admin/users', icon: Users, label: 'Usuários' },
    { href: '/admin/professionals', icon: UserCog, label: 'Profissionais' },
    { href: '/admin/assignments', icon: Link2, label: 'Atribuições' },
    { href: '/admin/rankings', icon: Trophy, label: 'Rankings' },
    { href: '/admin/costs', icon: DollarSign, label: 'Custos API' },
    { href: '/admin/settings', icon: Settings, label: 'Configurações' },
  ]

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
        <span className="text-white font-semibold">Complexo Wellness Admin</span>
        <div className="w-10" /> {/* Spacer */}
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
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dourado to-vinho flex items-center justify-center">
                <span className="text-white font-bold text-sm">CW</span>
              </div>
              <span className="text-white font-semibold">Admin</span>
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
                <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                  <span className="text-dourado font-medium">
                    {email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{email}</p>
                  <p className="text-xs text-slate-400">{roleLabels[role]}</p>
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Voltar ao App</span>
              </Link>
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="w-5 h-5" />
              </Link>
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="flex items-center justify-center p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-700"
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
