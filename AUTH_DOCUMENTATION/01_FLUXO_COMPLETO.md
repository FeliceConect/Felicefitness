# FeliceFit - Fluxo de Autenticação e Login

## Resumo Executivo

O FeliceFit implementa um sistema de autenticação robusto com Supabase que diferencia entre usuários regulares (clientes) e profissionais (personal trainers e nutricionistas). O fluxo completo envolve login, middleware de proteção de rota, verificação de tipo de usuário e redirecionamento baseado no papel do usuário.

---

## 1. Fluxo de Login (Login Page → Dashboard)

### 1.1 Página de Login
**Arquivo:** `/Users/felice/FeliceFit/app/(auth)/login/page.tsx`

```tsx
// Página simples que renderiza o componente LoginForm
export default function LoginPage() {
  return <LoginForm />
}
```

### 1.2 Componente LoginForm
**Arquivo:** `/Users/felice/FeliceFit/components/auth/login-form.tsx`

**Fluxo:**
1. Usuário preenche email e senha (validados com Zod schema)
2. Form validado no client-side com `react-hook-form` + `zodResolver`
3. Ao submeter, chama `supabase.auth.signInWithPassword()`
4. **Sucesso:** Toast de boas-vindas + Redireciona para `/dashboard`
5. **Erro:** Toast com mensagem de erro (ex: "Email ou senha incorretos")

**Key Code:**
```tsx
const supabase = createClient()

const { error } = await supabase.auth.signInWithPassword({
  email: data.email,
  password: data.password,
})

if (error) {
  // Erro
  toast({ variant: "destructive", ... })
} else {
  // Sucesso
  router.push("/dashboard")
  router.refresh()
}
```

### 1.3 Validação de Formulário
**Arquivo:** `/Users/felice/FeliceFit/lib/validations/auth.ts`

```ts
export const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})
```

---

## 2. Middleware de Autenticação

### 2.1 Middleware Principal
**Arquivo:** `/Users/felice/FeliceFit/middleware.ts`

```ts
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Responsável por:** Interceptar todas as requisições (exceto assets) e atualizar a sessão de autenticação.

### 2.2 Lógica de Middleware (updateSession)
**Arquivo:** `/Users/felice/FeliceFit/lib/supabase/middleware.ts`

**Fluxo Completo:**

```
┌─ Requisição chega
│
├─ 1. Verifica se usuário está autenticado
│    └─ Obtém user com: supabase.auth.getUser()
│
├─ 2. Define rotas públicas (não precisam auth)
│    └─ ['/login', '/registro', '/termos', '/privacidade']
│
├─ 3. Se NÃO autenticado + tentando acessar rota protegida
│    └─ Redireciona para /login
│
├─ 4. Se autenticado + tentando acessar /login ou /registro
│    └─ Redireciona para /dashboard
│
├─ 5. Se autenticado, verifica se completou onboarding
│    └─ Busca fitness_profiles.onboarding_completed
│    └─ Se false, redireciona para /onboarding
│
└─ Retorna resposta (sucesso ou redirecionamento)
```

**Key Logic:**

```tsx
// Usuário não autenticado tentando acessar rota protegida
if (!user && !isPublicRoute) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

// Usuário autenticado tentando acessar /login
if (user && isLoginRoute) {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  return NextResponse.redirect(url)
}

