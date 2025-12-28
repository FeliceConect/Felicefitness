"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input, PasswordInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setHasError(false)

    try {
      const supabase = createClient()

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setHasError(true)
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: error.message === "Invalid login credentials"
            ? "Email ou senha incorretos"
            : error.message,
        })
        return
      }

      // Verificar se é profissional (personal ou nutricionista)
      let redirectPath = "/dashboard"

      if (authData.user) {
        const { data: professionalData } = await supabase
          .from('fitness_professionals')
          .select('id, type, is_active')
          .eq('user_id', authData.user.id)
          .eq('is_active', true)
          .single()

        const professional = professionalData as { id: string; type: string; is_active: boolean } | null

        if (professional) {
          // Profissional vai direto para o portal
          redirectPath = "/portal"
          toast({
            variant: "success",
            title: `Bem-vindo, ${professional.type === 'trainer' ? 'Personal' : 'Nutricionista'}!`,
            description: "Acessando o Portal Profissional.",
          })
        } else {
          toast({
            variant: "success",
            title: "Bem-vindo!",
            description: "Login realizado com sucesso.",
          })
        }
      }

      router.push(redirectPath)
      router.refresh()
    } catch {
      setHasError(true)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn("animate-fade-in", hasError && "animate-shake")}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
        <CardDescription>
          Digite seu email e senha para acessar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              error={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-error">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              placeholder="Sua senha"
              autoComplete="current-password"
              error={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="/registro"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            loading={isLoading}
          >
            Entrar
          </Button>

          <p className="text-center text-sm text-foreground-secondary">
            Não tem uma conta?{" "}
            <Link
              href="/registro"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
