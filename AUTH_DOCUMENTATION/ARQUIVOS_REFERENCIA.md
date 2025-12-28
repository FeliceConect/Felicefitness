# Referência Rápida - Arquivos de Autenticação

## Índice por Caminho (Pronto para Clicar)

### Autenticação - Entrada
- `middleware.ts` - Interceptor de requisições (Next.js)
- `lib/supabase/middleware.ts` - Lógica de autenticação

### Clientes Supabase
- `lib/supabase/client.ts` - Client para browser
- `lib/supabase/server.ts` - Client para servidor
- `lib/supabase/hooks.ts` - Hooks customizados

### Páginas Públicas (Auth)
- `app/(auth)/login/page.tsx` - Página de login
- `app/(auth)/registro/page.tsx` - Página de registro
- `app/(auth)/layout.tsx` - Layout com logo

### Componentes de Autenticação
- `components/auth/login-form.tsx` - Formulário de login
- `components/auth/registro-form.tsx` - Formulário de registro

### APIs de Autenticação
- `app/api/auth/register/route.ts` - Endpoint POST para registrar usuário
- `app/api/onboarding/complete/route.ts` - Endpoint POST para completar onboarding

### Páginas Protegidas (Aplicativo)
- `app/(app)/layout.tsx` - Layout principal (valida auth)
- `app/(app)/dashboard/page.tsx` - Dashboard do usuário
- `app/(app)/onboarding/page.tsx` - Fluxo de onboarding (4 passos)

### Portal Profissional
- `app/(professional)/layout.tsx` - Layout protegido + menu dinâmico
- `app/(professional)/portal/page.tsx` - Dashboard do profissional
- `app/(professional)/portal/clients/page.tsx` - Lista de clientes
- `app/(professional)/portal/meals/page.tsx` - Refeições (nutricionista)
- `app/(professional)/portal/nutrition/page.tsx` - Planos alimentares (nutricionista)
- `app/(professional)/portal/workouts/page.tsx` - Treinos (personal)
- `app/(professional)/portal/training/page.tsx` - Planos de treino (personal)

### Lógica de Profissional
- `hooks/use-professional.ts` - Hook para buscar dados do profissional
- `app/api/professional/me/route.ts` - Endpoint GET para dados do profissional
- `app/api/professional/dashboard/route.ts` - Endpoint GET para stats do profissional
- `app/api/professional/clients/route.ts` - Endpoints para gerenciar clientes

### Validação
- `lib/validations/auth.ts` - Schemas Zod para login/registro

---

## Fluxo por Arquivo

### Novo Usuário Registrando
1. `app/(auth)/registro/page.tsx` - Acessa página
2. `components/auth/registro-form.tsx` - Preenche formulário
3. `lib/validations/auth.ts` - Valida com Zod
4. `lib/supabase/client.ts` - Cria cliente browser
5. `app/api/auth/register/route.ts` - POST para registrar
6. `lib/supabase/server.ts` - Server client valida
7. Volta ao form, login automático
8. `middleware.ts` → `lib/supabase/middleware.ts` - Intercepta /dashboard
9. `app/(app)/onboarding/page.tsx` - Redireciona para onboarding
10. `app/api/onboarding/complete/route.ts` - POST para completar

### Usuário Acessando Portal Profissional
1. Navega para `/portal`
2. `middleware.ts` → `lib/supabase/middleware.ts` - Valida auth + onboarding
3. `app/(professional)/layout.tsx` - Layout do profissional
4. `hooks/use-professional.ts` - Hook busca tipo
5. `app/api/professional/me/route.ts` - API retorna dados
6. `lib/supabase/server.ts` - Server client valida
7. Layout mostra/esconde itens baseado em `type`
8. `app/(professional)/portal/page.tsx` - Dashboard renderiza

---

## Variáveis de Ambiente (Necessárias)

