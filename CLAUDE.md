# CLAUDE.md — Complexo Wellness

## Projeto
Complexo Wellness é a plataforma digital do programa de acompanhamento wellness do Complexo Felice (clínica de estética e saúde em Uberlândia-MG). Estamos transformando o app "FeliceFit" (uso pessoal) em uma plataforma multi-paciente com equipe multidisciplinar.

## Documento de Referência
O planejamento completo está em `docs/felice-wellness-plan-v2.md`. **LEIA ESTE ARQUIVO antes de implementar qualquer feature.** Ele contém: arquitetura de roles, features detalhadas, modelos de dados, fases de implementação, decisões de design e regras de negócio.

## Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript 5
- **Estilo:** Tailwind CSS + shadcn/ui (Radix UI)
- **Animações:** Framer Motion
- **DB:** Supabase self-hosted (PostgreSQL) em supabase.feliceconect.com.br
- **Auth:** Supabase Auth (SSR) com middleware customizado
- **State/Cache:** React Query (TanStack Query) — migrar hooks existentes
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Push:** web-push + VAPID + service worker
- **PWA:** next-pwa
- **Email:** Resend (transacional, mensagens em massa)
- **Video:** lite-youtube-embed (exercícios)
- **Calendar:** ics (npm) para gerar .ics
- **Deploy:** Vercel

## Identidade Visual — OBRIGATÓRIO SEGUIR

### Cores (Paleta Complexo Felice)
```
--cafe: #322b29        /* Autoridade, sofisticação */
--vinho: #663739       /* Luxo, exclusividade */
--dourado: #c29863     /* Requinte, sucesso — accent primário */
--nude: #ae9b89        /* Equilíbrio — texto muted */
--fendi: #cac2b9       /* Modernidade */
--seda: #ddd5c7        /* Suavidade */

/* Light Mode Premium — Base Nude/Fendi */
--bg-primary: #f7f2ed     /* Background principal (warm cream) */
--bg-card: #ffffff         /* Cards (white) */
--bg-elevated: #ede7e0    /* Elevated surfaces */
--bg-input: #f2ece5       /* Input fields */
--border: #d4cbc2         /* Borders, dividers */
--text-primary: #322b29   /* Café — texto principal */
--text-secondary: #7a6e64 /* Café muted */
--text-muted: #ae9b89     /* Nude */
--accent: #c29863         /* Dourado — CTAs, destaques, ranking */
--accent-secondary: #663739 /* Vinho */
--success: #7dad6a
--error: #a04045
```

### Fontes
- **Butler** — Títulos, headings, números grandes do ranking. Serif elegante.
- **Sarabun** — Corpo de texto, labels, UI. Sans-serif limpa.
- **NUNCA usar Inter, Arial ou system fonts para conteúdo visível.**

### Design
- Light mode PREMIUM com base warm (nude/fendi), cards brancos
- Aspecto PREMIUM e profissional — como app de clínica de estética de alto padrão
- Bordas sutis, sombras suaves, glow dourado para destaques
- Animações elegantes (não exageradas)
- Mobile-first, touch-friendly, botões grandes
- Skeleton loading (nunca tela em branco)

## Roles do Sistema
```
super_admin  → Leonardo/Marinella — acesso total, chat com pacientes, moderar, pontuar bioimpedância
admin        → Secretária — agenda, mensagens em massa, cadastro. NÃO vê dados clínicos
nutritionist → Nutricionista — portal próprio, pacientes linkados, planos alimentares
trainer      → Personal Trainer — portal próprio, pacientes linkados, programas de treino
coach        → Coach Alta Performance (Psicóloga) — portal próprio, notas privadas (só coach + superadmin)
client       → Paciente — dashboard, agenda, tracking, feed, ranking, chat
```

## Estrutura do App
```
app/
├── (auth)/          → Login, registro, onboarding
├── (app)/           → Rotas do paciente (protegidas, role: client)
│   ├── dashboard/   → Home do paciente
│   ├── agenda/      → Calendário de consultas
│   ├── feed/        → Feed social da comunidade
│   ├── ranking/     → Rankings e gamificação
│   ├── perfil/      → Perfil, configs, progresso
│   ├── treino/      → Exercícios
│   ├── alimentacao/ → Nutrição
│   ├── agua/        → Hidratação
│   ├── sono/        → Sono
│   └── chat/        → Mensagens com profissionais
├── (professional)/  → Portais dos profissionais
│   ├── portal/      → Portal genérico (rota base)
│   ├── nutri/       → Portal nutricionista
│   ├── trainer/     → Portal personal
│   └── coach/       → Portal coach
├── (admin)/         → Painel admin/secretária
├── (superadmin)/    → Painel superadmin (ou merge com admin + permissões)
└── api/             → API Routes
```

