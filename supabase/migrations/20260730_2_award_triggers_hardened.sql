-- ============================================================
-- TRIGGERS DE AWARD ENDURECIDOS — água / refeição / sono
-- Data: 2026-07-30
-- ------------------------------------------------------------
-- Corrige as três falhas dos triggers de award automático:
--
-- 1. DEDUP PELA CHAVE CERTA. Antes o dedup comparava
--    (created_at AT TIME ZONE SP)::date = NEW.data — ou seja, o dia em que
--    a LINHA ENTROU contra o dia do FATO. Para qualquer NEW.data ≠ hoje isso
--    nunca batia → o crédito repetia a cada inserção, para sempre. Agora o
--    dedup é a coluna reference_date (= NEW.data) com ÍNDICE ÚNICO no banco
--    (ver 20260730_1) + INSERT ... ON CONFLICT DO NOTHING. É impossível
--    duplicar, mesmo sob corrida (duplo toque / retry do PWA).
--
-- 2. JANELA DE DATA PLAUSÍVEL. Só credita para hoje ou ontem (SP). Bloqueia
--    o farm por data retroativa/futura (varrer o calendário inteiro inserindo
--    logs de 365 datas). "Ontem" é permitido porque a tela de Sono grava com
--    a data de ontem por design.
--
-- 3. SONO ESCALONADO restaurado (6/3/0 por hora de dormir). A migration
--    20260514, ao corrigir um fuso, havia revertido sem querer a regra
--    escalonada de 20260501 para 3 pts fixos. Aqui ela volta — com o dedup
--    já correto.
--
-- Pré-requisito: 20260730_1_points_dedup_foundation.sql (coluna + índices).
-- Idempotente.
-- ============================================================

-- Guarda de ordem: o ON CONFLICT abaixo depende do índice único ux_points_daily
-- (criado em 20260730_1). Sem ele, os triggers seriam criados mas o INSERT de
-- água/refeição/sono falharia em runtime (42P10), quebrando o REGISTRO, não só a
-- pontuação. Falha alto e claro se a ordem for invertida.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ux_points_daily') THEN
    RAISE EXCEPTION 'Índice ux_points_daily não existe — rode 20260730_1_points_dedup_foundation.sql ANTES desta migration.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 1) ÁGUA — 5 pts ao bater a meta diária (1× por dia de referência)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_award_water_goal()
RETURNS TRIGGER AS $$
DECLARE
  v_total    INTEGER;
  v_goal     INTEGER;
  v_today    DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inserted INTEGER;
BEGIN
  -- Janela plausível: hoje ou ontem (SP). Fora disso, registra mas não pontua.
  IF NEW.data < v_today - 1 OR NEW.data > v_today THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(quantidade_ml), 0) INTO v_total
  FROM fitness_water_logs
  WHERE user_id = NEW.user_id AND data = NEW.data;

  SELECT COALESCE(meta_agua_ml, 2000) INTO v_goal
  FROM fitness_profiles WHERE id = NEW.user_id;

  IF v_total >= v_goal THEN
    INSERT INTO fitness_point_transactions
      (user_id, points, reason, category, source, reference_date)
    VALUES
      (NEW.user_id, 5, 'Meta de agua atingida', 'hydration', 'automatic', NEW.data)
    ON CONFLICT (user_id, reason, source, reference_date) WHERE reference_id IS NULL AND source = 'automatic'
    DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 1 THEN
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
-- 2) REFEIÇÕES — 10 pts ao atingir 3+ refeições no dia (1× por dia)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_award_meals_logged()
RETURNS TRIGGER AS $$
DECLARE
  v_count    INTEGER;
  v_today    DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inserted INTEGER;
BEGIN
  IF NEW.data < v_today - 1 OR NEW.data > v_today THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM fitness_meals
  WHERE user_id = NEW.user_id AND data = NEW.data
    AND COALESCE(status, '') <> 'pulado';

  IF v_count >= 3 THEN
    INSERT INTO fitness_point_transactions
      (user_id, points, reason, category, source, reference_date)
    VALUES
      (NEW.user_id, 10, 'Todas refeicoes registradas', 'nutrition', 'automatic', NEW.data)
    ON CONFLICT (user_id, reason, source, reference_date) WHERE reference_id IS NULL AND source = 'automatic'
    DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 1 THEN
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
-- 3) SONO — escalonado por hora de dormir (6 / 3 / 0), 1× por dia
--    18:00–21:59 → 6 pts | 22:00–23:59 → 3 pts | 00:00–17:59 → 0 pts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_award_sleep_logged()
RETURNS TRIGGER AS $$
DECLARE
  v_hour     INTEGER;
  v_pts      INTEGER := 0;
  v_today    DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inserted INTEGER;
BEGIN
  -- Sem hora de dormir não dá pra avaliar a regra
  IF NEW.hora_dormir IS NULL THEN
    RETURN NEW;
  END IF;

  -- Janela plausível: hoje ou ontem (SP). A tela de Sono grava com data de
  -- ontem, então "ontem" é o caminho normal.
  IF NEW.data < v_today - 1 OR NEW.data > v_today THEN
    RETURN NEW;
  END IF;

  v_hour := EXTRACT(HOUR FROM (NEW.hora_dormir AT TIME ZONE 'America/Sao_Paulo'));

  IF v_hour >= 18 AND v_hour < 22 THEN
    v_pts := 6;   -- dormiu cedo
  ELSIF v_hour >= 22 AND v_hour <= 23 THEN
    v_pts := 3;   -- faixa intermediária
  ELSE
    v_pts := 0;   -- madrugada / dia: registra mas não pontua
  END IF;

  IF v_pts = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO fitness_point_transactions
    (user_id, points, reason, category, source, reference_date)
  VALUES
    (NEW.user_id, v_pts, 'Sono registrado', 'sleep', 'automatic', NEW.data)
  ON CONFLICT (user_id, reason, source, reference_date) WHERE reference_id IS NULL AND source = 'automatic'
  DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 1 THEN
    PERFORM fitness_award_points_to_user(NEW.user_id, v_pts, ARRAY['consistency']);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_award_sleep_logged ON fitness_sleep_logs;
CREATE TRIGGER trigger_auto_award_sleep_logged
  AFTER INSERT ON fitness_sleep_logs
  FOR EACH ROW EXECUTE FUNCTION fn_auto_award_sleep_logged();
