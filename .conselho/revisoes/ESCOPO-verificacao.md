# Verificação das correções de pontuação (revisão pós-implementação)

Implementamos as correções da auditoria. Agora verifique se estão CORRETAS e
COMPLETAS, e se NÃO introduziram regressão. NÃO conserte nada — só aponte.

## O que era pra ser corrigido (as 5 brechas bloqueantes)
1. Endpoint genérico POST /api/points/award creditava qualquer ação sem verificar.
2. /api/activities sem cap diário (farm de 10 pts por atividade).
3. Triggers de água/refeição/sono deduplicavam pela data errada (created_at vs NEW.data)
   → farm infinito por data retroativa; e a tela de sono grava com data de ontem.
4. fitness_point_transactions sem índice único → corrida duplicava crédito.
5. Reversão de pontos não revertia (delete com client sem policy; categorias erradas).
   + award-workout-complete confiava em prSetIds/cardioAwards/oldStreak do corpo.

## Material
- Diff focado: `.conselho/revisoes/diff-focado.patch` (leia primeiro).
- Migrations novas: `supabase/migrations/20260730_1..6_*.sql`.

## Verifique especificamente
- **Fechamento das brechas**: cada uma das 5 está de fato fechada pelo diff?
- **SQL correto**:
  - `ON CONFLICT (user_id, reason, source, reference_date) WHERE reference_id IS NULL DO NOTHING`
    — a sintaxe de inferência de índice PARCIAL está correta? Combina com o índice
    `ux_points_daily` (mesmo predicado)?
  - `GET DIAGNOSTICS ... = ROW_COUNT` depois de INSERT ON CONFLICT reflete se inseriu?
  - Trigger de streak: a condição de borda `OLD < N AND NEW >= N` evita re-award e
    cobre reset/recomeço? O trigger `AFTER UPDATE OF streak_atual` dispara certo?
  - RPC de reversão: o estorno usa as MESMAS categorias do crédito (simetria)?
    `fitness_ranking_categories_for` espelha TX_TO_RANKING_CATEGORIES?
  - Migration 1: a limpeza de duplicatas mantém a MAIS ANTIGA e o `CREATE UNIQUE INDEX`
    não falha depois dela? A ordem interna está certa?
  - Policies de privacidade: a de ranking respeita opt-in sem quebrar leitura do dono/admin;
    a de insert de profissional exige vínculo.
- **Regressões novas introduzidas**:
  - Fechar o POST /api/points/award quebra algum crédito legítimo? (água/refeição/sono
    viram trigger; treino/PR/cardio via award-workout-complete; form via forms/responses.)
  - O no-op de `awardPoints` (client) deixa alguma ação sem creditar?
  - award-workout-complete: derivar PR de `is_pr` e cardio de `cardio_intensity` cobre
    os mesmos casos que antes? O fallback 42703 é seguro?
  - O cap de atividade (2/dia) conta certo? Off-by-one? Backdate escapa?
  - O fallback de `reference_date` ausente (migration não rodou) deixa dedup furar de
    forma perigosa, ou só degrada temporariamente?
  - Reversão em meals: contar refeições NÃO-puladas após o delete está correto?
- **Streak duplo**: o bônus de streak foi REMOVIDO de award-workout-complete e movido
  pro trigger? Há risco de duplo crédito no período de transição?

Formato do seu perfil, máx 6 achados, cada um com arquivo:linha, o problema, e severidade.
