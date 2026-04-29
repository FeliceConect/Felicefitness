-- ============================================================
-- TRIGGERS DE AWARD AUTOMÁTICO (água, refeições, sono)
-- Data: 2026-04-29
-- ------------------------------------------------------------
-- Solução robusta para o bug recorrente de "paciente cumpriu a
-- ação mas não ganhou os pts": as fontes de inserção eram várias
-- (use-water-log, use-quick-actions, /api/client/meal-plan/complete,
-- use-daily-meals, use-sleep) e algumas esqueciam de chamar
-- awardPointsServer. Este arquivo move a lógica de award para a
-- camada de banco — independente de QUEM insere a linha, o trigger
-- credita os pts uma vez por dia.
--
-- COEXISTE com awardPointsServer no client/server: ambos checam
-- dedup por (user_id, reason, source='automatic', date) antes de
-- inserir, então não duplicam.
--
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) ÁGUA — 5 pts ao bater meta diária (meta vem do perfil)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_award_water_goal()
RETURNS TRIGGER AS $$
DECLARE
  v_total   INTEGER;
  v_goal    INTEGER;
  v_already INTEGER;
BEGIN
  -- Total de água do dia (incluindo a linha NEW que acabou de entrar)
  SELECT COALESCE(SUM(quantidade_ml), 0) INTO v_total
  FROM fitness_water_logs
  WHERE user_id = NEW.user_id AND data = NEW.data;

  -- Meta do perfil (default 2000 ml)
  SELECT COALESCE(meta_agua_ml, 2000) INTO v_goal
  FROM fitness_profiles WHERE id = NEW.user_id;

  IF v_total >= v_goal THEN
    SELECT COUNT(*) INTO v_already
    FROM fitness_point_transactions
    WHERE user_id = NEW.user_id
      AND reason = 'Meta de agua atingida'
      AND source = 'automatic'
      AND created_at::date = NEW.data;

    IF v_already = 0 THEN
      INSERT INTO fitness_point_transactions
        (user_id, points, reason, category, source)
      VALUES
        (NEW.user_id, 5, 'Meta de agua atingida', 'hydration', 'automatic');
      PERFORM fitness_award_points_to_user(NEW.user_id, 5, ARRAY['consistency']);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_award_water_goal ON fitness_water_logs;
CREATE TRIGGER trigger_auto_award_water_goal
  AFTER INSERT ON fitness_water_logs
  FOR EACH ROW EXECUTE FUNCTION fn_auto_award_water_goal();

-- ─────────────────────────────────────────────────────────────
-- 2) REFEIÇÕES — 10 pts quando atinge 3+ refeições no dia
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_award_meals_logged()
RETURNS TRIGGER AS $$
DECLARE
  v_count   INTEGER;
  v_already INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM fitness_meals
  WHERE user_id = NEW.user_id AND data = NEW.data;

  IF v_count >= 3 THEN
    SELECT COUNT(*) INTO v_already
    FROM fitness_point_transactions
    WHERE user_id = NEW.user_id
      AND reason = 'Todas refeicoes registradas'
      AND source = 'automatic'
      AND created_at::date = NEW.data;

    IF v_already = 0 THEN
      INSERT INTO fitness_point_transactions
        (user_id, points, reason, category, source)
      VALUES
        (NEW.user_id, 10, 'Todas refeicoes registradas', 'nutrition', 'automatic');
      PERFORM fitness_award_points_to_user(NEW.user_id, 10, ARRAY['nutrition']);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_award_meals_logged ON fitness_meals;
CREATE TRIGGER trigger_auto_award_meals_logged
  AFTER INSERT ON fitness_meals
  FOR EACH ROW EXECUTE FUNCTION fn_auto_award_meals_logged();

-- ─────────────────────────────────────────────────────────────
-- 3) SONO — 3 pts ao registrar sono no dia (1× por dia)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_award_sleep_logged()
RETURNS TRIGGER AS $$
DECLARE
  v_already INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_already
  FROM fitness_point_transactions
  WHERE user_id = NEW.user_id
    AND reason = 'Sono registrado'
    AND source = 'automatic'
    AND created_at::date = NEW.data;

  IF v_already = 0 THEN
    INSERT INTO fitness_point_transactions
      (user_id, points, reason, category, source)
    VALUES
      (NEW.user_id, 3, 'Sono registrado', 'sleep', 'automatic');
    PERFORM fitness_award_points_to_user(NEW.user_id, 3, ARRAY['consistency']);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_award_sleep_logged ON fitness_sleep_logs;
CREATE TRIGGER trigger_auto_award_sleep_logged
  AFTER INSERT ON fitness_sleep_logs
  FOR EACH ROW EXECUTE FUNCTION fn_auto_award_sleep_logged();
