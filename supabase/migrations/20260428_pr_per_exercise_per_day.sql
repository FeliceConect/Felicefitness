-- ============================================================
-- PR ÚNICO POR EXERCÍCIO POR DIA (heaviest wins)
-- Data: 2026-04-28
-- ------------------------------------------------------------
-- Regra final: cada exercício rende NO MÁXIMO 1 PR por DIA por
-- paciente (mesmo se ele fizer 2 treinos no mesmo dia com o
-- mesmo exercício). O set vencedor é o mais pesado do dia
-- naquele exercício.
--
-- Valor do PR é 3 pts (definido em points-server.ts).
--
-- Substitui as migrations anteriores:
--   - 20260428_pr_per_workout_exercise.sql (1 por treino)
--   - 20260428_pr_per_set_simple.sql (1 por set)
-- ============================================================

CREATE OR REPLACE FUNCTION check_and_create_pr()
RETURNS TRIGGER AS $$
DECLARE
  v_exercise_name      VARCHAR(255);
  v_workout_id         UUID;
  v_workout_user_id    UUID;
  v_workout_data       DATE;
  v_max_carga          DECIMAL(6,2);
  v_today_pr_set_id    UUID;
  v_today_pr_carga     DECIMAL(6,2);
BEGIN
  -- Carrega contexto do set: workout, user, data, nome do exercício
  SELECT we.workout_id, w.user_id, w.data, we.exercicio_nome
  INTO v_workout_id, v_workout_user_id, v_workout_data, v_exercise_name
  FROM fitness_workout_exercises we
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE we.id = NEW.workout_exercise_id;

  -- MAX histórico EXCLUINDO o dia atual (PRs em transição não competem com eles mesmos)
  SELECT COALESCE(MAX(valor), 0) INTO v_max_carga
  FROM fitness_personal_records
  WHERE user_id = v_workout_user_id
    AND exercicio_nome = v_exercise_name
    AND tipo_record = 'carga_maxima'
    AND data_record IS DISTINCT FROM v_workout_data;

  -- Só processa se vence histórico e set foi concluído
  IF NEW.carga > v_max_carga AND NEW.status = 'concluido' THEN
    -- Já existe set deste exercício, deste paciente, NESTE DIA marcado PR?
    -- (cobre o caso de 2 treinos no mesmo dia)
    SELECT s.id, s.carga
    INTO v_today_pr_set_id, v_today_pr_carga
    FROM fitness_exercise_sets s
    JOIN fitness_workout_exercises we2 ON s.workout_exercise_id = we2.id
    JOIN fitness_workouts w2 ON we2.workout_id = w2.id
    WHERE w2.user_id = v_workout_user_id
      AND w2.data = v_workout_data
      AND we2.exercicio_nome = v_exercise_name
      AND s.is_pr = TRUE
      AND s.id IS DISTINCT FROM NEW.id
    LIMIT 1;

    IF v_today_pr_set_id IS NULL THEN
      -- Primeiro PR deste exercício no dia
      NEW.is_pr := TRUE;
      INSERT INTO fitness_personal_records (
        user_id, exercise_id, exercicio_nome, tipo_record,
        valor, unidade, data_record, workout_id
      )
      SELECT v_workout_user_id, we.exercise_id, v_exercise_name,
             'carga_maxima', NEW.carga, NEW.unidade_carga,
             v_workout_data, we.workout_id
      FROM fitness_workout_exercises we
      WHERE we.id = NEW.workout_exercise_id;

    ELSIF NEW.carga > v_today_pr_carga THEN
      -- Set novo é mais pesado: substitui o PR do dia
      UPDATE fitness_exercise_sets SET is_pr = FALSE
       WHERE id = v_today_pr_set_id;

      DELETE FROM fitness_personal_records
       WHERE user_id = v_workout_user_id
         AND exercicio_nome = v_exercise_name
         AND data_record = v_workout_data;

      NEW.is_pr := TRUE;
      INSERT INTO fitness_personal_records (
        user_id, exercise_id, exercicio_nome, tipo_record,
        valor, unidade, data_record, workout_id
      )
      SELECT v_workout_user_id, we.exercise_id, v_exercise_name,
             'carga_maxima', NEW.carga, NEW.unidade_carga,
             v_workout_data, we.workout_id
      FROM fitness_workout_exercises we
      WHERE we.id = NEW.workout_exercise_id;
    ELSE
      -- PR existente do dia é mais pesado: este não pontua
      NEW.is_pr := FALSE;
    END IF;
  ELSE
    -- Não vence histórico ou set não concluído
    NEW.is_pr := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_pr ON fitness_exercise_sets;
CREATE TRIGGER trigger_check_pr
  BEFORE INSERT OR UPDATE ON fitness_exercise_sets
  FOR EACH ROW EXECUTE FUNCTION check_and_create_pr();

-- ────────────────────────────────────────────────────────────
-- Função pós-batch: lida com batch insert que o trigger
-- BEFORE INSERT não consegue cobrir (sets de um .insert([...])
-- não enxergam uns aos outros). Mantém só o mais pesado por
-- (user, date, exercicio) marcado como PR.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fitness_dedupe_workout_prs(p_workout_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_data DATE;
  v_set_ids UUID[];
  v_removed INTEGER := 0;
BEGIN
  SELECT user_id, data INTO v_user_id, v_data
  FROM fitness_workouts WHERE id = p_workout_id;

  IF v_user_id IS NULL THEN RETURN 0; END IF;

  -- IDs de sets PR duplicados: para cada (exercicio_nome) no mesmo
  -- (user, date), mantém só o de maior carga (rn=1) e marca os outros.
  WITH ranked AS (
    SELECT s.id,
           ROW_NUMBER() OVER (
             PARTITION BY we.exercicio_nome
             ORDER BY s.carga DESC, s.id ASC
           ) AS rn
    FROM fitness_exercise_sets s
    JOIN fitness_workout_exercises we ON s.workout_exercise_id = we.id
    JOIN fitness_workouts w ON we.workout_id = w.id
    WHERE w.user_id = v_user_id
      AND w.data = v_data
      AND s.is_pr = TRUE
  )
  SELECT array_agg(id) INTO v_set_ids
  FROM ranked WHERE rn > 1;

  IF v_set_ids IS NULL OR array_length(v_set_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  v_removed := array_length(v_set_ids, 1);

  -- Desmarca sets duplicados
  UPDATE fitness_exercise_sets SET is_pr = FALSE WHERE id = ANY(v_set_ids);

  -- Limpa fitness_personal_records — mantém só 1 por (exercicio, data) deste user
  DELETE FROM fitness_personal_records pr
  WHERE pr.user_id = v_user_id
    AND pr.data_record = v_data
    AND pr.id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY exercicio_nome
          ORDER BY valor DESC, created_at ASC
        ) AS rn
        FROM fitness_personal_records
        WHERE user_id = v_user_id AND data_record = v_data
      ) ranked
      WHERE rn > 1
    );

  RETURN v_removed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fitness_dedupe_workout_prs(UUID) TO authenticated;
