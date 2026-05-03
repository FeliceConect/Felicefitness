-- ============================================================
-- ATIVIDADE FÍSICA CONTA COMO TREINO PARA O STREAK
-- Data: 2026-05-03
-- ------------------------------------------------------------
-- Antes: streak só contava `fitness_workouts` concluídos.
-- Agora: `fitness_activities` com `duration_minutes >= 20` e
-- `intensity IN ('moderado','intenso','muito_intenso')` também
-- preserva o streak.
--
-- Idempotente.
-- ============================================================

-- Critério único — quando uma atividade conta como treino.
-- Mantido em uma função SQL para reuso entre get_user_streak
-- e o trigger de atividades.
CREATE OR REPLACE FUNCTION fn_activity_counts_as_workout(
  p_duration_minutes INTEGER,
  p_intensity TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(p_duration_minutes, 0) >= 20
     AND p_intensity IN ('moderado', 'intenso', 'muito_intenso');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────────────────────
-- 1) get_user_streak: agora também aceita atividades qualificadas
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_date DATE := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  -- Hoje
  SELECT (
    EXISTS(
      SELECT 1 FROM fitness_workouts
      WHERE user_id = p_user_id AND data = v_date AND status = 'concluido'
    )
    OR EXISTS(
      SELECT 1 FROM fitness_activities
      WHERE user_id = p_user_id
        AND date = v_date
        AND fn_activity_counts_as_workout(duration_minutes, intensity)
    )
    OR EXISTS(
      SELECT 1 FROM fitness_streak_freeze_log
      WHERE user_id = p_user_id AND used_for_date = v_date
    )
  ) INTO v_has_activity;

  IF v_has_activity THEN
    v_streak := 1;
    v_date := v_date - INTERVAL '1 day';
  ELSE
    -- Hoje ainda não cumprido: começa do dia anterior
    v_date := v_date - INTERVAL '1 day';
  END IF;

  -- Conta dias consecutivos para trás
  LOOP
    SELECT (
      EXISTS(
        SELECT 1 FROM fitness_workouts
        WHERE user_id = p_user_id AND data = v_date AND status = 'concluido'
      )
      OR EXISTS(
        SELECT 1 FROM fitness_activities
        WHERE user_id = p_user_id
          AND date = v_date
          AND fn_activity_counts_as_workout(duration_minutes, intensity)
      )
      OR EXISTS(
        SELECT 1 FROM fitness_streak_freeze_log
        WHERE user_id = p_user_id AND used_for_date = v_date
      )
    ) INTO v_has_activity;

    IF v_has_activity THEN
      v_streak := v_streak + 1;
      v_date := v_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 2) Trigger em fitness_activities — atualiza streak_atual
--    quando uma atividade qualificada é inserida (ou atualizada
--    para passar a qualificar).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_streak_from_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak INTEGER;
  v_max_streak INTEGER;
  v_qualifies_now BOOLEAN;
  v_qualified_before BOOLEAN;
BEGIN
  v_qualifies_now := fn_activity_counts_as_workout(NEW.duration_minutes, NEW.intensity);

  IF TG_OP = 'UPDATE' THEN
    v_qualified_before := fn_activity_counts_as_workout(OLD.duration_minutes, OLD.intensity);
  ELSE
    v_qualified_before := FALSE;
  END IF;

  -- Só recalcula se a linha passou a qualificar agora
  IF v_qualifies_now AND NOT v_qualified_before THEN
    v_current_streak := get_user_streak(NEW.user_id);
    SELECT maior_streak INTO v_max_streak FROM fitness_profiles WHERE id = NEW.user_id;

    UPDATE fitness_profiles
    SET
      streak_atual = v_current_streak,
      maior_streak = GREATEST(COALESCE(v_max_streak, 0), v_current_streak),
      streak_last_activity_date = NEW.date,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_streak_on_activity ON fitness_activities;
CREATE TRIGGER trigger_update_streak_on_activity
  AFTER INSERT OR UPDATE ON fitness_activities
  FOR EACH ROW EXECUTE FUNCTION update_user_streak_from_activity();

-- ─────────────────────────────────────────────────────────────
-- 3) Recalcular streak para todos os usuários que tenham
--    atividades qualificadas recentes (últimos 30 dias). Sem
--    isso, atividades já registradas antes do deploy ficariam
--    sem refletir no streak_atual.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
  v_streak INTEGER;
  v_max_streak INTEGER;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id
    FROM fitness_activities
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      AND fn_activity_counts_as_workout(duration_minutes, intensity)
  LOOP
    v_streak := get_user_streak(r.user_id);
    SELECT maior_streak INTO v_max_streak FROM fitness_profiles WHERE id = r.user_id;

    UPDATE fitness_profiles
    SET
      streak_atual = v_streak,
      maior_streak = GREATEST(COALESCE(v_max_streak, 0), v_streak),
      updated_at = NOW()
    WHERE id = r.user_id;
  END LOOP;
END $$;
