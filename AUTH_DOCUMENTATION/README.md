# Documentação de Autenticação - FeliceFit

Este diretório contém documentação completa sobre o sistema de autenticação e login do FeliceFit.

## Arquivos de Documentação

### 1. [01_FLUXO_COMPLETO.md](01_FLUXO_COMPLETO.md)
Documentação completa e detalhada sobre o fluxo de autenticação.

**Conteúdo:**
- Resumo executivo
- Fluxo de login passo a passo
- Middleware de autenticação
- Verificação de profissional
- Redirecionamento após login
- Portal profissional
- Fluxo de registro
- Clientes Supabase
- Fluxo de onboarding
- Fluxo visual completo (diagramas ASCII)
- Resumo dos arquivos chave
- Ambiente de desenvolvimento

**Quando usar:** Quando você precisa entender completamente como o sistema funciona, incluindo detalhes técnicos.

---

### 2. [02_GUIA_RAPIDO.md](02_GUIA_RAPIDO.md)
Guia rápido e simplificado com checklists e referências.

**Conteúdo:**
- Diagramas de fluxo ASCII
- Checklista de componentes
- Arquivo por arquivo (estrutura)
- Variáveis de ambiente
- Tabelas do banco de dados
- Fluxos de erro comuns
- Testing checklist

**Quando usar:** Quando você precisa de uma resposta rápida ou quer conferir algo específico.

---

### 3. [03_CODIGO_FONTE.md](03_CODIGO_FONTE.md)
Código-fonte comentado dos principais arquivos com explicações.

**Conteúdo:**
- LoginForm (componente)
- Middleware (updateSession)
- useProfessional (hook)
- Professional Layout (componente)
- API /api/professional/me (endpoint)
- Validação com Zod
- Clientes Supabase (browser e servidor)

**Quando usar:** Quando você quer ver o código real com comentários explicativos.

---

## Resumo Rápido

### Fluxo Principal

```
Login → signInWithPassword() → /dashboard
                          ↓
                    Middleware valida
                    ├─ Autenticado? ✓
                    ├─ Onboarding completo? ✓
                    ↓
                 /dashboard renderiza
                    ↓
             useProfessional() verifica tipo
                    ├─ É profissional? → /portal
                    ├─ Não profissional? → Dashboard cliente
                    └─ Inativo? → Mensagem de erro
```

### Arquivos Chave

| Arquivo | Função |
|---------|--------|
| `middleware.ts` | Intercepta requisições e valida auth |
| `lib/supabase/middleware.ts` | Lógica de proteção de rotas |
| `hooks/use-professional.ts` | Verifica tipo de usuário |
| `components/auth/login-form.tsx` | Formulário de login |
| `app/api/professional/me/route.ts` | Retorna dados do profissional |
| `app/(professional)/layout.tsx` | Protege e renderiza portal |

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Tabelas Importantes

- `fitness_profiles` - Perfil do usuário (onboarding_completed, etc)
- `fitness_professionals` - Dados do profissional (type, is_active, etc)

---

## Fluxo de Decisão

### Novo Usuário
1. Acessa `/registro`
2. Preenche formulário
3. Submete para `/api/auth/register`
4. Login automático se registro bem-sucedido
5. Redireciona para `/dashboard`
6. Middleware detecta `onboarding_completed = false`
7. Redireciona para `/onboarding`
8. Completa 4 passos do onboarding
9. Salva e volta para `/dashboard`

### Usuário Profissional
1. Tem registro em `fitness_professionals`
2. Pode acessar `/portal`
3. `useProfessional()` busca `/api/professional/me`
4. Se `type = 'trainer'` → Menu com "Treinos" e "Planos de Treino"
5. Se `type = 'nutritionist'` → Menu com "Refeições" e "Planos Alimentares"
6. Se `is_active = false` → Mostra "Conta Inativa"

### Erro Comum: Acesso Negado em /portal
- **Causa:** Usuário não tem registro em `fitness_professionals`
- **Solução:** Admin deve criar registro ou usuário deve se registrar como profissional

---

## Para Desenvolvedores

### Como adicionar uma nova rota protegida?
1. Crie a página em `app/(app)/[path]/page.tsx`
2. Middleware valida automaticamente (não autenticado → /login)
3. Se precisar de dados do usuário, use server-side com `createClient()` do server

### Como adicionar uma nova rota profissional?
1. Crie em `app/(professional)/portal/[path]/page.tsx`
2. Layout valida automaticamente com `useProfessional()`
3. Diferencie por tipo com `isNutritionist` ou `isTrainer`

### Como debugar autenticação?
1. Abra DevTools → Network
2. Veja requisições para `/api/auth/*`
3. Verifique headers (Authorization, cookies)
4. Verifique response status (401 = não autenticado)

---

## Testes Recomendados

### Autenticação
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Acesso a rota protegida sem autenticação
- [ ] Logout funciona corretamente

### Onboarding
- [ ] Novo usuário é redirecionado para onboarding
- [ ] Completar todos 4 passos
- [ ] Salvar dados corretamente
- [ ] Redirecionar para dashboard após completar

### Profissional
- [ ] Cliente tenta acessar `/portal` (acesso negado)
- [ ] Profissional acessa `/portal` (sucesso)
- [ ] Menu muda para trainer vs nutritionist
- [ ] Profissional inativo vê mensagem

---

## Estrutura de Diretórios

```
FeliceFit/
├─ app/
│  ├─ (auth)/           # Páginas de autenticação (públicas)
│  │  ├─ login/
│  │  ├─ registro/
│  │  └─ layout.tsx
│  ├─ (app)/            # Página principal do app (protegida)
│  │  ├─ layout.tsx
│  │  ├─ dashboard/
│  │  ├─ onboarding/
│  │  └─ [outras páginas]
│  ├─ (professional)/   # Portal profissional (protegido + validação)
│  │  ├─ layout.tsx
│  │  ├─ portal/
│  │  └─ [páginas profissional]
│  └─ api/
│     ├─ auth/
│     │  └─ register/
│     ├─ professional/
│     │  ├─ me/
│     │  ├─ dashboard/
│     │  └─ [other endpoints]
│     └─ onboarding/
├─ components/
│  └─ auth/
│     ├─ login-form.tsx
│     └─ registro-form.tsx
├─ hooks/
│  └─ use-professional.ts
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ server.ts
│  │  ├─ middleware.ts
│  │  └─ hooks.ts
│  └─ validations/
│     └─ auth.ts
├─ middleware.ts
└─ AUTH_DOCUMENTATION/  # Este diretório
   ├─ README.md
   ├─ 01_FLUXO_COMPLETO.md
   ├─ 02_GUIA_RAPIDO.md
   └─ 03_CODIGO_FONTE.md
```

---

## Contato e Dúvidas

Se tiver dúvidas sobre o sistema de autenticação:
1. Consulte os arquivos de documentação
2. Procure pelo arquivo específico no código-fonte
3. Verifique a seção "Fluxos de Erro Comuns" no Guia Rápido

---

**Última atualização:** 28 de Dezembro de 2025
**Versão:** 1.0.0
**Status:** Documentação Completa
