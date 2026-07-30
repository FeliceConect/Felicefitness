# Auditoria de integridade da PONTUAÇÃO / RANKING — Complexo Wellness

## Intenção (uma frase)
Auditar TODO o sistema de pontos e ranking do app à procura de **brechas que permitam
um paciente ganhar pontos indevidos** (farmar pontos, burlar caps, duplicar créditos,
declarar ações que não aconteceram) — pacientes relataram pontuações "estranhas" e
disseram ter achado brechas. Não há diff pendente: revise o CÓDIGO EM PRODUÇÃO como está.

## Sua missão
Pense como um usuário malicioso com DevTools/console aberto e um script que dispara
requisições HTTP autenticadas. Onde ele consegue pontos que não deveria? Considere:
- Endpoints que creditam pontos confiando em dados vindos do cliente.
- Falta de cap diário / cap que não é aplicado de fato.
- Deletar+recriar um recurso para farmar o crédito de novo.
- Condição de corrida (TOCTOU): dedup por "ler-depois-inserir" sem índice único /
  transação — várias requisições paralelas furam o cap.
- Ações auto-declaradas (streak, PR, treino, refeição) sem verificação no servidor.
- Reversão ausente ou assimétrica (ganha ao criar, mas não perde ao apagar).
- Timezone (janela "hoje") permitindo recreditar na virada do dia.

Revise **apenas o seu domínio**, no formato obrigatório do seu perfil, **máx. 5 achados**,
cada um com: arquivo:linha, como explorar em passos concretos, impacto em pontos, e correção sugerida.
Priorize (crítico / alto / médio / baixo). Não conserte nada — só aponte.

## Mapa do sistema de pontos (leia estes arquivos)

### Núcleo de atribuição
- `lib/services/points-server.ts` — `awardPointsServer(userId, action, referenceId?)`. `POINT_VALUES`
  (tabela de pontos). Dedup: por `reference_id` OU, se ausente, **1× por dia** por (reason, source, date).
  Sem referenceId → dedup só por dia. Sem verificação de que a ação de fato ocorreu.
- `lib/services/points.ts` — wrapper client-side (`awardPoints` → `POST /api/points/award`).
- `app/api/points/award/route.ts` — endpoint público (auth de usuário). Aceita `{action, reference_id}`
  do corpo, valida só se `action ∈ POINT_VALUES`, e chama `awardPointsServer(user.id, action, ...)`.
- RPC `fitness_award_points_to_user` (leaderboard) — atômica no banco.

### Rotas que creditam pontos
- `app/api/activities/route.ts` — POST cria atividade avulsa e credita por intensidade
  (leve 3 / moderado 5 / intenso 8 / muito_intenso 10). Dedup por activity.id. DELETE/PATCH restritos ao dia.
  (Obs: `points-server.ts` L54 comenta "Cap diário aplicado na rota /api/activities" — confira se existe mesmo.)
- `app/api/feed/route.ts` — POST cria post: 4pts, cap 2/dia (categoria social).
- `app/api/feed/[id]/reactions/route.ts` — reação: 1pt, 1× por post + cap 2/dia. Toggle on/off.
- `app/api/feed/[id]/comments/route.ts` — comentário/resposta: 1pt, 1× por post + cap 2/dia.
- `app/api/meals/[id]/route.ts` — DELETE reverte "Todas refeicoes" se cair abaixo de 3/dia.
- `app/api/workouts/[id]/route.ts` — DELETE reverte treino/PR/cardio (só do dia).
- `app/api/appointments/[id]/complete/route.ts` — SEM pontos (por decisão).
- `app/api/client/meal-plan/complete/route.ts:174` — chama `awardPointsServer('all_meals_logged')` (10pts).
- `app/api/cron/weekly-adherence/route.ts` — 10pts/semana (cron protegido por CRON_SECRET).

### Triggers no banco (creditam SEM passar por awardPointsServer)
- `supabase/migrations/20260429_auto_award_triggers.sql` — AFTER INSERT em:
  - `fitness_water_logs` → 5pts ao bater meta (dedup por dia).
  - `fitness_meals` → 10pts ao atingir 3 refeições (dedup por dia).
  - `fitness_sleep_logs` → 3pts ao registrar sono (dedup por dia).
- `supabase/migrations/20260518_pr_authoritative_trigger.sql` — decide is_pr no banco (baseline real).
- `supabase/migrations/20260514_fix_sleep_trigger_timezone.sql` — fix de timezone do dedup de sono.

### Placar de desafio e ressincronização
- `lib/services/challenge-score.ts` — score do desafio = SOMA das transações no período (ao vivo).
- `lib/rankings/resync.ts` — remove PR fantasma + excedente de feed; reconstrói total_points.

### Referência de regras de pontos
- `CLAUDE.md` (seção "Pontuação do Ranking") e `lib/services/points-server.ts` `POINT_VALUES`.
