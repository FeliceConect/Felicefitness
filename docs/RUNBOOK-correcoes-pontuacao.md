# Runbook — Correções de integridade da pontuação (2026-07-30)

Ordem de execução OBRIGATÓRIA. As migrations rodam à mão no Supabase
self-hosted. **Rode TODAS as migrations ANTES de subir o código** — o código novo
usa a coluna `reference_date` e as RPCs de reversão; sem elas, degrada (há
fallback), mas o correto é migrar primeiro.

## 1. Backup

```sql
-- Snapshot do extrato antes de qualquer limpeza (permite auditoria/rollback).
CREATE TABLE bkp_point_tx_20260730 AS SELECT * FROM fitness_point_transactions;
CREATE TABLE bkp_ranking_parts_20260730 AS SELECT * FROM fitness_ranking_participants;
```

## 2. Rodar as migrations, NESTA ORDEM

1. `20260730_1_points_dedup_foundation.sql` — adiciona `reference_date`, faz
   backfill, **remove duplicatas já gravadas** (mantém a mais antiga de cada
   chave) e cria os índices únicos. ⚠️ Muda o total de quem foi creditado em
   dobro. Se o `CREATE UNIQUE INDEX` falhar por duplicata, rode as queries de
   auditoria (seção 5) e limpe o excedente antes de repetir.
2. `20260730_2_award_triggers_hardened.sql` — triggers de água/refeição/sono com
   dedup por `reference_date`, janela de data plausível e sono escalonado (6/3/0).
3. `20260730_3_streak_award_trigger.sql` — bônus de streak (7/30) no banco.
4. `20260730_4_cardio_intensity_column.sql` — coluna `cardio_intensity`.
5. `20260730_5_reversal_rpc.sql` — RPCs de reversão atômica.
6. `20260730_6_privacy_authz.sql` — opt-out do ranking + vínculo no insert de profissional.
7. `20260723_challenge_scores_rpc.sql` — se ainda estiver pendente (placar do desafio).

## 3. Reconstruir os leaderboards a partir do extrato limpo

Depois das migrations, rode o **resync do ranking** (rota admin de resync, que já
existe) para reconstruir `total_points` a partir do extrato já sem duplicatas.
Confira o "antes → depois" no preview antes de aplicar.

## 4. Conferir ambiente e subir o código

- Garanta que `CRON_SECRET` está definido na Vercel — o cron de aderência agora
  **falha (500)** se a variável faltar (antes, `Bearer undefined` autenticava
  qualquer um).
- Suba o deploy do código.

## 5. Queries de auditoria (medir o estrago / conferir a limpeza)

Rode ANTES da limpeza (para medir) e DEPOIS (para confirmar que zerou).

```sql
-- Duplicatas de crédito diário (deve voltar VAZIO após a migration 1)
SELECT user_id, reason, (created_at AT TIME ZONE 'America/Sao_Paulo')::date d, count(*)
FROM fitness_point_transactions
WHERE reference_id IS NULL AND source = 'automatic'
GROUP BY 1,2,3 HAVING count(*) > 1;

-- Duplicatas por evento referenciado (deve voltar VAZIO)
SELECT user_id, reason, reference_id, count(*)
FROM fitness_point_transactions
WHERE reference_id IS NOT NULL
GROUP BY 1,2,3 HAVING count(*) > 1;

-- Sono duplicado no mesmo dia (a brecha mais provável do farm)
SELECT user_id, count(*), sum(points)
FROM fitness_point_transactions
WHERE reason = 'Sono registrado'
GROUP BY 1 ORDER BY 3 DESC LIMIT 20;

-- Atividades avulsas acima do cap de 2/dia
SELECT user_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date d, count(*), sum(points)
FROM fitness_point_transactions
WHERE reason LIKE 'Atividade%'
GROUP BY 1,2 HAVING count(*) > 2 ORDER BY 4 DESC;

-- Divergência extrato x leaderboard (global) — deve zerar após o resync
SELECT rp.ranking_id, rp.user_id, rp.total_points,
       (SELECT COALESCE(SUM(points),0) FROM fitness_point_transactions t WHERE t.user_id = rp.user_id) AS soma
FROM fitness_ranking_participants rp
WHERE rp.total_points <> (SELECT COALESCE(SUM(points),0) FROM fitness_point_transactions t WHERE t.user_id = rp.user_id);
```

## 6. Rollback (se necessário)

```sql
-- Índices e coluna
DROP INDEX IF EXISTS ux_points_daily;
DROP INDEX IF EXISTS ux_points_reference;
DROP INDEX IF EXISTS idx_points_user_refdate;
-- (a coluna reference_date pode ficar; é aditiva e inofensiva)

-- Restaurar extrato/ranking do backup, se a limpeza precisar ser desfeita:
-- TRUNCATE fitness_point_transactions; INSERT INTO fitness_point_transactions SELECT * FROM bkp_point_tx_20260730;
-- (idem fitness_ranking_participants a partir de bkp_ranking_parts_20260730)
```

## 7. Próxima fase — auditoria do desafio (premiação)

Com o extrato limpo e os leaderboards reconstruídos, o placar do desafio já é
confiável (é somado ao vivo do extrato). Antes de premiar, rodar as queries da
seção 5 para confirmar que não há mais duplicata/farm no período do desafio e
comparar o "antes → depois" de cada participante.
