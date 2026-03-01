import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"

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
  const { data: profile } = await supabase
    .from('fitness_profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  const professionalRoles = ['nutritionist', 'trainer', 'coach', 'physiotherapist']
  if (profile && professionalRoles.includes(profile.role)) {
    redirect('/portal')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="content-safe-top content-safe-bottom">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
