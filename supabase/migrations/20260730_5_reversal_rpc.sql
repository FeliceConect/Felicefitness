-- ============================================================
-- REVERSÃO ATÔMICA E SIMÉTRICA DE PONTOS
-- Data: 2026-07-30
-- ------------------------------------------------------------
-- As rotas de DELETE (atividade / refeição / treino) revertiam pontos com
-- dois problemas:
--   • apagavam a transação com o client do usuário (que não tem policy de
--     DELETE em fitness_point_transactions) → apagava 0 linhas em silêncio;
--   • aplicavam o estorno no leaderboard com categorias = NULL, enquanto o
--     crédito original tinha categoria (ex.: 'workout') → ganhava no ranking
--     de categoria e nunca perdia.
--
-- Estas duas funções SECURITY DEFINER fazem a reversão numa única operação,
-- estornando o leaderboard com AS MESMAS categorias do crédito e apagando as
-- transações. Retornam o total de pontos revertidos.
--
-- O mapa categoria-da-transação → categorias-de-ranking espelha
-- TX_TO_RANKING_CATEGORIES em lib/services/points-server.ts. NULL = só
-- rankings globais (igual ao crédito de social/form/bio/bônus).
-- ============================================================

-- Mapa auxiliar categoria → categorias de ranking (mesmo do points-server.ts).
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

  -- Estorna o leaderboard por categoria ANTES de apagar as transações.
  FOR r IN
    SELECT category, COALESCE(SUM(points), 0) AS pts
    FROM fitness_point_transactions
    WHERE user_id = p_user_id
      AND reference_id = ANY(p_reference_ids)
      AND (p_reasons IS NULL OR reason = ANY(p_reasons))
    GROUP BY category
  LOOP
    IF r.pts <> 0 THEN
      PERFORM fitness_award_points_to_user(
        p_user_id, -r.pts, fitness_ranking_categories_for(r.category)
      );
      v_total := v_total + r.pts;
    END IF;
  END LOOP;

  DELETE FROM fitness_point_transactions
  WHERE user_id = p_user_id
    AND reference_id = ANY(p_reference_ids)
    AND (p_reasons IS NULL OR reason = ANY(p_reasons));

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
    SELECT category, COALESCE(SUM(points), 0) AS pts
    FROM fitness_point_transactions
    WHERE user_id = p_user_id
      AND reason = p_reason
      AND source = 'automatic'
      AND reference_id IS NULL
      AND reference_date = p_reference_date
    GROUP BY category
  LOOP
    IF r.pts <> 0 THEN
      PERFORM fitness_award_points_to_user(
        p_user_id, -r.pts, fitness_ranking_categories_for(r.category)
      );
      v_total := v_total + r.pts;
    END IF;
  END LOOP;

  DELETE FROM fitness_point_transactions
  WHERE user_id = p_user_id
    AND reason = p_reason
    AND source = 'automatic'
    AND reference_id IS NULL
    AND reference_date = p_reference_date;

  RETURN v_total;
END;
$$;
