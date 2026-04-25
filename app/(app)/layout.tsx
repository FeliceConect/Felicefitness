import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { MainContent } from "@/components/layout/main-content"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Profissionais (exceto super_admin) só podem acessar o portal
  // Admin secretaria/suporte só acessam o painel /admin (não o app do paciente)
  const { data: profile } = await supabase
    .from('fitness_profiles')
    .select('role, admin_type')
    .eq('id', user.id)
    .single() as { data: { role: string; admin_type: string | null } | null }

  const professionalRoles = ['nutritionist', 'trainer', 'coach', 'physiotherapist']
  if (profile && professionalRoles.includes(profile.role)) {
    redirect('/portal')
  }

  // Admin com subtipo secretary/support não tem acesso ao app do paciente
  if (profile?.role === 'admin' && (profile.admin_type === 'secretary' || profile.admin_type === 'support')) {
    redirect(profile.admin_type === 'secretary' ? '/admin/agenda' : '/admin/pacientes')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainContent>{children}</MainContent>
      <BottomNav />
    </div>
  )
}
