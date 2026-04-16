-- ============================================================
-- RPC atômica para atualização de pontos do ranking
-- ------------------------------------------------------------
-- Motivação: o padrão atual read-then-update em JavaScript (ler
-- total_points, somar delta, escrever de volta) sofre de race condition
-- quando duas transações ocorrem no mesmo instante — a segunda escrita
-- sobrescreve a primeira, perdendo pontos silenciosamente.
--
-- Esta função consolida a lógica em UM statement SQL atômico por ranking,
-- usando INSERT ... ON CONFLICT DO UPDATE (UPSERT). Requer a unique
-- constraint UNIQUE(ranking_id, user_id) que já existe na tabela.
-- ============================================================

CREATE OR REPLACE FUNCTION fitness_award_points_to_user(
  p_user_id UUID,
  p_delta INTEGER,
  p_allowed_ranking_categories TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  touched INTEGER := 0;
BEGIN
  -- Noop se delta for zero
  IF p_delta = 0 THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT id, type, category
    FROM fitness_rankings
    WHERE is_active = true
  LOOP
    -- Rankings de categoria: só atualizam se r.category estiver na whitelist
    -- passada pelo caller. NULL ou array vazio = não participa de rankings
    -- de categoria (fica apenas nos globais).
    IF r.type = 'category' AND r.category IS NOT NULL THEN
      IF p_allowed_ranking_categories IS NULL
         OR array_length(p_allowed_ranking_categories, 1) IS NULL
         OR NOT (r.category = ANY(p_allowed_ranking_categories)) THEN
        CONTINUE;
      END IF;
    END IF;

    -- UPSERT atômico: cria participant com max(0, delta) se não existe,
    -- ou incrementa atomicamente se existe (não baixa de 0).
    INSERT INTO fitness_ranking_participants (ranking_id, user_id, total_points)
    VALUES (r.id, p_user_id, GREATEST(0, p_delta))
    ON CONFLICT (ranking_id, user_id)
    DO UPDATE SET total_points = GREATEST(
      0,
      fitness_ranking_participants.total_points + p_delta
    );

    touched := touched + 1;
  END LOOP;

  RETURN touched;
END;
$$;

COMMENT ON FUNCTION fitness_award_points_to_user IS
  'Incremento atômico de total_points para todos os rankings ativos do usuário. Use p_allowed_ranking_categories para restringir rankings de categoria. Substitui o padrão read-then-update em JS, eliminando race conditions concorrentes.';
