-- ============================================================
-- DEDUPE DE PRS POR TREINO (pós-batch)
-- Data: 2026-04-28
-- ------------------------------------------------------------
-- Trigger BEFORE INSERT em fitness_exercise_sets quebra quando o
-- hook insere todos os sets em uma única chamada .insert([...]):
-- nenhum trigger enxerga as linhas anteriores do batch (ainda
-- não commitadas), então TODOS os sets do mesmo exercício no
-- mesmo treino acabam marcados is_pr=TRUE e geram um PR cada
-- em fitness_personal_records.
--
-- Esta função roda APÓS o batch e mantém apenas o set mais pesado
-- por (workout, exercício) marcado como PR. Os demais sets têm
-- is_pr resetado para FALSE e os fitness_personal_records
-- redundantes são apagados.
--
-- O hook use-save-workout.ts chama esta função imediatamente
-- antes de re-ler is_pr para premiar os pts.
--
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

CREATE OR REPLACE FUNCTION fitness_dedupe_workout_prs(p_workout_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_set_ids UUID[];
  v_removed INTEGER := 0;
BEGIN
  -- Coleta IDs dos sets DUPLICADOS (todos exceto o mais pesado por exercício)
  WITH ranked AS (
    SELECT s.id,
           ROW_NUMBER() OVER (
             PARTITION BY we.exercicio_nome
             ORDER BY s.carga DESC, s.id ASC
           ) AS rn
    FROM fitness_exercise_sets s
    JOIN fitness_workout_exercises we ON s.workout_exercise_id = we.id
    WHERE we.workout_id = p_workout_id
      AND s.is_pr = TRUE
  )
  SELECT array_agg(id) INTO v_set_ids
  FROM ranked
  WHERE rn > 1;

  IF v_set_ids IS NULL OR array_length(v_set_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  v_removed := array_length(v_set_ids, 1);

  -- Desmarca is_pr nos sets duplicados
  UPDATE fitness_exercise_sets
     SET is_pr = FALSE
   WHERE id = ANY(v_set_ids);

  -- Mantém apenas o PR de maior carga por exercício no workout
  DELETE FROM fitness_personal_records pr
  WHERE pr.workout_id = p_workout_id
    AND pr.id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY exercicio_nome
          ORDER BY valor DESC, created_at ASC
        ) AS rn
        FROM fitness_personal_records
        WHERE workout_id = p_workout_id
      ) ranked
      WHERE rn > 1
    );

  RETURN v_removed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir auth users chamarem
GRANT EXECUTE ON FUNCTION fitness_dedupe_workout_prs(UUID) TO authenticated;
