-- ============================================================
-- PR TRIGGER AUTORITATIVO — fonte única de verdade no banco
-- Data: 2026-05-18
-- ------------------------------------------------------------
-- Substitui check_and_create_pr corrigindo dois problemas:
--
-- 1. Trigger antigo (003_functions.sql) não tinha branch ELSE.
--    Quando o cliente enviava is_pr=TRUE e a condição falhava,
--    o trigger NÃO desmarcava — preservava o TRUE do cliente.
--    Resultado: TODO set virava PR e ganhava 3 pts cada (após
--    o dedupe limitar a 1 por exercício/dia, ainda restava 1
--    PR falso por exercício por treino).
--
-- 2. Baseline vinha de fitness_personal_records (output do
--    próprio trigger). Quando não havia PR registrado, baseline
--    = 0 e qualquer carga > 0 virava PR. Agora baseline vem de
--    fitness_exercise_sets de dias anteriores — captura cargas
--    reais já levantadas, mesmo de dados pré-trigger.
--
-- 3. Primeira vez de um exercício (sem histórico) é BASELINE,
--    NÃO PR. PR = bater carga máxima anterior real.
--
-- NÃO mexe em histórico — só vale para sets futuros.
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
  -- Contexto do set
  SELECT we.workout_id, w.user_id, w.data, we.exercicio_nome
  INTO v_workout_id, v_workout_user_id, v_workout_data, v_exercise_name
  FROM fitness_workout_exercises we
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE we.id = NEW.workout_exercise_id;

  -- Set não concluído nunca é PR
  IF NEW.status IS DISTINCT FROM 'concluido' THEN
    NEW.is_pr := FALSE;
    RETURN NEW;
  END IF;

  -- Baseline: maior carga histórica REAL desse exercício+paciente
  -- entre sets concluídos de dias ANTERIORES. Independe de existir
  -- registro em fitness_personal_records.
  SELECT COALESCE(MAX(s.carga), 0) INTO v_max_carga
  FROM fitness_exercise_sets s
  JOIN fitness_workout_exercises we ON s.workout_exercise_id = we.id
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE w.user_id = v_workout_user_id
    AND we.exercicio_nome = v_exercise_name
    AND s.status = 'concluido'
    AND w.data < v_workout_data;

  -- Sem histórico real: primeira vez é baseline, NÃO é PR.
  IF v_max_carga = 0 THEN
    NEW.is_pr := FALSE;
    RETURN NEW;
  END IF;

  -- Não vence histórico: não é PR.
  IF NEW.carga <= v_max_carga THEN
    NEW.is_pr := FALSE;
    RETURN NEW;
  END IF;

  -- Aqui: carga > histórico. Verifica se já há PR deste exercício
  -- marcado HOJE (cobre 2 treinos no mesmo dia ou batch insert).
  SELECT s.id, s.carga INTO v_today_pr_set_id, v_today_pr_carga
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
    -- Set novo é mais pesado que o PR do dia: substitui
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
    -- PR do dia já é maior: não pontua
    NEW.is_pr := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_pr ON fitness_exercise_sets;
CREATE TRIGGER trigger_check_pr
  BEFORE INSERT OR UPDATE ON fitness_exercise_sets
  FOR EACH ROW EXECUTE FUNCTION check_and_create_pr();
