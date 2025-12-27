# PLANO DO MÓDULO ADMINISTRATIVO FELICEFIT

## Visão Geral

Sistema de gestão para o Complexo Felice com:
- **Admin Panel** (browser desktop) - gestão de usuários e custos
- **Portal Profissional** (mobile-friendly) - nutri e personal
- **App Cliente** (PWA) - já existente + chat + ranking

---

## Fases de Implementação

### Fase 1: Fundação ✅ Em andamento
- [ ] Sistema de roles (admin, nutri, personal, client)
- [ ] Tabelas de profissionais e atribuições
- [ ] Middleware de autorização
- [ ] Aceite de termos (LGPD)

### Fase 2: Admin Panel
- [ ] Dashboard simples
- [ ] CRUD usuários e profissionais
- [ ] Atribuir clientes a profissionais
- [ ] Monitoramento de custos API

### Fase 3: Portal Profissional Mobile
- [ ] Dashboard mobile-friendly
- [ ] Lista de clientes
- [ ] Ver perfil/atividades do cliente
- [ ] Sistema de feedback em refeições/treinos

### Fase 4: Chat
- [ ] Conversa cliente ↔ profissional
- [ ] Mensagens em tempo real (Supabase Realtime)
- [ ] Envio de fotos
- [ ] Notificações push

### Fase 5: Gamificação Ranking
- [ ] Cálculo de pontos
- [ ] Ranking semanal anônimo
- [ ] Tela no app do cliente
- [ ] Reset semanal automático

### Fase 6: Auditoria e Onboarding
- [ ] Log de ações importantes
- [ ] Tela de onboarding para novos clientes
- [ ] Avaliação física inicial

---

## Hierarquia de Usuários

| Role | Código | Descrição |
|------|--------|-----------|
| Super Admin | `super_admin` | Acesso total |
| Admin | `admin` | Gerencia profissionais e pacientes |
| Nutricionista | `nutritionist` | Gerencia alimentação dos seus clientes |
| Personal Trainer | `trainer` | Gerencia treinos dos seus clientes |
| Cliente | `client` | Usuário final do app |

---

## Decisões Técnicas

- Chat com IA: Não (já tem Coach IA)
- Videochamada: Não
- White-label: Não
- Multi-idioma: Não
- Integrações externas: Fase futura
- Limites de usuários: Soft limits apenas

---

## Modelo de Dados

Ver migration em: `supabase/migrations/[data]_admin_module.sql`
