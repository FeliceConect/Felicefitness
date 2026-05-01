-- ============================================================
-- SONO COM PONTUAÇÃO ESCALONADA POR HORA DE DORMIR
-- Data: 2026-05-01
-- ------------------------------------------------------------
-- Decisão de produto: encorajar dormir cedo via gamificação.
--
-- Faixas (hora de dormir em horário BR):
--   • 18:00–21:59  → 6 pts (dormir cedo, máximo)
--   • 22:00–23:59  → 3 pts (faixa intermediária)
--   • 00:00–17:59  → 0 pts (registra mas não pontua)
--
-- Sem hora_dormir registrada também = 0 pts.
--
-- Substitui a regra anterior (3 pts fixos por registrar sono).
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_auto_award_sleep_logged()
RETURNS TRIGGER AS $$
DECLARE
  v_already INTEGER;
  v_pts     INTEGER := 0;
  v_hour    INTEGER;
BEGIN
  -- Sem hora_dormir, não dá pra avaliar a regra
  IF NEW.hora_dormir IS NULL THEN
    RETURN NEW;
  END IF;

  -- Hora local BR em que o paciente foi dormir
  v_hour := EXTRACT(HOUR FROM (NEW.hora_dormir AT TIME ZONE 'America/Sao_Paulo'));

  -- Decide pontos pela faixa
  IF v_hour >= 18 AND v_hour < 22 THEN
    v_pts := 6;   -- dormiu cedo
  ELSIF v_hour >= 22 AND v_hour <= 23 THEN
    v_pts := 3;   -- faixa intermediária
  ELSE
    v_pts := 0;   -- madrugada / dia: registra mas não pontua
  END IF;

  -- Sem pts a creditar, sai
  IF v_pts = 0 THEN
    RETURN NEW;
  END IF;

  -- Dedup diário (mesmo dia BR já recebeu pts de sono?)
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
      (NEW.user_id, v_pts, 'Sono registrado', 'sleep', 'automatic');
    PERFORM fitness_award_points_to_user(NEW.user_id, v_pts, ARRAY['consistency']);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mantém o trigger amarrado em fitness_sleep_logs AFTER INSERT
DROP TRIGGER IF EXISTS trigger_auto_award_sleep_logged ON fitness_sleep_logs;
CREATE TRIGGER trigger_auto_award_sleep_logged
  AFTER INSERT ON fitness_sleep_logs
  FOR EACH ROW EXECUTE FUNCTION fn_auto_award_sleep_logged();
