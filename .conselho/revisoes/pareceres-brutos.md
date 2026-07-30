# Pareceres brutos do conselho — Auditoria de pontuação (2026-07-30)

Seis especialistas revisaram o sistema de pontos/ranking em produção (sem diff).
Abaixo os pareceres na íntegra, para consolidação pelo revisor-chefe.

---

## 1) ARQUITETO

VEREDITO: BLOQUEADO

**[BLOQUEANTE][crítico] app/api/points/award/route.ts:26-36 → lib/services/points-server.ts:148-149**
Endpoint aceita `action` e `reference_id` do corpo, valida só `action ∈ POINT_VALUES` e credita — nunca verifica que a ação ocorreu nem que o `reference_id` pertence ao usuário. O helper documenta "caller is responsible for verifying the action belongs to userId", mas o caller HTTP não verifica. Ações com dedup por dia: streak_30=50, streak_7=15, all_meals_logged=10 (~78 pts/dia sem esforço). Ações com reference_id: UUID novo a cada chamada → workout_completed 15/chamada, form_completed 5/chamada, sem limite. A rota dedicada award-workout-complete confere posse; chamando /api/points/award direto isso é contornado. Correção: reconstruir cada ação no servidor a partir de posse real; streak_7/streak_30/weekly_adherence nunca disparáveis pelo cliente; idealmente remover o endpoint genérico.

**[BLOQUEANTE][crítico] app/api/activities/route.ts:127-136 → points-server.ts:54-55**
POST credita por intensidade (até 10, muito_intenso) com dedup só por activity.id, e NÃO há cap. O comentário em points-server.ts:54-55 afirma "Cap diário aplicado na rota /api/activities" — cap inexistente. 100 atividades = 1000 pts, sem deletar/recriar. Correção: cap diário real (contar reason LIKE 'Atividade%' do dia), preferir invariante no banco.

**[BLOQUEANTE][alto] fitness_point_transactions sem índice único (20260228_...:264-282) → points-server.ts:178-208 e caps de feed**
Só índices comuns. TODO dedup e TODOS os caps são "ler-depois-inserir" sem invariante = TOCTOU. N requisições paralelas idênticas → crédito N×. Correção: índice único parcial (user_id, reference_id, category) WHERE reference_id IS NOT NULL + chave única para crédito diário; INSERT ... ON CONFLICT DO NOTHING.

**[IMPORTANTE][médio-alto] Duas fontes concorrentes de crédito (points-server.ts:190-208 vs triggers 20260429)**
Água/refeição/sono creditam por DOIS caminhos com dedup e chaves divergentes (helper dedup por created_at>=início do dia; triggers por (created_at AT TIME ZONE SP)::date=NEW.data; sono antigo em UTC). Risco de duplo crédito e manutenção frágil. Correção: fonte única de verdade.

**[IMPORTANTE][médio] Triggers confiam em NEW.data (campo do cliente) + RLS permite insert direto**
Água/sono/refeição inseridos do navegador (RLS só garante user_id=auth.uid()); atacante escolhe `data` e `quantidade_ml`. Dedup por dia só impede a mesma data — varrer o calendário credita por data. Correção: rejeitar `data` fora de janela curta, validar quantidade, mover inserção para rota server.

Nota: não leu resync.ts, RPC fitness_award_points_to_user, trigger de PR (20260518), fix sono (20260514).

---

## 2) APPSEC

VEREDITO: BLOQUEADO. (grep rateLimit/upstash = 0 arquivos; sem rate limiting.)

**[BLOQUEANTE] app/api/points/award/route.ts:29-36 (+ points-server.ts:178-189)**
Broken Function Level Authorization + chave de dedup controlada pelo cliente. Valida só action∈POINT_VALUES; reference_id do corpo, sem existir/pertencer/tipo. Como atacante escolhe reference_id, nunca colide: cada UUID novo = crédito novo. {action:"streak_30",reference_id:"<nova>"} → +50/req. Sem rate limit → milhares de pts/min. Todas as 19 ações de POINT_VALUES exploráveis. pr_achieved SEM reference_id pula o guard de histórico (points-server.ts:170) → +3/dia. Mesmo reference_id rende em 7 categorias. Sem checagem de role (profissional/admin também se auto-creditam). resync NÃO recupera (só PR fantasma + feed) — pontos forjados viram total_points. Correção: remover POST público; creditar só via rota que verifica o fato com referenceId derivado no servidor; índice único; rate limit + teto diário absoluto no banco.