// Verificar onboarding
if (user && !isOnboardingExempt) {
  const { data: profile } = await supabase
    .from('fitness_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()
  
  if (profile?.onboarding_completed === false) {
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }
}
```

---

## 3. Verificação de Profissional

### 3.1 Hook useProfessional
**Arquivo:** `/Users/felice/FeliceFit/hooks/use-professional.ts`

**Responsabilidade:** Verificar se o usuário logado é um profissional (personal ou nutricionista).

**Fluxo:**

```tsx
export function useProfessional() {
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkProfessional() {
      // 1. Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      // 2. Buscar registro de profissional via API
      const response = await fetch('/api/professional/me')
      const data = await response.json()

      // 3. Se encontrou profissional, salvar no state
      if (data.success && data.professional) {
        setProfessional(data.professional)
      }
    }

    checkProfessional()
  }, [])

  return {
    professional,      // Objeto completo do profissional
    loading,           // boolean
    error,             // string | null
    isProfessional,    // boolean - se é profissional
    isNutritionist,    // boolean - se é nutricionista
    isTrainer,         // boolean - se é personal
    isActive,          // boolean - se está ativo
  }
}
```

### 3.2 API Route: /api/professional/me
**Arquivo:** `/Users/felice/FeliceFit/app/api/professional/me/route.ts`

**Fluxo:**

```tsx
export async function GET() {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Usar admin client para buscar profissional
    const supabaseAdmin = createAdminClient(...)
    
    const { data: professional, error } = await supabaseAdmin
      .from('fitness_professionals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 3. Se não encontrou profissional, retorna null
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: '...' }, { status: 500 })
    }

    // 4. Retorna profissional (ou null se não existe)
    return NextResponse.json({
      success: true,
      professional: professional || null
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '...' }, { status: 500 })
  }
}
```

### 3.3 Estrutura da Tabela `fitness_professionals`

```ts
interface Professional {
  id: string
  user_id: string
  type: 'nutritionist' | 'trainer'        // Tipo de profissional
  registration: string | null              // CREF, CRN, etc
  specialty: string | null                 // Especialidade
  bio: string | null                       // Biografia
  max_clients: number                      // Máximo de clientes
  is_active: boolean                       // Se está ativo
  avatar_url: string | null                // Avatar/Foto
  display_name: string | null              // Nome para exibição
}
```

---

## 4. Redirecionamento após Login

### 4.1 Fluxo Completo de Redirecionamento

```
Usuário faz login
    ↓
Sucesso no signInWithPassword
    ↓
router.push("/dashboard")
router.refresh()
    ↓
Middleware.ts é chamado
    ↓
Middleware verifica:
  ├─ Usuário autenticado? ✓
  ├─ Completou onboarding?
  │   └─ NÃO → Redireciona para /onboarding
  │   └─ SIM → Deixa ir para /dashboard
    ↓
Acessa /dashboard
    ↓
Layout (app)/(app)/layout.tsx valida autenticação novamente
    ↓
DashboardContent renderiza dados do usuário
    ↓
Hook useProfessional() detecta se é profissional
    └─ NÃO é profissional → Renderiza dashboard de cliente
    └─ É profissional → Poderia redirecionar para /portal
