-- CORREÇÃO: as funções de estorno nunca chegaram a estornar.
--
-- Em 20260730_5 as duas funções fazem:
--     SELECT category, COALESCE(SUM(points), 0) AS pts ...
--     PERFORM fitness_award_points_to_user(p_user_id, -r.pts, ...)
--
-- SUM() sobre INTEGER devolve BIGINT, e fitness_award_points_to_user recebe
-- INTEGER. Resultado: sempre que havia algo real para estornar, o PERFORM
-- estourava com
--     42883: function fitness_award_points_to_user(uuid, bigint, text[]) does not exist
-- e a transação inteira era revertida — inclusive o DELETE das transações.
--
-- Como as rotas chamam a RPC pelo supabase-js SEM checar `error` (o client não
-- lança), o estorno falhava EM SILÊNCIO: apagar treino/atividade/refeição ou
-- desfazer uma reação removia o registro e devolvia "sucesso", mas os pontos
-- continuavam no ranking. Rotas afetadas:
--   • DELETE /api/workouts/[id]            (treino, PRs, cardio)
--   • DELETE /api/activities                (atividade avulsa)
--   • DELETE /api/meals/[id]                (refeição — crédito diário)
--   • DELETE /api/feed/[id]/reactions       (toggle-off da reação)
--
-- Descoberto em 2026-08-07 ao estornar os créditos de cardio duplicados.
-- Correção: somar já como INTEGER. O resto do corpo é idêntico ao original.

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

  FOR r IN
    WITH deleted AS (
      DELETE FROM fitness_point_transactions
      WHERE user_id = p_user_id
        AND reference_id = ANY(p_reference_ids)
        AND (p_reasons IS NULL OR reason = ANY(p_reasons))
      RETURNING category, points
    )
    SELECT category, COALESCE(SUM(points), 0)::INTEGER AS pts
    FROM deleted GROUP BY category
  LOOP
    IF r.pts <> 0 THEN
      PERFORM fitness_award_points_to_user(
        p_user_id, (-r.pts)::INTEGER, fitness_ranking_categories_for(r.category)
      );
      v_total := v_total + r.pts;
    END IF;
  END LOOP;

  RETURN v_total;
END;
$$;

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
    SELECT category, COALESCE(SUM(points), 0)::INTEGER AS pts
    FROM deleted GROUP BY category
  LOOP
    IF r.pts <> 0 THEN
      PERFORM fitness_award_points_to_user(
        p_user_id, (-r.pts)::INTEGER, fitness_ranking_categories_for(r.category)
      );
      v_total := v_total + r.pts;
    END IF;
  END LOOP;

  RETURN v_total;
END;
$$;

-- CREATE OR REPLACE preserva os grants, mas reafirmamos: só o backend estorna.
REVOKE ALL ON FUNCTION fitness_revert_points_by_reference(UUID, UUID[], TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fitness_revert_daily_award(UUID, TEXT, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fitness_revert_points_by_reference(UUID, UUID[], TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION fitness_revert_daily_award(UUID, TEXT, DATE) TO service_role;