**[BLOQUEANTE] 20260429_auto_award_triggers.sql:40-45 e :80-84 (+ 20260514:23-28)**
Dedup compara created_at (sempre hoje) com NEW.data (do cliente). Se data≠hoje, v_already=0 sempre → credita a cada inserção, para sempre. Portas: (a) insert direto (RLS WITH CHECK só user_id; sem UNIQUE(user_id,data); app já insere do browser — hooks/use-water-log.ts:160); (b) /api/client/meal-plan/complete aceita `date` do corpo (route.ts:39→113) sem validar hoje nem dedup por (planMealId,date). Impacto: +10/linha refeição retroativa, +5/linha água, +3/linha sono, ilimitado; polui prontuário; contamina cron aderência. Correção: dedup por reference_date=NEW.data com UNIQUE; CHECK data=hoje SP nas 3 tabelas; UNIQUE(user_id,data) em sleep; meal-plan/complete ignora date do corpo.

**[IMPORTANTE] app/api/activities/route.ts:127-136 (points-server.ts:54-55)**
Cap afirmado não existe. Valida só type/duration>0/intensity, credita por intensidade, dedup por activity.id (novo a cada POST). N POSTs muito_intenso → +10/req, sem teto/rate limit. 1 min vale = 2h. `date` do corpo → espalhar no passado escapa do DELETE (só cobre hoje). Correção: cap real no servidor; duração mínima coerente; ignorar date do corpo; corrigir comentário.

**[IMPORTANTE] feed route.ts:230-252, reactions:80-92, comments:174-188**
TOCTOU nos caps 2/dia (count sem lock/UNIQUE). Requisições simultâneas → todas passam underDailyCap; ~10 paralelas → ~40 pts em vez de 8. resync remove excedente de feed, mas só quando admin roda. Assimetria: toggle-off de reação apaga a reação e NÃO reverte o ponto. Correção: INSERT com UNIQUE + ON CONFLICT; reverter ponto no toggle-off.

**[IMPORTANTE] app/api/points/award-workout-complete/route.ts:87-100 (+ workouts/[id]:23)**
Validação de posse parcial: só workoutId verificado; cardioAwards[].workoutExerciseId e prSetIds[] aceitos crus como reference_id. Array de cardios com ids arbitrários + intensity muito_intenso → +10/item numa requisição. workouts DELETE reverte mas permite recriar e ganhar de novo (ciclo criar/apagar/criar). prHasPriorHistory busca set por id SEM filtrar user_id → aceita ids de outros pacientes. Correção: validar cada reference_id contra o treino; ler intensidade do banco; filtrar user_id.

NÃO VERIFICOU: estado REAL do banco em produção (quais triggers/policies/índices instalados); não executou requisições; não mediu pontos já indevidos; RLS de fitness_point_transactions/ranking_participants/challenge_participants não auditada.

---

## 3) DADOS-PRIVACIDADE

VEREDITO: BLOQUEADO

**[BLOQUEANTE] 20260228_...:276 (+ points-server.ts:178-189, points/award:26-36)**
reference_id UUID solto — sem FK, sem ref_kind, sem NOT NULL, sem checagem de existência; endpoint aceita do corpo sem validar. Loop de 200 com UUID novo → 200 tx de 50 pts. Correção: ref_kind NOT NULL + UNIQUE(user_id,reason,ref_kind,reference_id) + trigger BEFORE INSERT valida existência e user_id; tabela de caps no banco. Query de prova de reference_id órfão fornecida.

**[BLOQUEANTE] 20260228_...:264-282 — nenhuma unique constraint em fitness_point_transactions**
Só idx comuns. Dedup 100% ler-depois-inserir (app, triggers, caps de feed). TOCTOU em READ COMMITTED: N concorrentes leem COUNT=0 e todas inserem. 30 inserts de água paralelos → 30×5. Correção: coluna ref_date DATE + UNIQUE parcial por dia SP e por reference_id; INSERT ON CONFLICT DO NOTHING; só incrementa leaderboard se FOUND.

