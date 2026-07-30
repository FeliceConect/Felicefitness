# Veredito consolidado do revisor-chefe — Auditoria de pontuação (2026-07-30)

VEREDITO: NÃO SUBIR / placar atual não serve de base para premiação.

## BLOQUEANTES (A)
1. Rotas de pontos creditam a partir do corpo da requisição, sem reconstruir o fato no servidor — CONFIRMADO, 6/6.
   - `app/api/points/award/route.ts:26-36` → `lib/services/points-server.ts:156-208`: valida só action∈POINT_VALUES, reference_id do corpo. UUID novo por chamada = crédito novo. streak_30 = +50/req, ilimitado. pr_achieved sem reference_id pula o guard. Sem checagem de role.
   - `app/api/points/award-workout-complete/route.ts:50-56,87-100,116-121`: só workoutId tem posse; cardioAwards[] e prSetIds[] aceitos crus (+10/item, PR com set de OUTRO paciente pois prHasPriorHistory não filtra user_id); oldStreak do corpo força streak_7+30.
2. Atividade avulsa: 10 pts por toque, pela interface, sem cap e sem console — CONFIRMADO, 6/6.
   - `app/api/activities/route.ts:101-136`: sem cap; dedup só por activity.id. 30 toques = 300 pts/dia. Comentário de cap em points-server.ts:55 é falso. body.date cru + PATCH/DELETE exigem hoje → atividade com data passada é irreversível.
3. Chave de dedup dos triggers aritmeticamente errada; no sono não há dedup nenhum — CONFIRMADO, 4/6 + achado do chefe.
   - `20260429_auto_award_triggers.sql:40-45,79-84,112-117`: compara created_at (hoje) com NEW.data (do cliente). data≠hoje credita sempre.
   - ACHADO NOVO DO CHEFE: `app/(app)/sono/registrar/page.tsx:28,31` fixa date=ontem (getDateOffsetSP(-1)); `use-sleep.ts:215-231` insere data=ontem. Logo o dedup de sono NUNCA bate: abrir "Registrar Sono" e salvar N vezes = 3 (ou 6) pts por toque, ilimitado, SEM DevTools. Explicação mais provável das "pontuações estranhas".
   - sleep sem UNIQUE(user_id,data); delete de sono não reverte ponto. Água/refeição têm a mesma chave errada (exploração exige data retroativa via insert direto, permitido pela RLS).
4. fitness_point_transactions SEM nenhuma constraint UNIQUE — todo dedup/cap é ler-depois-inserir — CONFIRMADO (varreu ~90 migrations), 5/6.
   - TOCTOU: N requisições paralelas creditam N×. Atinge o paciente honesto (duplo toque, retry do PWA).
5. Reversão de pontos não reverte; ciclo criar/apagar/criar alimenta o placar — CONFIRMADO no código.
   - `activities/route.ts:269-297` apaga tx com client do usuário (sem policy DELETE p/ client) → apaga 0 linhas em silêncio mas chama RPC negativa. Reversões passam categorias=null e a RPC pula rankings de categoria → ganha na categoria e nunca perde.

## IMPORTANTES (B)
6. Sem rate limiting em nenhuma rota de pontos (grep confirmou: nada, nem em inbody/meals analyze — falso positivo do AppSec corrigido).
7. Crédito em duas escritas sem transação (extrato/leaderboard/desafio divergem em silêncio).
8. Caps de feed TOCTOU + toggle-off de reação não reverte o ponto.
9. `client/meal-plan/complete` aceita date do corpo, sem dedup por (planMealId,date).
10. Cron weekly-adherence: reference_id deriva do dia de execução (retry duplica); "Bearer undefined" autentica se CRON_SECRET ausente.
11. Regressão de sono: 20260514 recriou a função e desfez a regra escalonada 6/3/0 de 20260501 → PROVÁVEL (depende de qual migration rodou por último).
12. Placar de desafio em fallback silencioso (RPC 20260723 pendente; erro sem log; .limit(5000) trunca).
13. Regra escrita ≠ código: CLAUDE.md diz PR 10/Post 2; código tem pr_achieved 3/post_created 4.

## PRIVACIDADE (C)
14. fitness_ranking_participants FOR SELECT USING (TRUE) → opt-out ranking_visivel é cosmético.
15. Policy INSERT de profissional sem vínculo com o cliente → qualquer profissional lança pontos p/ qualquer paciente.
16. reason/notas com contexto clínico, texto livre, sem retenção/expurgo/trilha de acesso.

## DÍVIDA (D)
17. Zero testes (sem script test/typecheck, sem framework).
18. // @ts-nocheck em 17 arquivos, incluindo todo o núcleo de pontos.
19. Não existe um "teto honesto de pontos/dia" acordado pelo produto.

## HISTÓRICO CONTAMINADO
O resync (resync.ts:214-238) só remove PR fantasma + excedente de feed; NÃO remove duplicatas de sono/água/refeição/atividade/streak e ainda as soma de volta em total_points. Rodar o resync agora grava o número inflado como oficial. Antes de premiar: rodar as queries de auditoria (passos 0-8 fornecidos), descontar excedentes, publicar critério aos pacientes.

## PLANO (resumo, com pré-requisitos)
1. Fechar a torneira hoje: desabilitar POST /api/points/award; cap diário + recusar date≠hoje em /api/activities.
2. Corrigir chave de dedup (reference_date nos 3 triggers). [pré-req de 4]
3. Auditar e LIMPAR duplicatas. [pré-req absoluto de 4 — CREATE UNIQUE INDEX falha com duplicatas]
4. Invariantes no banco: índices únicos + INSERT ON CONFLICT DO NOTHING. [depende de 2,3]
5. Derivar tudo do banco em award-workout-complete; filtrar user_id em prHasPriorHistory.
6. Unificar crédito+reversão numa função SQL transacional (mesmas categorias). [depende de 4]
7. Rate limit + teto diário no banco (requer decisão de produto sobre o teto).
8. Estender computeRemovals para duplicatas por dia em todas as razões. [depende de 2]
9. CRON_SECRET obrigatório + weekStart canônico; ignorar date em meal-plan/complete.
10. Rodar migration 20260723; logar fallback; decidir regra de sono.
11. Privacidade (14,15,16).
12. Testes (vitest) provando as brechas 1-5 + invariante SUM==total_points; depois remover @ts-nocheck.
