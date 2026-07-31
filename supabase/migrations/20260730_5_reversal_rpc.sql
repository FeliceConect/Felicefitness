-- ============================================================
-- REVERSÃO ATÔMICA E SIMÉTRICA DE PONTOS
-- Data: 2026-07-30 (revisado após revisão adversarial)
-- ------------------------------------------------------------
-- As rotas de DELETE (atividade / refeição / treino) revertiam pontos com dois
-- problemas: apagavam a transação com o client do usuário (sem policy de DELETE
-- → apagava 0 linhas em silêncio) e estornavam o leaderboard com categorias
-- erradas (ganhava na categoria e nunca perdia).
--
-- Estas funções fazem a reversão numa única operação, com dois cuidados extras
-- vindos da revisão:
--   • CONCORRÊNCIA: o estorno deriva do DELETE ... RETURNING — só reverte o que
--     ESTA chamada realmente apagou. Duplo-clique / retry apagam conjuntos
--     disjuntos (a 2ª chamada apaga 0 e estorna 0), sem estorno em dobro.
--   • ACESSO: são SECURITY DEFINER e aceitam p_user_id arbitrário; por isso o
--     EXECUTE é REVOGADO de PUBLIC/anon/authenticated e concedido só a
--     service_role. Sem isso, um paciente chamaria a RPC pela REST API para
--     apagar/estornar pontos de OUTRO paciente (IDOR).
--
-- O mapa categoria→categorias-de-ranking espelha TX_TO_RANKING_CATEGORIES em
-- lib/services/points-server.ts. NULL = só rankings globais.
-- ============================================================

CREATE OR REPLACE FUNCTION fitness_ranking_categories_for(p_category TEXT)
RETURNS TEXT[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_category
    WHEN 'nutrition'   THEN ARRAY['nutrition']
    WHEN 'workout'     THEN ARRAY['workout']
    WHEN 'consistency' THEN ARRAY['consistency']
    WHEN 'sleep'       THEN ARRAY['consistency']
    WHEN 'hydration'   THEN ARRAY['consistency']
    WHEN 'wellness'    THEN ARRAY['consistency']
    ELSE NULL
  END;
$$;

-- Reverte créditos identificados por reference_id (treino, PR, cardio, atividade…).
CREATE OR REPLACE FUNCTION fitness_revert_points_by_reference(
  p_user_id       UUID,
  p_reference_ids UUID[],
  p_reasons       TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r       RECORD;
  v_total INTEGER := 0;
BEGIN
  IF p_reference_ids IS NULL OR array_length(p_reference_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Apaga e captura o que foi REALMENTE apagado nesta transação; agrupa por
  -- categoria para estornar o leaderboard com as categorias corretas.
  FOR r IN
    WITH deleted AS (
      DELETE FROM fitness_point_transactions
      WHERE user_id = p_user_id
        AND reference_id = ANY(p_reference_ids)
        AND (p_reasons IS NULL OR reason = ANY(p_reasons))
      RETURNING category, points
    )
    SELECT category, COALESCE(SUM(points), 0) AS pts
    FROM deleted GROUP BY category
  LOOP
    IF r.pts <> 0 THEN
      PERFORM fitness_award_points_to_user(
        p_user_id, -r.pts, fitness_ranking_categories_for(r.category)
      );
      v_total := v_total + r.pts;
    END IF;
  END LOOP;

  RETURN v_total;
END;
$$;

-- Reverte um crédito diário automático sem reference_id (ex.: "Todas refeicoes
-- registradas") pelo dia de referência.
CREATE OR REPLACE FUNCTION fitness_revert_daily_award(
  p_user_id        UUID,
  p_reason         TEXT,
  p_reference_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r       RECORD;
  v_total INTEGER := 0;
BEGIN
  FOR r IN
    WITH deleted AS (
      DELETE FROM fitness_point_transactions
      WHERE user_id = p_user_id
        AND reason = p_reason
        AND source = 'automatic'
        AND reference_id IS NULL
        AND reference_date = p_reference_date
      RETURNING category, points
    )
    SELECT category, COALESCE(SUM(points), 0) AS pts
    FROM deleted GROUP BY category
  LOOP
    IF r.pts <> 0 THEN
      PERFORM fitness_award_points_to_user(
        p_user_id, -r.pts, fitness_ranking_categories_for(r.category)
      );
      v_total := v_total + r.pts;
    END IF;
  END LOOP;

  RETURN v_total;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- ACESSO: só o backend (service_role) chama estas funções. Fecha o IDOR de
-- reverter/creditar pontos de terceiros pela REST API. As funções SECURITY
-- DEFINER e os triggers continuam podendo chamá-las internamente (rodam como
-- dono). Inclui fitness_award_points_to_user (falha pré-existente: authenticated
-- podia se auto-creditar pontos ilimitados no leaderboard).
-- ─────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION fitness_revert_points_by_reference(UUID, UUID[], TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fitness_revert_daily_award(UUID, TEXT, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fitness_ranking_categories_for(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fitness_award_points_to_user(UUID, INTEGER, TEXT[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION fitness_revert_points_by_reference(UUID, UUID[], TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION fitness_revert_daily_award(UUID, TEXT, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION fitness_ranking_categories_for(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION fitness_award_points_to_user(UUID, INTEGER, TEXT[]) TO service_role;