**[BLOQUEANTE] 20260429:45 e :84 (+ 20260501:53) — dedup por dia de criação vs NEW.data do cliente**
Mesmo achado dos outros: data retroativa (passada OU futura) credita sempre. 400 datas × 3 sono = 1200; + água/refeição ≈ 7 mil pts em minutos; tudo com created_at hoje → entra na janela do desafio; resync não remove. Correção: ref_date=NEW.data + dedup por ele; CHECK data recente; CHECK quantidade_ml 1..3000; UNIQUE(user_id,data) em sleep.

**[BLOQUEANTE] app/api/activities/route.ts:269-297 (+ 20260228_...:286-302) — reversão quebrada e assimétrica**
(1) DELETE das tx usa client do USUÁRIO; fitness_point_transactions não tem policy DELETE para client → apaga 0 linhas (supabase-js não erra), mas ainda chama RPC com -pointsReverted. (2) Reversão passa p_allowed_ranking_categories:null e a RPC (20260418:41-47) PULA rankings de categoria quando whitelist é nula — mas o crédito original passou ['workout']. Ganha na categoria e nunca perde. Mesmo padrão em meals/[id]:105-109 e workouts/[id]:146-152. Ciclo criar/apagar 100× → 100 tx vivas + 1000 pts na categoria; resync consolida. Correção: RPC única SECURITY DEFINER que apaga tx + aplica delta negativo com as MESMAS categorias, retornando linhas apagadas; rotas usam admin client e abortam se deleted=0. Query de divergência total_points vs SUM fornecida.

**[IMPORTANTE] points-server.ts:54-55 e 20260514:18-40**
(a) Comentário de cap de activities é falso. (b) 20260514 recriou fn_auto_award_sleep_logged inteira para corrigir fuso e DESFEZ a regra escalonada de 20260501 (6/3/0 por hora dormida, exigência de hora_dormir): versão final volta a 3 pts fixos para qualquer sono. Como migrations rodam à mão, comportamento em produção depende de qual arquivo rodou por último. Correção: cap no banco; não reescrever corpo inteiro de função em fix pontual (extrair fitness_sp_day()). Query prosrc de prova fornecida.

PRIVACIDADE:
**[IMPORTANTE] fitness_ranking_participants policy FOR SELECT USING (TRUE)** — qualquer autenticado lê total_points de todos, contornando opt-out ranking_visivel (respeitado só na view). Correção: restringir policy ou servir só via RPC que filtra opt-out; checar base legal com jurídico (dado de saúde por inferência).
**[IMPORTANTE] fitness_point_transactions.reason/notas** — texto livre com contexto clínico; sem retenção/expurgo; leituras por service_role apagam trilha de acesso. Correção: retenção + expurgo/anonimização; vocabulário fechado; auditoria de acesso administrativo.
**[OPCIONAL] policy INSERT de profissional** exige só awarded_by=auth.uid()+ativo, não vínculo com cliente atribuído. Correção: espelhar EXISTS de fitness_client_assignments no WITH CHECK.

Forneceu plano de rollback SQL e aviso: limpar duplicatas antes de criar índice único.

---

## 4) CONFIABILIDADE

VEREDITO: BLOQUEADO (confirmou: nenhum índice único em fitness_point_transactions, 20260228_...:280-282 só comuns).

**[BLOQUEANTE][crítico] points-server.ts:178-222 (+ feed:231-262, triggers 20260429:39-53)**
Todo dedup SELECT-depois-INSERT sem constraint. 10 POSTs paralelos mesmo {action,reference_id} → 10 créditos. Cap de posts furável (5 paralelos=5×4). Triggers concorrentes de água → 2×5. points/award aceita reference_id arbitrário → UUID novo=crédito novo sem corrida. resync não remove duplicatas de reference_ids distintos — consolida. Correção: índice único parcial + por dia SP; INSERT ON CONFLICT; incrementa leaderboard só se linha entrou; parar de aceitar reference_id livre.