## Bottom Nav do Paciente
```
🏠 Home | 📅 Agenda | 🌐 Feed | 🏆 Ranking | 👤 Eu
```

## Regras de Código

### Geral
- TypeScript strict — sem `any`, tipar tudo
- Componentes com "use client" quando interativos
- Server components quando possível
- Imports absolutos com @/ prefix
- Português brasileiro para UI, inglês para código/variáveis

### Supabase
- SEMPRE usar RLS em tabelas novas
- **TODAS as tabelas DEVEM começar com prefixo `fitness_`** (ex: `fitness_appointments`, `fitness_rankings`)
- Service layer em `lib/services/` entre hooks e Supabase
- Queries via React Query (não fetch direto nos hooks)
- Timezone: America/Sao_Paulo (usar utils/date.ts)

### Componentes
- shadcn/ui como base
- Framer Motion para animações (com useReducedMotion)
- Skeleton loading states obrigatórios
- Props com TypeScript interfaces
- Acessibilidade: aria-labels, focus management

### Performance
- Lazy loading de componentes pesados
- Debounce em buscas
- Virtualização em listas longas
- Imagens otimizadas (next/image ou LazyImage)

## Features REMOVIDAS (NÃO implementar)
- ❌ Revolade (medicação pessoal)
- ❌ Alerta de laticínios
- ❌ Coach IA (chat com GPT)
- ❌ Insights IA / predições
- ❌ Reports IA
- ❌ Meditação guiada
- ❌ Exercícios respiratórios
- ❌ Diário de gratidão
- ❌ Recovery score avançado / mapa de dor

## Pontuação do Ranking (referência rápida)
> Valores REAIS implementados (fonte de verdade: `POINT_VALUES` em
> `lib/services/points-server.ts`). Atualizado em 2026-07-30 na auditoria de
> integridade da pontuação.
- Consulta: **0pts** (presença é compulsória do programa; não pontua — decisão 2026-05-01)
- Aderência alimentar semana: 10pts (automático, ≥80%, cron segunda-feira)
- Bioimpedância: 20-50pts (manual, Leonardo/Marinella)
- Treino completo: 15pts
- Todas refeições do dia (≥3): 10pts (trigger no banco, 1×/dia)
- Meta água: 5pts (trigger no banco, 1×/dia)
- Sono: **escalonado** — 6pts (dormiu 18h–21h59), 3pts (22h–23h59), 0pts (madrugada/dia)
- PR: **3pts** (só recorde que vence histórico real; primeira vez é baseline)
- Cardio no treino: 3/5/8/10pts por intensidade (leve/moderado/intenso/muito_intenso)
- Atividade avulsa: 3/5/8/10pts por intensidade — **cap de 2 atividades pontuáveis/dia**
- Post no feed: **4pts** (máx 2 posts pontuáveis/dia)
- Reação/comentário: 1pt (1× por post, máx 2/dia cada; toggle-off da reação estorna o ponto)
- Formulário preenchido: 5pts
- Streak 7 dias: 15pts bônus (trigger no banco, na transição real do streak)
- Streak 30 dias: 50pts bônus (trigger no banco, na transição real do streak)

> ⚠️ Integridade: todo crédito é deduplicado no banco por índice único
> (`user_id, reason, source, reference_date` para diários; `user_id, reason,
> reference_id` para eventos). Não existe endpoint genérico de crédito
> disparável pelo cliente — cada ação é creditada pelo caminho que a executa e
> verifica. Ver migrations `20260730_*`.

## Fases de Implementação
Ver `docs/felice-wellness-plan-v2.md` para detalhes completos.
1. Fundação e Rebranding
2. Agenda + Formulários Automáticos
3. Comunicação (Chat + Massa + Email)
4. Alimentação + Treino Adaptados
5. Coach Alta Performance
6. Gamificação & Ranking
7. Feed Social / Comunidade
8. Polish + Go-Live
