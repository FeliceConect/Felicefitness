-- ============================================================
-- PR POR SET (regra simples) + dedup function vira no-op
-- Data: 2026-04-28
-- ------------------------------------------------------------
-- Decisão de produto: PR vale 3 pts, cada set que vence o
-- histórico do exercício é um PR (sem cap, sem janela, sem
-- restrição "1 por treino"). Sets em escada (5kg → 10kg → 15kg)
-- viram 3 PRs porque cada um quebra o anterior.
--
-- Reverte o trigger da migration 20260428_pr_per_workout_exercise.sql
-- pra lógica simples original. Mantém a função
-- fitness_dedupe_workout_prs como NO-OP pra retrocompatibilidade
-- (o hook ainda chama, mas ela não faz nada).
--
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

CREATE OR REPLACE FUNCTION check_and_create_pr()
RETURNS TRIGGER AS $$
DECLARE
  v_exercise_name VARCHAR(255);
  v_max_carga DECIMAL(6,2);
  v_workout_user_id UUID;
BEGIN
  -- user e nome do exercício para este set
  SELECT w.user_id, we.exercicio_nome
  INTO v_workout_user_id, v_exercise_name
  FROM fitness_workout_exercises we
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE we.id = NEW.workout_exercise_id;

  -- MAX histórico do exercício (incluindo PRs já registrados nesta transação)
  SELECT COALESCE(MAX(valor), 0) INTO v_max_carga
  FROM fitness_personal_records
  WHERE user_id = v_workout_user_id
    AND exercicio_nome = v_exercise_name
    AND tipo_record = 'carga_maxima';

  -- Se a carga atual vence o histórico e o set foi concluído, é PR.
  IF NEW.carga > v_max_carga AND NEW.status = 'concluido' THEN
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
  ELSE
    -- Não é PR (cliente pode ter mandado is_pr=true erroneamente — corrige).
    NEW.is_pr := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_pr ON fitness_exercise_sets;
CREATE TRIGGER trigger_check_pr
  BEFORE INSERT OR UPDATE ON fitness_exercise_sets
  FOR EACH ROW EXECUTE FUNCTION check_and_create_pr();

-- Função de dedup vira NO-OP (compatibilidade com hook que ainda chama).
CREATE OR REPLACE FUNCTION fitness_dedupe_workout_prs(p_workout_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Sob a nova regra (1 PR por set), não há nada a deduplicar.
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
