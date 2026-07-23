-- ============================================================
-- RPC de agregação do placar de desafios
-- ------------------------------------------------------------
-- Motivação: o placar de um desafio é a SOMA dos pontos que cada
-- participante ganhou dentro do período (fitness_point_transactions).
-- O cálculo em JS fazia UMA query por participante (SUM em memória),
-- resultando em N idas ao banco por desafio. Esta função faz o
-- SUM(points) ... GROUP BY user_id em UM único statement.
--
-- Segurança: SECURITY INVOKER (padrão). Chamada pelo service role
-- (rotas /api/challenges) ela vê tudo; se algum dia for chamada por um
-- usuário comum, a RLS de fitness_point_transactions ainda se aplica —
-- sem brecha para ler pontos de terceiros.
--
-- Compatível com o helper computeChallengeScores, que faz fallback para
-- a soma por-usuário caso esta função ainda não exista (deploy antes da
-- migration não quebra nada).
-- ============================================================

CREATE OR REPLACE FUNCTION fitness_challenge_scores(
  p_user_ids UUID[],
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (user_id UUID, score BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT t.user_id, COALESCE(SUM(t.points), 0)::BIGINT AS score
  FROM fitness_point_transactions t
  WHERE t.user_id = ANY(p_user_ids)
    AND t.created_at >= p_start
    AND t.created_at <= p_end
    AND (p_categories IS NULL OR t.category = ANY(p_categories))
  GROUP BY t.user_id;
$$;

COMMENT ON FUNCTION fitness_challenge_scores IS
  'Soma pontos (fitness_point_transactions) por usuário dentro de uma janela [p_start, p_end], opcionalmente filtrando por categorias (p_categories NULL = todas). Usada pelo placar de desafios (computeChallengeScores) para agregar em uma única query em vez de N.';

-- Índice de apoio para o filtro (user_id, created_at) — acelera tanto a
-- RPC quanto o fallback por-usuário.
CREATE INDEX IF NOT EXISTS idx_point_tx_user_created
  ON fitness_point_transactions (user_id, created_at);
