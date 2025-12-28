# FeliceFit Auth - Código-Fonte Comentado

## 1. LoginForm - Formulário de Login
**Arquivo:** `/Users/felice/FeliceFit/components/auth/login-form.tsx`

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { useToast } from "@/components/ui/use-toast"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Função chamada ao submeter o formulário
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      // 1. Criar cliente Supabase
      const supabase = createClient()

      // 2. Tentar fazer login
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      // 3. Se houver erro, mostrar mensagem
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: error.message === "Invalid login credentials"
            ? "Email ou senha incorretos"
            : error.message,
        })
        return
      }

      // 4. Se sucesso, mostrar mensagem e redirecionar
      toast({
        variant: "success",
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      })

      // 5. Redirecionar para dashboard
      router.push("/dashboard")
      router.refresh()  // Atualizar cookies de sessão
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register("email")}
        />
        {errors.email && <p className="text-error">{errors.email.message}</p>}
      </div>

      {/* Senha */}
      <div className="space-y-2">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          placeholder="Sua senha"
          {...register("password")}
        />
        {errors.password && <p className="text-error">{errors.password.message}</p>}
      </div>

      {/* Link para registro */}
      <p className="text-center text-sm">
        Não tem uma conta?{" "}
        <Link href="/registro" className="text-primary font-medium">
          Criar conta
        </Link>
      </p>

      {/* Botão de envio */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
```

---

## 2. Middleware - Proteção de Rotas
**Arquivo:** `/Users/felice/FeliceFit/lib/supabase/middleware.ts`

```tsx
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Criar cliente Supabase para o servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obter usuário autenticado
  const { data: { user } } = await supabase.auth.getUser()

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/registro', '/termos', '/privacidade']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // 1. Se não está autenticado e tentando acessar rota protegida
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Se está autenticado e tentando acessar /login ou /registro
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/registro'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. Se está autenticado, verificar se completou o onboarding
  const onboardingExemptRoutes = ['/onboarding', '/api', '/termos', '/privacidade']
  const isOnboardingExempt = onboardingExemptRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (user && !isOnboardingExempt) {
    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // Se não completou onboarding, redirecionar
    if (profile && profile.onboarding_completed === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
```

---

## 3. useProfessional Hook - Verificar Tipo de Usuário
**Arquivo:** `/Users/felice/FeliceFit/hooks/use-professional.ts`

```tsx
"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Professional {
  id: string
  user_id: string
  type: 'nutritionist' | 'trainer'
  registration: string | null
  specialty: string | null
  bio: string | null
  max_clients: number
  is_active: boolean
  avatar_url: string | null
  display_name: string | null
}

export function useProfessional() {
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkProfessional() {
      try {
        // 1. Criar cliente Supabase
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 2. Obter usuário autenticado
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // 3. Buscar dados do profissional via API
        // (usando API ao invés de chamar Supabase direto para mais segurança)
        const response = await fetch('/api/professional/me')
        const data = await response.json()

        // 4. Se encontrou, salvar no state
        if (data.success && data.professional) {
          setProfessional(data.professional)
        }
      } catch (err) {
        console.error('Erro ao verificar profissional:', err)
        setError('Erro ao verificar dados do profissional')
      } finally {
        setLoading(false)
      }
    }

    checkProfessional()
  }, [])

  // Retorna valores úteis para usar em componentes
  return {
    professional,
    loading,
    error,
    isProfessional: !!professional,
    isNutritionist: professional?.type === 'nutritionist',
    isTrainer: professional?.type === 'trainer',
    isActive: professional?.is_active ?? false
  }
}
```

---

## 4. Professional Layout - Proteção e Menu
**Arquivo:** `/Users/felice/FeliceFit/app/(professional)/layout.tsx` (parcial)

```tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfessional } from '@/hooks/use-professional'
import { Dumbbell, Apple } from 'lucide-react'

export default function ProfessionalLayout({ children }) {
  const router = useRouter()
  const { professional, loading, isProfessional, isNutritionist, isTrainer, isActive } = useProfessional()

  // Redirecionar se não for profissional
  useEffect(() => {
    if (!loading && !isProfessional) {
      router.push('/')
    }
  }, [loading, isProfessional, router])

  // Mostrando loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-500"></div>
      </div>
    )
  }

  // Usuário não é profissional
  if (!isProfessional) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400">Você não tem permissão para acessar esta área.</p>
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
          <p className="text-slate-400">Sua conta está inativa.</p>
        </div>
      </div>
    )
  }

  // Menu dinâmico baseado no tipo
  const menuItems = [
    { href: '/portal', label: 'Dashboard', show: true },
    { href: '/portal/clients', label: 'Meus Clientes', show: true },
    
    // Apenas para nutricionista
    { href: '/portal/meals', label: 'Refeições', show: isNutritionist },
    { href: '/portal/nutrition', label: 'Planos Alimentares', show: isNutritionist },
    
    // Apenas para personal
    { href: '/portal/workouts', label: 'Treinos', show: isTrainer },
    { href: '/portal/training', label: 'Planos de Treino', show: isTrainer },
  ].filter(item => item.show)

  // Renderizar layout
  return (
    <div className="min-h-screen bg-slate-900">
      <aside className="fixed left-0 top-0 w-64 h-full bg-slate-800">
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
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
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  )
}
```

---

## 5. API /api/professional/me - Buscar Dados do Profissional
**Arquivo:** `/Users/felice/FeliceFit/app/api/professional/me/route.ts`

```tsx
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 1. Verificar se usuário está autenticado
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Usar admin client para buscar dados (necessário para certos cenários)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Buscar registro do profissional
    const { data: professional, error } = await supabaseAdmin
      .from('fitness_professionals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 4. Verificar se houve erro (PGRST116 = nenhum resultado encontrado)
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar profissional:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados' },
        { status: 500 }
      )
    }

    // 5. Retornar resultado (pode ser null se não existe registro)
    return NextResponse.json({
      success: true,
      professional: professional || null
    })

  } catch (error) {
    console.error('Erro ao processar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

---

## 6. Validação com Zod - Auth Schema
**Arquivo:** `/Users/felice/FeliceFit/lib/validations/auth.ts`

```ts
import { z } from "zod"

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O email é obrigatório")
    .email("Digite um email válido"),
  password: z
    .string()
    .min(1, "A senha é obrigatória")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
})

// Schema para registro
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "O nome é obrigatório")
      .min(2, "O nome deve ter no mínimo 2 caracteres"),
    email: z
      .string()
      .min(1, "O email é obrigatório")
      .email("Digite um email válido"),
    password: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve ter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve ter pelo menos um número"),
    confirmPassword: z
      .string()
      .min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

// Type inference para usar em componentes
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

// Helper para calcular força da senha
export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) {
    return { score, label: "Fraca", color: "bg-red-500" }
  } else if (score <= 4) {
    return { score, label: "Média", color: "bg-yellow-500" }
  } else {
    return { score, label: "Forte", color: "bg-green-500" }
  }
}
```

---

## 7. Clientes Supabase

### Client Browser
**Arquivo:** `/Users/felice/FeliceFit/lib/supabase/client.ts`

```tsx
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Client Servidor
**Arquivo:** `/Users/felice/FeliceFit/lib/supabase/server.ts`

```tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
```