```

### 4.2 Redirecionamento em Tempo Real (Layout do App)
**Arquivo:** `/Users/felice/FeliceFit/app/(app)/layout.tsx`

```tsx
export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se não autenticado, redireciona para login
  if (!user) {
    redirect("/login")
  }

  // Se autenticado, renderiza o app layout
  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} userAvatar={userAvatar} />
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
```

---

## 5. Portal Profissional - Redirecionamento e Proteção

### 5.1 Layout Profissional
**Arquivo:** `/Users/felice/FeliceFit/app/(professional)/layout.tsx`

**Função:** Proteger o acesso ao portal de profissionais e exibir interface específica.

**Fluxo:**

```tsx
export default function ProfessionalLayout({ children }) {
  const router = useRouter()
  const { professional, loading, isProfessional, isActive } = useProfessional()

  // Redirecionar se não for profissional
  useEffect(() => {
    if (!loading && !isProfessional) {
      router.push('/')  // Redireciona para home
    }
  }, [loading, isProfessional, router])

  // Loading
  if (loading) {
    return <LoadingSpinner />
  }

  // Não autorizado
  if (!isProfessional) {
    return <AccessDeniedScreen />
  }

  // Profissional inativo
  if (!isActive) {
    return <InactiveAccountScreen />
  }

  // Profissional ativo - renderiza o layout completo
  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar professional={professional} />
      <main>{children}</main>
    </div>
  )
}
```

### 5.2 Menu Dinâmico baseado em Tipo de Profissional

```tsx
const menuItems = [
  { href: '/portal', icon: LayoutDashboard, label: 'Dashboard', show: true },
  { href: '/portal/clients', icon: Users, label: 'Meus Clientes', show: true },
  
  // Nutricionista específico
  { href: '/portal/meals', icon: Utensils, label: 'Refeições', show: isNutritionist },
  { href: '/portal/nutrition', icon: Apple, label: 'Planos Alimentares', show: isNutritionist },
  
  // Personal Trainer específico
  { href: '/portal/workouts', icon: Dumbbell, label: 'Treinos', show: isTrainer },
  { href: '/portal/training', icon: Activity, label: 'Planos de Treino', show: isTrainer },
  
  // Comum
  { href: '/portal/messages', icon: MessageSquare, label: 'Mensagens', show: true },
  { href: '/portal/settings', icon: Settings, label: 'Configurações', show: true },
].filter(item => item.show)
```

---

## 6. Fluxo de Registro (Sign Up)

### 6.1 Componente RegistroForm
**Arquivo:** `/Users/felice/FeliceFit/components/auth/registro-form.tsx`

**Fluxo:**

```tsx
const onSubmit = async (data: RegisterFormData) => {
  try {
    // 1. Chamar API de registro
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name
      })
    })

    const result = await response.json()

    if (!response.ok) {
      toast.error(result.error)
      return
    }

    // 2. Fazer login automaticamente
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (loginError) {
      // Conta criada, mas login falhou
      router.push("/login")
      return
    }

    // 3. Sucesso - redirecionar para dashboard
    router.push("/dashboard")
    router.refresh()
  } catch (error) {
    toast.error("Erro inesperado")
  }
}
```

### 6.2 API de Registro
**Arquivo:** `/Users/felice/FeliceFit/app/api/auth/register/route.ts`

**Características:**
- Usa admin client (service role key) para auto-confirmar email
- Não requer email confirmation
- Salva full_name em user_metadata

```tsx
export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json()

  // Validar
  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Criar usuário com auto-confirmação
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // Auto-confirma
    user_metadata: {
      full_name: name
    }
  })

  if (error) {
    if (error.message.includes('already') || error.message.includes('exists')) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: 'Conta criada com sucesso!',
    user: { id: data.user.id, email: data.user.email }
  })
}
```

---

## 7. Clientes Supabase

### 7.1 Client Browser
**Arquivo:** `/Users/felice/FeliceFit/lib/supabase/client.ts`

```tsx
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Uso:** Componentes "use client" para autenticação no navegador.

### 7.2 Server Client
**Arquivo:** `/Users/felice/FeliceFit/lib/supabase/server.ts`

```tsx
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { ... }
      },
    }
  )
}
```

**Uso:** Server components, API routes, middleware.

---

## 8. Fluxo Completo de Onboarding

### 8.1 Página de Onboarding
**Arquivo:** `/Users/felice/FeliceFit/app/(app)/onboarding/page.tsx`

**Passos:**
1. Welcome
2. Goals (selecionar objetivos)
3. Notifications (ativar/desativar)
4. Terms (aceitar termos e privacidade)

**Ao Completar:**
```tsx
const completeOnboarding = async () => {
  const response = await fetch('/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({
      goals,
      notificationsEnabled,
      termsVersion: '1.0.0',
      privacyVersion: '1.0.0'
    })
  })

  const data = await response.json()
  if (data.success) {
    router.push('/dashboard')
  }
}
```

---

## 9. Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NOVO USUÁRIO - FLUXO COMPLETO                    │
└─────────────────────────────────────────────────────────────────────┘

