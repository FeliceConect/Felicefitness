-- ============================================================
-- BÔNUS DE STREAK NO BANCO — fonte única, à prova de fraude
-- Data: 2026-07-30
-- ------------------------------------------------------------
-- Antes, os bônus de streak (7 dias = 15 pts, 30 dias = 50 pts) eram
-- creditados pela rota /api/points/award-workout-complete, que recebia
-- `oldStreak` DO CLIENTE e o usava como único lado da transição. Bastava
-- enviar oldStreak:0 para forçar o bônus todo dia sem ter streak nenhum.
--
-- Agora o bônus é decidido no banco, no momento em que streak_atual REAL do
-- perfil cruza o limiar (7 ou 30). A transição por borda (OLD < N e NEW >= N)
-- garante que o bônus saia UMA vez por sequência — e nunca se repete enquanto
-- o streak permanece alto. Se a sequência quebra e recomeça, um novo cruzamento
-- legítimo credita de novo. Cobre também quem completa o streak por atividade
-- avulsa (não só por treino), coisa que a rota antiga não fazia.
--
-- Pré-requisito: 20260730_1 (coluna reference_date + índice único diário).
-- Idempotente.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_auto_award_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_today    DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inserted INTEGER;
BEGIN
  -- Bônus de 7 dias — só na borda de cruzamento
  IF COALESCE(OLD.streak_atual, 0) < 7 AND COALESCE(NEW.streak_atual, 0) >= 7 THEN
    INSERT INTO fitness_point_transactions
      (user_id, points, reason, category, source, reference_date)
    VALUES
      (NEW.id, 15, 'Streak de 7 dias consecutivos', 'consistency', 'automatic', v_today)
    ON CONFLICT (user_id, reason, source, reference_date) WHERE reference_id IS NULL
    DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 1 THEN
      PERFORM fitness_award_points_to_user(NEW.id, 15, ARRAY['consistency']);
    END IF;
  END IF;

  -- Bônus de 30 dias — só na borda de cruzamento
  IF COALESCE(OLD.streak_atual, 0) < 30 AND COALESCE(NEW.streak_atual, 0) >= 30 THEN
    INSERT INTO fitness_point_transactions
      (user_id, points, reason, category, source, reference_date)
    VALUES
      (NEW.id, 50, 'Streak de 30 dias consecutivos', 'consistency', 'automatic', v_today)
    ON CONFLICT (user_id, reason, source, reference_date) WHERE reference_id IS NULL
    DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 1 THEN
      PERFORM fitness_award_points_to_user(NEW.id, 50, ARRAY['consistency']);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_award_streak ON fitness_profiles;
CREATE TRIGGER trigger_auto_award_streak
  AFTER UPDATE OF streak_atual ON fitness_profiles
  FOR EACH ROW
  WHEN (OLD.streak_atual IS DISTINCT FROM NEW.streak_atual)
  EXECUTE FUNCTION fn_auto_award_streak();