```env
# Arquivo: .env.local

# Supabase - Público (pode estar no repositório)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Supabase - Secreto (NUNCA no repositório)
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Estrutura de Dados

### Tabela: `fitness_profiles`
```typescript
{
  id: string (uuid) // user_id do Supabase
  onboarding_completed: boolean
  nome: string
  email: string
  // ... outros campos
}
```

### Tabela: `fitness_professionals`
```typescript
{
  id: string (uuid)
  user_id: string (uuid) // FK para auth.users
  type: 'nutritionist' | 'trainer'
  is_active: boolean
  registration: string | null // CREF, CRN, etc
  specialty: string | null
  bio: string | null
  avatar_url: string | null
  display_name: string | null
  max_clients: number
  // ... outros campos
}
```

---

## Fluxos de Erro

### Erro: "Não autorizado"
**Onde:** `/api/professional/me` ou qualquer API
**Causa:** `supabase.auth.getUser()` retorna erro
**Solução:** Fazer login novamente

### Erro: "Acesso Negado" em /portal
**Onde:** `app/(professional)/layout.tsx`
**Causa:** `isProfessional = false` (não tem registro)
**Solução:** Criar registro em `fitness_professionals`

### Erro: "Conta Inativa"
**Onde:** `app/(professional)/layout.tsx`
**Causa:** `is_active = false` em `fitness_professionals`
**Solução:** Admin ativa a conta

### Usuário Preso em /onboarding
**Causa:** `onboarding_completed = false` em `fitness_profiles`
**Solução:** Completar todos os 4 passos

### Email Duplicado no Registro
**Onde:** `app/api/auth/register/route.ts`
**Causa:** Email já existe em `auth.users`
**Mensagem:** "Este email já está cadastrado"

---

## Checklist de Implementação

### Novo Recurso Protegido (Rota)
- [ ] Criar em `app/(app)/[path]/page.tsx`
- [ ] Middleware valida automaticamente
- [ ] Se precisa de user data, usar `lib/supabase/server.ts`
- [ ] Testar acesso sem autenticação (deve redirecionar)

### Novo Recurso Profissional
- [ ] Criar em `app/(professional)/portal/[path]/page.tsx`
- [ ] Layout valida automaticamente com `useProfessional()`
- [ ] Diferenciar com `isNutritionist` ou `isTrainer`
- [ ] Testar como trainer e como nutritionist

### Nova API Protegida
- [ ] Criar em `app/api/[path]/route.ts`
- [ ] Validar autenticação: `supabase.auth.getUser()`
- [ ] Se precisa de dados sensíveis, usar admin client + service role key
- [ ] Retornar 401 se não autenticado
- [ ] Usar `lib/supabase/server.ts` para client

---

## Links Úteis

### Documentação FeliceFit
- `AUTH_DOCUMENTATION/01_FLUXO_COMPLETO.md` - Documentação técnica completa
- `AUTH_DOCUMENTATION/02_GUIA_RAPIDO.md` - Checklista rápida
- `AUTH_DOCUMENTATION/03_CODIGO_FONTE.md` - Código comentado
- `AUTH_DOCUMENTATION/README.md` - Índice geral

### Documentação Externa
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [Zod Validation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

---

## Debug Tips

### Verificar se está autenticado
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user) // null ou objeto do usuário
```

### Verificar dados do profissional
1. DevTools → Network
2. Procure por `/api/professional/me`
3. Verifique response status e body
4. Se 401: não autenticado
5. Se 200 com `professional: null`: não é profissional

### Verificar onboarding
```typescript
const { data: profile } = await supabase
  .from('fitness_profiles')
  .select('onboarding_completed')
  .eq('id', user.id)
  .single()
console.log(profile?.onboarding_completed)
```

### Verificar redirecionamento
1. DevTools → Network
2. Procure por status 307 (redirect)
3. Veja a Location header para saber para onde foi

---

## Segurança

### Anon Key (Público)
- Usada em browser (`components/`, `hooks/`)
- Usada em `lib/supabase/client.ts`
- Row Level Security (RLS) valida access

### Service Role Key (Secreto)
- Usada APENAS em APIs (`app/api/`)
- Usando `lib/supabase/server.ts` + admin client
- NUNCA expor ao browser
- Deve estar em `.env.local` (gitignored)

### Cookies
- Automaticamente gerenciados pelo Supabase SSR
- `middleware.ts` atualiza cookies
- `lib/supabase/server.ts` lê/escreve cookies

---

## Próximos Passos

1. Ler documentação em ordem:
   - README.md (visão geral)
   - 02_GUIA_RAPIDO.md (referência rápida)
   - 03_CODIGO_FONTE.md (código comentado)
   - 01_FLUXO_COMPLETO.md (detalhes técnicos)

2. Mapear qual fluxo você precisa implementar

3. Consultar ARQUIVOS_REFERENCIA.md (este arquivo) para encontrar o arquivo certo

4. Copiar padrão do arquivo existente similar

5. Testar com checklist

---

**Última atualização:** 28 de Dezembro de 2025
**Versão:** 1.0.0
