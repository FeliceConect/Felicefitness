-- =============================================================
-- FASE 3 — Registro sem dor
-- Rodar ANTES do deploy do código da fase 3.
-- =============================================================

-- 1. Modelos de refeição do paciente ("Minhas refeições")
--    items: [{nome, food_id, quantidade, unidade, calorias, proteinas, carboidratos, gorduras}]
CREATE TABLE IF NOT EXISTS fitness_meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  tipo_refeicao VARCHAR(50),
  items JSONB NOT NULL,
  times_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON fitness_meal_templates(user_id);

ALTER TABLE fitness_meal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_templates_select_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_select_own"
  ON fitness_meal_templates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_templates_insert_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_insert_own"
  ON fitness_meal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_templates_update_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_update_own"
  ON fitness_meal_templates FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_templates_delete_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_delete_own"
  ON fitness_meal_templates FOR DELETE USING (auth.uid() = user_id);

-- 2. Fila de moderação: alimentos criados por pacientes podem ser promovidos
--    ao banco global pela nutricionista/superadmin.
ALTER TABLE fitness_user_foods
  ADD COLUMN IF NOT EXISTS promote_status VARCHAR(12) NOT NULL DEFAULT 'none'
    CHECK (promote_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE fitness_user_foods
  ADD COLUMN IF NOT EXISTS promoted_global_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_foods_promote ON fitness_user_foods(promote_status)
  WHERE promote_status = 'pending';

-- 3. Refeições PULADAS (status='pulado') não podem gerar XP.
--    a) Trigger de XP por refeição: ignora inserts de refeição pulada.
CREATE OR REPLACE FUNCTION trigger_update_xp_on_meal()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refeição pulada é registro de honestidade, não de consumo — sem XP
  IF NEW.status = 'pulado' THEN
    RETURN NEW;
  END IF;

  INSERT INTO fitness_xp_history (user_id, xp_gained, xp_type, source_id, description)
  VALUES (NEW.user_id, 15, 'meal', NEW.id, 'Refeição registrada: ' || COALESCE(NEW.tipo_refeicao, 'Refeição'));

  PERFORM update_user_xp(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--    b) Recalculo de XP total: refeições puladas fora da contagem.
--    (cópia de calculate_user_xp de 20241227_ranking_system.sql com o filtro
--    de status na contagem de refeições — manter as demais regras em sincronia
--    se aquela função mudar)
CREATE OR REPLACE FUNCTION calculate_user_xp(p_user_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp INTEGER := 0;
  v_workouts INTEGER;
  v_prs INTEGER;
  v_meals INTEGER;
  v_water_goals INTEGER;
  v_sleep_logs INTEGER;
  v_streak INTEGER;
  v_achievements INTEGER;
  v_photos INTEGER;
  v_bioimpedances INTEGER;
BEGIN
  -- Treinos completados (100 XP cada)
  SELECT COUNT(*) INTO v_workouts
  FROM fitness_workouts
  WHERE user_id = p_user_id AND status = 'completed';
  v_xp := v_xp + (v_workouts * 100);

  -- PRs (75 XP cada)
  SELECT COUNT(*) INTO v_prs
  FROM fitness_exercise_sets es
  JOIN fitness_workout_exercises we ON es.workout_exercise_id = we.id
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE w.user_id = p_user_id AND es.is_pr = TRUE;
  v_xp := v_xp + (v_prs * 75);

  -- Refeições registradas (15 XP cada) — puladas não contam
  SELECT COUNT(*) INTO v_meals
  FROM fitness_meals
  WHERE user_id = p_user_id AND COALESCE(status, 'pendente') <> 'pulado';
  v_xp := v_xp + (v_meals * 15);

  -- Dias com meta de água atingida (25 XP cada)
  SELECT COUNT(DISTINCT DATE(data)) INTO v_water_goals
  FROM fitness_water_logs w
  JOIN fitness_profiles p ON w.user_id = p.id
  WHERE w.user_id = p_user_id
  GROUP BY DATE(data)
  HAVING SUM(quantidade_ml) >= COALESCE(MAX(p.meta_agua_ml), 2000);
  v_xp := v_xp + (COALESCE(v_water_goals, 0) * 25);

  -- Logs de sono (20 XP cada)
  SELECT COUNT(*) INTO v_sleep_logs
  FROM fitness_sleep_logs
  WHERE user_id = p_user_id;
  v_xp := v_xp + (v_sleep_logs * 20);

  -- Streak atual (5 XP por dia, max 50)
  SELECT COALESCE(streak_atual, 0) INTO v_streak
  FROM fitness_profiles
  WHERE id = p_user_id;
  v_xp := v_xp + LEAST(v_streak * 5, 50);

  -- Conquistas desbloqueadas (média 100 XP cada)
  SELECT COUNT(*) INTO v_achievements
  FROM fitness_achievements_users
  WHERE user_id = p_user_id;
  v_xp := v_xp + (v_achievements * 100);

  -- Fotos de progresso (30 XP cada)
  SELECT COUNT(*) INTO v_photos
  FROM fitness_progress_photos
  WHERE user_id = p_user_id;
  v_xp := v_xp + (v_photos * 30);

  -- Bioimpedâncias (25 XP cada)
  SELECT COUNT(*) INTO v_bioimpedances
  FROM fitness_body_compositions
  WHERE user_id = p_user_id;
  v_xp := v_xp + (v_bioimpedances * 25);

  RETURN v_xp;
END;
$$ LANGUAGE plpgsql;
