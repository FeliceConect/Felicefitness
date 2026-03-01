"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterFormData, getPasswordStrength } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input, PasswordInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function RegistroForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" })
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch("password", "")

  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password))
    } else {
      setPasswordStrength({ score: 0, label: "", color: "" })
    }
  }, [password])

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setHasError(false)

    try {
      // Usar nossa API que auto-confirma o usuário
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setHasError(true)
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: result.error || "Erro desconhecido",
        })
        return
      }

      // Fazer login automaticamente após criar conta
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (loginError) {
        // Conta criada mas login falhou - redirecionar para login
        toast({
          variant: "success",
          title: "Conta criada!",
          description: "Faça login para continuar.",
        })
        router.push("/login")
        return
      }

      toast({
        variant: "success",
        title: "Conta criada!",
        description: "Bem-vindo ao Complexo Wellness!",
      })

      router.push("/dashboard")
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
        <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
        <CardDescription>
          Preencha os dados para começar sua jornada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              autoComplete="name"
              error={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name.message}</p>
            )}
          </div>

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
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
              error={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-error">{errors.password.message}</p>
            )}

            {/* Indicador de força da senha */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i <= passwordStrength.score
                          ? passwordStrength.color
                          : "bg-border"
                      )}
                    />
                  ))}
                </div>
                <p className={cn(
                  "text-xs",
                  passwordStrength.score <= 2 && "text-error",
                  passwordStrength.score > 2 && passwordStrength.score <= 4 && "text-warning",
                  passwordStrength.score > 4 && "text-success"
                )}>
                  Força: {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirme sua senha"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            loading={isLoading}
          >
            Criar conta
          </Button>

          <p className="text-center text-sm text-foreground-secondary">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
