-- ============================================================
-- COLUNA "notas" EM fitness_point_transactions
-- Data: 2026-04-27
-- ------------------------------------------------------------
-- Acrescenta uma coluna textual livre para complementar a transação
-- de pontos (ex: URL do post Instagram validado, justificativa de
-- bônus, observação livre do profissional).
--
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

ALTER TABLE fitness_point_transactions
  ADD COLUMN IF NOT EXISTS notas TEXT;

-- Índice para suportar dedup por URL no caso do Instagram
-- (busca: "user_id + reason='Post no Instagram com #vivendofelice' + notas LIKE '%url%'")
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_reason
  ON fitness_point_transactions(user_id, reason);
