-- ============================================================
-- FIX: TRIGGER DE SONO USAVA UTC (BUG DE TIMEZONE)
-- Data: 2026-05-14
-- ------------------------------------------------------------
-- O trigger fn_auto_award_sleep_logged comparava
--   created_at::date = NEW.data
-- mas created_at::date é UTC e NEW.data é SP. Após 21h BRT
-- (= meia-noite UTC), a comparação não bate e o dedup falha,
-- creditando pontos de sono novamente.
--
-- Os triggers de água e refeição já usavam:
--   (created_at AT TIME ZONE 'America/Sao_Paulo')::date = NEW.data
-- Apenas o de sono ficou com a versão antiga.
--
-- Idempotente.
-- ============================================================

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
    AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = NEW.data;

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

-- Trigger continua o mesmo, só refresh defensivo:
DROP TRIGGER IF EXISTS trigger_auto_award_sleep_logged ON fitness_sleep_logs;
CREATE TRIGGER trigger_auto_award_sleep_logged
  AFTER INSERT ON fitness_sleep_logs
  FOR EACH ROW EXECUTE FUNCTION fn_auto_award_sleep_logged();