1. REGISTRO
   Acessa /registro
   ├─ Middleware: É público ✓
   ├─ Preenche formulário (nome, email, senha)
   ├─ Submete para /api/auth/register
   ├─ Admin client cria usuário com auto-confirmação
   ├─ Tenta fazer login automaticamente
   ├─ Sucesso: Redireciona para /dashboard
   └─ Refresh da página

2. MIDDLEWARE
   Requisição para /dashboard
   ├─ Valida usuário autenticado ✓
   ├─ Busca onboarding_completed em fitness_profiles
   ├─ Encontra false (não completou)
   ├─ Redireciona para /onboarding
   └─ Status: 307

3. ONBOARDING
   Acessa /onboarding
   ├─ Preenche 4 passos (welcome, goals, notifications, terms)
   ├─ Clica "Começar"
   ├─ POST /api/onboarding/complete
   ├─ API atualiza fitness_profiles.onboarding_completed = true
   ├─ Redireciona para /dashboard
   └─ Sucesso!

4. DASHBOARD
   Acessa /dashboard
   ├─ Middleware: Autenticado ✓, Onboarding completo ✓
   ├─ Layout (app): Valida autenticação novamente
   ├─ DashboardContent: Carrega dados do usuário
   └─ Renderiza interface do cliente


┌─────────────────────────────────────────────────────────────────────┐
│                 PROFISSIONAL - ACESSAR PORTAL                       │
└─────────────────────────────────────────────────────────────────────┘

1. ACESSO A /portal
   Navegação para /portal/...
   ├─ Middleware: Validar autenticação e onboarding
   ├─ Layout (professional): useProfessional hook
   │   ├─ Busca usuário atual
   │   ├─ Chama /api/professional/me
   │   │   ├─ Busca em fitness_professionals
   │   │   └─ Retorna profissional ou null
   │   ├─ Se null: isProfessional = false
   │   └─ Se existe: isProfessional = true, type = 'trainer' | 'nutritionist'
   │
   ├─ Se NÃO é profissional:
   │   ├─ Redireciona para /
   │   └─ Mostra "Acesso Negado"
   │
   ├─ Se é profissional mas inativo:
   │   ├─ Mostra "Conta Inativa"
   │   └─ Redireciona para /
   │
   └─ Se é profissional e ativo:
       ├─ Renderiza ProfessionalLayout
       ├─ Menu dinâmico baseado em type
       │   ├─ Nutricionista: Refeições, Planos Alimentares
       │   └─ Personal: Treinos, Planos de Treino
       └─ Renderiza conteúdo específico

```

---

## 10. Resumo dos Arquivos Chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `/app/(auth)/login/page.tsx` | Página de login |
| `/components/auth/login-form.tsx` | Formulário de login com validação |
| `/components/auth/registro-form.tsx` | Formulário de registro |
| `/middleware.ts` | Interceptor de requisições |
| `/lib/supabase/middleware.ts` | Lógica de autenticação e onboarding |
| `/lib/supabase/client.ts` | Cliente browser do Supabase |
| `/lib/supabase/server.ts` | Cliente servidor do Supabase |
| `/hooks/use-professional.ts` | Hook para verificar profissional |
| `/app/api/auth/register/route.ts` | Endpoint de registro |
| `/app/api/professional/me/route.ts` | Endpoint de dados do profissional |
| `/app/(professional)/layout.tsx` | Layout protegido do profissional |
| `/app/(app)/layout.tsx` | Layout do app (cliente) |
| `/app/(app)/onboarding/page.tsx` | Página de onboarding |
| `/lib/validations/auth.ts` | Schemas Zod de validação |

---

## 11. Ambiente de Desenvolvimento

**Variáveis de Ambiente Necessárias:**

```env
# Supabase (público)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (servidor - secreto)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Requisitos:**
- Node.js 18+
- Next.js 14+
- Supabase project com tabelas:
  - `fitness_profiles`
  - `fitness_professionals`
  - `fitness_water_logs`
  - `fitness_exercises_library`
  - etc.

