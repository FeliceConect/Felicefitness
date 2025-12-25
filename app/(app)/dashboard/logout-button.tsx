"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      toast({
        title: "Até logo!",
        description: "Você saiu da sua conta.",
      })

      router.push("/login")
      router.refresh()
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível sair. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      loading={isLoading}
      className="w-full"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sair da conta
    </Button>
  )
}