**[BLOQUEANTE][alto] points-server.ts:229-250 e feed:253-272 — crédito em duas escritas sem transação**
Se INSERT extrato passa e RPC fitness_award_points_to_user falha (236-238) → só console.error, retorna success:true → extrato+desafio mostram, leaderboard não. No feed é o inverso (insert sem checar error + RPC roda mesmo assim). 3 fontes divergem em silêncio; só o resync manual conserta. Correção: uma única função SQL (transação); checar error de cada escrita.

**[BLOQUEANTE][alto] workouts/[id]:89-171 (+ activities:279-303, meals/[id]:61-110) — reversão multi-passo sem transação nem checar error**
(a) delete de tx falha em silêncio + treino apagado → 15 pts órfãos; recria → resync grava 30. (b) delete final do treino falha → pts já saíram mas treino fica; retry não acha tx — perda permanente. (c) 2 DELETEs paralelos → RPC decrementa 2× (clamp mascara). (d) meals: countBefore lido antes do delete; 2 deletes paralelos com 4 refeições leem 4→3 e nenhum reverte; termina com 2 refeições e 10 pts mantidos. Correção: função SQL transacional; em meals contar após o delete na mesma transação.

**[IMPORTANTE][médio] cron/weekly-adherence:44-54**
(a) reference_id=wkadh-${weekStart} deriva do dia da execução; se falha segunda e roda terça, weekStart muda → mesmos pacientes ganham 10 de novo pela mesma semana. (b) se CRON_SECRET indefinido, guard compara "Bearer undefined" — qualquer um aciona → farm de 10/dia mudando a janela. Correção: weekStart = segunda canônica da semana encerrada; falhar 500 se !CRON_SECRET.

**[IMPORTANTE][baixo] challenge-score.ts:69-99**
Quando RPC fitness_challenge_scores falha (e SEMPRE falha hoje — migration 20260723 pendente no self-hosted), erro descartado sem log (76) → fallback N queries com .limit(5000) que trunca em silêncio. Correção: console.warn; rodar migration; paginar/erro explícito.

Forneceu lista de monitoramento 24h (queries de duplicatas, divergência, órfãs, logs Vercel).

---

## 5) QA-TESTES

VEREDITO: BLOQUEADO

EXECUÇÃO REAL: find/grep por testes = ZERO. Nenhum framework (jest/vitest/playwright/cypress) no package.json. Não há script `test` nem `typecheck`. `npx tsc --noEmit` = exit 0, MAS 8 dos 11 arquivos do núcleo têm `// @ts-nocheck` (points-server.ts, challenge-score.ts, points/award, feed, reactions, comments, meals/[id], workouts/[id]) → lógica de pontos fora da checagem de tipos. `npm run lint` = passou (só warnings).

**[BLOQUEANTE] Repositório sem suíte de testes.** Todo o sistema de pontos 100% não coberto; brechas não detectáveis antes do deploy; correções sem rede contra regressão.
**[BLOQUEANTE] points-server.ts:178-208** dedup ler-depois-inserir sem índice único (confirmou 20260228_...:280-282 só comuns). Sem teste de concorrência.
**[BLOQUEANTE] activities:127-136** cap inexistente; dedup só por activity.id; duration/intensity sem plausibilidade.
**[IMPORTANTE] points/award:26-36** ações auto-declaradas; reference_id livre contorna dedup diário.
**[IMPORTANTE] meals/[id] e workouts/[id]** reversão assimétrica; `tx[0].points || ALL_MEALS_POINTS` assume tx única (falha com duplicatas).

Propôs 14 casos de teste (cap activities; corridas no dedup por dia e por reference_id; reference_id como bypass; ação sem fato; delete/recriar; reversão com duplicatas; virada do dia BRT; triggers vs helper; caps de feed; invariante global SUM==total_points; paridade CLAUDE.md↔código [CLAUDE.md diz PR:10/Post:2, código tem pr_achieved:3/post_created:4]; resync idempotente) e um roteiro de teste MANUAL de 10 passos no console para provar as brechas hoje.

