# FeliceFit Auth - Guia Rápido de Referência

## Diagrama de Fluxo de Autenticação

```
LOGIN FLOW
==========

/login (página pública)
    ↓
LoginForm (client component)
    ├─ Valida com Zod schema
    ├─ Chama supabase.auth.signInWithPassword()
    └─ router.push("/dashboard") se sucesso

Middleware.ts intercepta /dashboard
    ├─ Verifica: autenticado? ✓
    ├─ Verifica: onboarding_completed?
    │   └─ NÃO → /onboarding
    │   └─ SIM → Continue
    └─ Passa para o app

/dashboard (App Layout + DashboardContent)
    ├─ App Layout: Valida autenticação (server-side)
    ├─ DashboardContent: Renderiza dados do usuário
    └─ useProfessional hook detecta se é profissional


PROFISSIONAL PORTAL
===================

/portal/* (rota profissional)
    ↓
Professional Layout
    ├─ useProfessional() hook
    │   ├─ Busca user.id
    │   ├─ Chama /api/professional/me
    │   ├─ Busca em fitness_professionals
    │   └─ Retorna professional | null
    │
    ├─ isProfessional = !!professional
    ├─ isTrainer = professional?.type === 'trainer'
    ├─ isNutritionist = professional?.type === 'nutritionist'
    └─ isActive = professional?.is_active
    
    Se isProfessional ✓:
        ├─ Menu dinâmico (diferentes itens para cada tipo)
        ├─ Renderiza sidebar profissional
        └─ Renderiza /portal content
    
    Se isProfessional ✗:
        └─ Redireciona para / com mensagem de erro
    
    Se !isActive:
        └─ Mostra "Conta Inativa"
```

## Checklista de Componentes

### Cliente do Supabase
- [x] `createClient()` - Browser (anon key)
- [x] `createClient()` - Server (anon key + cookies)
- [x] Admin client - Apenas em /api/auth/register com service_role_key

### Autenticação
- [x] Middleware valida todas as rotas
- [x] Rotas públicas: /login, /registro, /termos, /privacidade
- [x] Proteção: Não autenticado → /login
- [x] Proteção: Onboarding incompleto → /onboarding

### Verificação de Tipo de Usuário
- [x] `useProfessional()` hook (client-side)
- [x] `/api/professional/me` endpoint
- [x] Tabela `fitness_professionals` (user_id, type, is_active, ...)
- [x] Diferenciação: 'trainer' vs 'nutritionist'

### Redirecionamento
- [x] Sucesso login → /dashboard
- [x] Sem onboarding → /onboarding
- [x] Não profissional em /portal → /
- [x] Profissional inativo → Mensagem de erro
- [x] Autenticado em /login → /dashboard

## Arquivo por Arquivo

### 1. Middleware
```
middleware.ts
├─ Intercepta TODAS requisições
├─ Chama: /lib/supabase/middleware.ts updateSession()
└─ Matcher: Exclui assets (_next, favicon, etc)
```

### 2. Lib Supabase
```
/lib/supabase/
├─ client.ts: createClient() para browser
├─ server.ts: createClient() para servidor
├─ middleware.ts: updateSession() - lógica de proteção
└─ hooks.ts: useUser(), useDailySummary(), etc
```

### 3. Autenticação
```
/(auth)/
├─ layout.tsx: Layout com logo e fundo
├─ login/page.tsx: Página de login
└─ registro/page.tsx: Página de registro

components/auth/
├─ login-form.tsx: Formulário de login (client)
├─ registro-form.tsx: Formulário de registro (client)
└─ ...

api/auth/
└─ register/route.ts: POST /api/auth/register (cria usuário)

validations/
└─ auth.ts: loginSchema, registerSchema (Zod)
```

### 4. Profissional
```
/(professional)/
├─ layout.tsx: Valida com useProfessional(), mostra sidebar
├─ portal/page.tsx: Dashboard do profissional
└─ portal/[section]/page.tsx: Seções específicas

hooks/
└─ use-professional.ts: Busca dados do profissional

api/professional/
├─ me/route.ts: GET /api/professional/me (retorna profissional)
├─ dashboard/route.ts: GET /api/professional/dashboard (stats)
├─ clients/route.ts: GET/POST /api/professional/clients
└─ ...
```

### 5. App (Usuário Regular)
```
/(app)/
├─ layout.tsx: Valida autenticação, renderiza Header + BottomNav
├─ onboarding/page.tsx: Fluxo de onboarding (4 passos)
├─ dashboard/page.tsx: Dashboard com DashboardContent
└─ [outros]/ : Outras páginas do app

api/onboarding/
└─ complete/route.ts: POST /api/onboarding/complete
```

## Variáveis de Ambiente

```env
# Públicas (compartilhadas com browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Secretas (servidor apenas)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Tabelas Banco de Dados (Relevantes para Auth)

### fitness_profiles
```
id (uuid) - user_id do Supabase
onboarding_completed (boolean)
nome (string)
email (string)
...
```

### fitness_professionals
```
id (uuid)
user_id (uuid) - FK para auth.users
type (enum) - 'trainer' | 'nutritionist'
is_active (boolean)
registration (string) - CREF/CRN
specialty (string)
bio (string)
max_clients (integer)
avatar_url (string)
display_name (string)
...
```

## Fluxos de Erro Comuns

### Erro: "Email ou senha incorretos"
- **Causa:** Credenciais inválidas
- **Solução:** Verificar email e senha

### Erro: "Não autorizado"
- **Causa:** Token expirou ou usuário não autenticado
- **Solução:** Fazer login novamente

### Erro: "Acesso Negado" (em /portal)
- **Causa:** Usuário não é profissional
- **Solução:** Criar registro em fitness_professionals

### Erro: "Conta Inativa"
- **Causa:** fitness_professionals.is_active = false
- **Solução:** Admin deve ativar a conta

### Stuck em /onboarding
- **Causa:** fitness_profiles.onboarding_completed = false
- **Solução:** Completar todos os 4 passos do onboarding

## Testing Checklist

- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (erro)
- [ ] Registro novo usuário
- [ ] Registro com email duplicado (erro)
- [ ] Acesso a /login quando autenticado (redireciona para /dashboard)
- [ ] Acesso a rota protegida sem autenticação (redireciona para /login)
- [ ] Completar onboarding
- [ ] Acesso a /portal como cliente (acesso negado)
- [ ] Acesso a /portal como profissional (sucesso)
- [ ] Menu dinâmico para trainer vs nutritionist
- [ ] Logout funciona

