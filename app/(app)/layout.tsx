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

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário"
  const userAvatar = user.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} userAvatar={userAvatar} />
      <div className="pt-16">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
