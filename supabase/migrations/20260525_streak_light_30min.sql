-- ============================================================
-- STREAK: ATIVIDADE LEVE ≥30MIN AGORA CONTA COMO DIA ATIVO
-- Data: 2026-05-25
-- ------------------------------------------------------------
-- Antes (20260503_activity_counts_as_workout): só contava
-- atividade com duração ≥20min E intensidade em
-- (moderado, intenso, muito_intenso). Caminhada leve, mesmo
-- por 1h, quebrava o streak.
--
-- Agora:
--   - intensidade moderado/intenso/muito_intenso: ≥ 20min
--   - intensidade leve:                            ≥ 30min
--
-- Mantém o streak valioso (não basta abrir o app e registrar
-- 5min de caminhada leve), mas reconhece esforço consistente
-- de baixa intensidade.
--
-- Idempotente.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_activity_counts_as_workout(
  p_duration_minutes INTEGER,
  p_intensity TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN
    (COALESCE(p_duration_minutes, 0) >= 20
     AND p_intensity IN ('moderado', 'intenso', 'muito_intenso'))
    OR
    (COALESCE(p_duration_minutes, 0) >= 30
     AND p_intensity = 'leve');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────────────────────
-- Recalcula streak_atual pra pacientes que tenham atividades leves
-- ≥30min nos últimos 30 dias — sem isso, quem perdeu streak por
-- causa da regra antiga continua zerado mesmo após o deploy.
-- (get_user_streak não muda — ela já chama fn_activity_counts_as_workout.)
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
      AND intensity = 'leve'
      AND COALESCE(duration_minutes, 0) >= 30
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