---

## 6) ADVOGADO-DO-DIABO

VEREDITO: BLOQUEADO. "O grupo vai listar os caps de feed (bem feitos) e passar batido pelos dois lugares onde o dinheiro está: a chave de dedup aritmeticamente errada e o endpoint que credita sem verificação."

**[BLOQUEANTE] points/award:26-36 + points-server.ts:178-189** — "impressora de pontos autoatendida". streak_30=50/req com reference_id novo → 10.000 pts em ~1 min colado no console. pr_achieved sem reference_id pula verificação. Ninguém vê porque tratam awardPointsServer como camada de segurança — mas o docblock diz "Bypasses auth". Correção: só ações reconferíveis no servidor; streak/workout/weekly/all_meals/pr inalcançáveis por HTTP do paciente.

**[BLOQUEANTE] activities:101-136** — "a brecha que o paciente comum acha sozinho, SEM console": /treino → Adicionar atividade → muito intensa → salvar → repetir. 10 pts/toque, 30 toques=300 pts/dia vs teto honesto ~55. `body.date` sem validação (seletor de dia já manda datas passadas); atividade em data≠hoje nunca pode ser apagada (PATCH/DELETE exigem hoje) → pts permanentes até contra o honesto. Comentário falso de cap escapou a todos. Correção: cap diário real; recusar date≠hoje; apagar comentário.

**[BLOQUEANTE] 20260429:45,84 e 20260501:53** — dedup por dia-de-criação vs dia-de-referência. `data` diferente de hoje credita em toda inserção, para sempre. Insert direto com anon key (use-water-log.ts:159-166). +5/água, +10/refeição(≥3ª), +6/sono; sleep sem UNIQUE(user_id,data). Fere o honesto (registrar água esquecida credita 2º +5). Ninguém vê: histórico de "timezone já corrigido" criou a crença; o fuso está certo, o CAMPO comparado é que está errado. Correção: reference_date + UNIQUE; negar data fora de janela curta.

**[IMPORTANTE] award-workout-complete:55,87-100,116-121** — (a) oldStreak vem do cliente e é o único lado da transição → {workoutId:<treino antigo meu>,oldStreak:0} = 65 pts/dia (streak_7+30) sem treinar; (b) cardioAwards[] não valida que é cardio/pertence ao treino/intensidade real → 10/id (200 exercícios=2000); (c) prSetIds[] só passa por prHasPriorHistory (verifica se o EXERCÍCIO tem PR em outro treino, nunca se ESTE set bateu recorde) → 3 pts por set com histórico. Ninguém vê: "PR agora é autoritativo no servidor" vale para a coluna is_pr, mas esta rota nunca lê is_pr — credita pela lista do cliente. Correção: derivar oldStreak, prSetIds e cardioAwards do banco a partir do workoutId.

**[IMPORTANTE] 20260228_...:264-281 + resync.ts:70-139** — sem UNIQUE; duplo toque no celular basta (dois inserts de água concorrentes, retry do PWA offline). É a explicação mais provável das "pontuações estranhas" de gente que NÃO trapaceia. resync só limpa PR fantasma+feed; água/refeição/sono/treino/streak/atividade duplicados nunca são limpos e são somados de volta (linha 227). Correção: UNIQUE parcial + ON CONFLICT; estender computeRemovals para duplicatas por dia em todas as razões.

PERGUNTAS SEM RESPOSTA: (1) alguém mediu pts/dia por paciente para separar farm de uso legítimo antes de premiar o desafio? (2) qual o teto honesto de pts/dia definido pelo produto? (não está em CLAUDE.md nem no plano) (3) existe rate limiting? (grep: só inbody/analyze e meals/analyze, para API externa — nenhum nas rotas de pontos).

RISCO NÃO DITO EM VOZ ALTA: o ranking atual não é confiável e não dá para separar trapaça de duplo-crédito do sistema — as duas produzem a MESMA linha (source='automatic', sem origem, sem data de referência). Premiar sobre esse placar premia quem tocou 30× num botão. Corrigir o código sem rebaselinar o histórico deixa o problema congelado no ranking.
