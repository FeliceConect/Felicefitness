-- fitness_award_points_to_user criava participante "fantasma" ao estornar.
--
-- A função faz UPSERT:
--     INSERT INTO fitness_ranking_participants (..., total_points)
--     VALUES (r.id, p_user_id, GREATEST(0, p_delta))
--     ON CONFLICT DO UPDATE SET total_points = GREATEST(0, total_points + p_delta)
--
-- Com p_delta NEGATIVO (estorno) e o paciente SEM linha naquele ranking, o
-- INSERT vencia: criava a linha com GREATEST(0, -5) = 0. Resultado: quem estava
-- fora do ranking passava a aparecer com 0 pontos.
--
-- Isso aconteceu de verdade em 2026-08-07, na limpeza dos créditos órfãos de
-- reação: duas pacientes que não constavam do Ranking Geral ganharam linha com
-- 0. As linhas foram removidas na mesma operação.
--
-- Importa porque ausência de linha É o jeito de remover alguém de um ranking
-- (ex.: promoção a Gestor). Um estorno nunca pode readmitir ninguém.
--
-- Correção: delta positivo faz UPSERT (comportamento original); delta negativo
-- só ATUALIZA linha que já existe. Nada mais muda.

CREATE OR REPLACE FUNCTION fitness_award_points_to_user(
  p_user_id                     UUID,
  p_delta                       INTEGER,
  p_allowed_ranking_categories  TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r       RECORD;
  touched INTEGER := 0;
BEGIN
  IF p_delta = 0 THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT id, type, category
    FROM fitness_rankings
    WHERE is_active = true
  LOOP
    -- Rankings de categoria: só atualizam se r.category estiver na whitelist
    IF r.type = 'category' AND r.category IS NOT NULL THEN
      IF p_allowed_ranking_categories IS NULL
         OR array_length(p_allowed_ranking_categories, 1) IS NULL
         OR NOT (r.category = ANY(p_allowed_ranking_categories)) THEN
        CONTINUE;
      END IF;
    END IF;

    IF p_delta > 0 THEN
      -- Crédito: UPSERT atômico (usa UNIQUE(ranking_id, user_id))
      INSERT INTO fitness_ranking_participants (ranking_id, user_id, total_points)
      VALUES (r.id, p_user_id, p_delta)
      ON CONFLICT (ranking_id, user_id)
      DO UPDATE SET total_points = GREATEST(
        0,
        fitness_ranking_participants.total_points + p_delta
      );
      touched := touched + 1;
    ELSE
      -- Estorno: só mexe em quem JÁ participa. Sem linha, não há o que estornar
      -- — e criar uma readmitiria ao ranking quem foi removido de propósito.
      UPDATE fitness_ranking_participants
      SET total_points = GREATEST(0, total_points + p_delta)
      WHERE ranking_id = r.id AND user_id = p_user_id;

      IF FOUND THEN
        touched := touched + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN touched;
END;
$$;

REVOKE ALL ON FUNCTION fitness_award_points_to_user(UUID, INTEGER, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fitness_award_points_to_user(UUID, INTEGER, TEXT[]) TO service_role;
