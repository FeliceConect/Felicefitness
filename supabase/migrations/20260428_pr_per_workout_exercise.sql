-- ============================================================
-- PR APENAS UMA VEZ POR EXERCÍCIO POR TREINO (heaviest wins)
-- Data: 2026-04-28
-- ------------------------------------------------------------
-- Reescreve o trigger check_and_create_pr definido em 003_functions.sql
--
-- Bug anterior: dentro do mesmo treino, sets em escada
-- (5kg → 10kg → 15kg → 20kg do mesmo exercício) eram TODOS
-- marcados como Personal Record porque cada um vencia o anterior.
-- Resultado: 1 exercício podia gerar 4-5 PRs/treino e inflar a
-- pontuação ("+10 pts" repetido várias vezes pro mesmo treino).
--
-- Comportamento novo:
--   • Considera PR apenas o set mais pesado do exercício no treino
--     (e somente se vencer o MAX histórico fora deste treino).
--   • Quando um set mais pesado entra dentro do treino, ele
--     "substitui" o PR anterior — desmarca o set antigo, apaga
--     seu registro em fitness_personal_records e cria um novo.
--
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

CREATE OR REPLACE FUNCTION check_and_create_pr()
RETURNS TRIGGER AS $$
DECLARE
  v_exercise_name      VARCHAR(255);
  v_workout_id         UUID;
  v_workout_user_id    UUID;
  v_max_carga          DECIMAL(6,2);
  v_workout_pr_set_id  UUID;
  v_workout_pr_carga   DECIMAL(6,2);
BEGIN
  -- workout, user e nome do exercício para este set
  SELECT we.workout_id, w.user_id, we.exercicio_nome
  INTO v_workout_id, v_workout_user_id, v_exercise_name
  FROM fitness_workout_exercises we
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE we.id = NEW.workout_exercise_id;

  -- MAX histórico EXCLUINDO este treino (para não competir com
  -- PR que pode estar em transição dentro do próprio treino)
  SELECT COALESCE(MAX(valor), 0) INTO v_max_carga
  FROM fitness_personal_records
  WHERE user_id = v_workout_user_id
    AND exercicio_nome = v_exercise_name
    AND tipo_record = 'carga_maxima'
    AND workout_id IS DISTINCT FROM v_workout_id;

  -- Só pontua se a carga vence o histórico e o set foi concluído
  IF NEW.carga > v_max_carga AND NEW.status = 'concluido' THEN
    -- Existe outro set deste mesmo exercício neste treino marcado como PR?
    SELECT s.id, s.carga
    INTO v_workout_pr_set_id, v_workout_pr_carga
    FROM fitness_exercise_sets s
    JOIN fitness_workout_exercises we2 ON s.workout_exercise_id = we2.id
    WHERE we2.workout_id = v_workout_id
      AND we2.exercicio_nome = v_exercise_name
      AND s.is_pr = TRUE
      AND s.id IS DISTINCT FROM NEW.id
    LIMIT 1;

    IF v_workout_pr_set_id IS NULL THEN
      -- Primeiro PR deste exercício no treino
      NEW.is_pr := TRUE;

      INSERT INTO fitness_personal_records (
        user_id, exercise_id, exercicio_nome, tipo_record,
        valor, unidade, data_record, workout_id
      )
      SELECT
        v_workout_user_id, we.exercise_id, v_exercise_name,
        'carga_maxima', NEW.carga, NEW.unidade_carga,
        CURRENT_DATE, we.workout_id
      FROM fitness_workout_exercises we
      WHERE we.id = NEW.workout_exercise_id;

    ELSIF NEW.carga > v_workout_pr_carga THEN
      -- Set novo é mais pesado que o PR atual do treino: substitui.
      UPDATE fitness_exercise_sets
         SET is_pr = FALSE
       WHERE id = v_workout_pr_set_id;

      DELETE FROM fitness_personal_records
       WHERE user_id = v_workout_user_id
         AND exercicio_nome = v_exercise_name
         AND workout_id = v_workout_id;

      NEW.is_pr := TRUE;

      INSERT INTO fitness_personal_records (
        user_id, exercise_id, exercicio_nome, tipo_record,
        valor, unidade, data_record, workout_id
      )
      SELECT
        v_workout_user_id, we.exercise_id, v_exercise_name,
        'carga_maxima', NEW.carga, NEW.unidade_carga,
        CURRENT_DATE, we.workout_id
      FROM fitness_workout_exercises we
      WHERE we.id = NEW.workout_exercise_id;
    END IF;
    -- else: NEW.carga <= v_workout_pr_carga → set existente continua sendo o PR.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O trigger continua amarrado em fitness_exercise_sets BEFORE INSERT/UPDATE
-- (definição original em 003_functions.sql).
DROP TRIGGER IF EXISTS trigger_check_pr ON fitness_exercise_sets;
CREATE TRIGGER trigger_check_pr
  BEFORE INSERT OR UPDATE ON fitness_exercise_sets
  FOR EACH ROW EXECUTE FUNCTION check_and_create_pr();
