-- ============================================================
-- FUNDAÇÃO DE DEDUP DE PONTOS — reference_date + limpeza + índices únicos
-- Data: 2026-07-30
-- ------------------------------------------------------------
-- Corrige a causa-raiz de "pontuações estranhas": todo o dedup do
-- sistema era "ler-depois-inserir" na aplicação/trigger, SEM nenhuma
-- constraint no banco. Sob concorrência (duplo toque, retry do PWA,
-- requisições paralelas) o mesmo crédito entrava N vezes.
--
-- O que este arquivo faz, NESTA ORDEM (a ordem importa):
--   1. Adiciona a coluna reference_date (o DIA a que o crédito se refere,
--      no fuso de São Paulo). É a chave de dedup correta — antes o dedup
--      comparava created_at (dia em que a linha entrou) com a data do fato,
--      o que nunca batia para registros de outro dia.
--   2. Backfill de reference_date para o extrato existente.
--   3. LIMPEZA das duplicatas já gravadas (mantém a MAIS ANTIGA de cada
--      chave — o crédito legítimo — e apaga as repetições).
--   4. Cria os índices ÚNICOS parciais que passam a IMPEDIR duplicata no
--      banco. Só é possível criar DEPOIS da limpeza (senão o CREATE falha).
--
-- ⚠️ Esta migration REMOVE transações duplicadas → muda total de pontos de
--    quem foi creditado em dobro. Rode o resync do ranking DEPOIS dela para
--    reconstruir os leaderboards a partir do extrato limpo. Ver runbook.
--
-- Idempotente: pode rodar novamente sem efeito colateral.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) Coluna reference_date
-- ─────────────────────────────────────────────────────────────
ALTER TABLE fitness_point_transactions
  ADD COLUMN IF NOT EXISTS reference_date DATE;

-- ─────────────────────────────────────────────────────────────
-- 2) Backfill: dia do fato = dia de criação no fuso de São Paulo.
--    (Aproximação segura: para o extrato antigo, o dia de criação é o
--     melhor proxy do dia a que o crédito se refere.)
-- ─────────────────────────────────────────────────────────────
UPDATE fitness_point_transactions
   SET reference_date = (created_at AT TIME ZONE 'America/Sao_Paulo')::date
 WHERE reference_date IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 3) LIMPEZA de duplicatas já gravadas
--    Mantém a linha de menor created_at (empate: menor id) por chave.
-- ─────────────────────────────────────────────────────────────

-- 3a) Créditos diários automáticos (sem reference_id): chave =
--     (user_id, reason, source, reference_date)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, reason, source, reference_date
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM fitness_point_transactions
  WHERE reference_id IS NULL
    AND source = 'automatic'
)
DELETE FROM fitness_point_transactions t
USING ranked r
WHERE t.id = r.id AND r.rn > 1;

-- 3b) Créditos com reference_id (treino, PR, cardio, atividade, post…):
--     chave = (user_id, reason, reference_id)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, reason, reference_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM fitness_point_transactions
  WHERE reference_id IS NOT NULL
)
DELETE FROM fitness_point_transactions t
USING ranked r
WHERE t.id = r.id AND r.rn > 1;

-- ─────────────────────────────────────────────────────────────
-- 4) Índices ÚNICOS parciais — a invariante que faltava
-- ─────────────────────────────────────────────────────────────

-- Um crédito diário por (user, razão, origem, dia de referência).
CREATE UNIQUE INDEX IF NOT EXISTS ux_points_daily
  ON fitness_point_transactions (user_id, reason, source, reference_date)
  WHERE reference_id IS NULL;

-- Um crédito por (user, razão, evento referenciado).
CREATE UNIQUE INDEX IF NOT EXISTS ux_points_reference
  ON fitness_point_transactions (user_id, reason, reference_id)
  WHERE reference_id IS NOT NULL;

-- Índice de apoio para as buscas de dedup por dia.
CREATE INDEX IF NOT EXISTS idx_points_user_refdate
  ON fitness_point_transactions (user_id, reason, reference_date);
