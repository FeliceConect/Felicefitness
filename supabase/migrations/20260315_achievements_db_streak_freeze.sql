-- ================================================================
-- Migration: Achievements DB + Streak Freeze (Phase 1 Community)
-- Date: 2026-03-15
-- ================================================================

-- ============================================
-- 1. Add columns to fitness_achievements
-- ============================================
ALTER TABLE fitness_achievements ADD COLUMN IF NOT EXISTS code VARCHAR(100);
ALTER TABLE fitness_achievements ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'bronze';
ALTER TABLE fitness_achievements ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;

-- Add unique constraint on code
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fitness_achievements_code_key'
  ) THEN
    ALTER TABLE fitness_achievements ADD CONSTRAINT fitness_achievements_code_key UNIQUE (code);
  END IF;
END $$;

-- ============================================
-- 2. Seed all achievement definitions (58 total)
-- ============================================
INSERT INTO fitness_achievements (id, code, nome, descricao, icone, categoria, tier, pontos, xp_reward, criterio, is_ativo) VALUES
-- STREAK (10)
(gen_random_uuid(), 'streak_3', 'Primeira Faísca', '3 dias consecutivos de atividade', '🔥', 'streak', 'bronze', 50, 50, '{"type":"streak","value":3}', true),
(gen_random_uuid(), 'streak_7', 'Semana de Fogo', '7 dias consecutivos de atividade', '🔥', 'streak', 'bronze', 50, 50, '{"type":"streak","value":7}', true),
(gen_random_uuid(), 'streak_14', 'Duas Semanas', '14 dias consecutivos de atividade', '🔥', 'streak', 'silver', 100, 100, '{"type":"streak","value":14}', true),
(gen_random_uuid(), 'streak_30', 'Mês de Ferro', '30 dias consecutivos de atividade', '🔥', 'streak', 'gold', 200, 200, '{"type":"streak","value":30}', true),
(gen_random_uuid(), 'streak_60', 'Disciplina Total', '60 dias consecutivos de atividade', '💎', 'streak', 'platinum', 350, 350, '{"type":"streak","value":60}', true),
(gen_random_uuid(), 'streak_90', 'Trimestre de Ouro', '90 dias consecutivos de atividade', '👑', 'streak', 'platinum', 350, 350, '{"type":"streak","value":90}', true),
(gen_random_uuid(), 'streak_180', 'Meio Ano Invicto', '180 dias consecutivos de atividade', '🌟', 'streak', 'diamond', 500, 500, '{"type":"streak","value":180}', true),
(gen_random_uuid(), 'streak_365', 'Ano Imortal', '365 dias consecutivos de atividade', '🔱', 'streak', 'diamond', 500, 500, '{"type":"streak","value":365}', true),
(gen_random_uuid(), 'streak_comeback', 'Fênix', 'Voltou após 7+ dias de inatividade e completou 3 dias', '🐦‍🔥', 'streak', 'silver', 100, 100, '{"type":"comeback","value":3}', true),
(gen_random_uuid(), 'streak_never_quit', 'Nunca Desistiu', 'Recuperou o streak 3 vezes após perdê-lo', '💪', 'streak', 'gold', 200, 200, '{"type":"streak_recoveries","value":3}', true),

-- WORKOUT (12)
(gen_random_uuid(), 'workout_1', 'Primeiro Treino', 'Complete seu primeiro treino', '🏋️', 'workout', 'bronze', 50, 50, '{"type":"workouts_completed","value":1}', true),
(gen_random_uuid(), 'workout_10', 'Dez Vitórias', 'Complete 10 treinos', '🏋️', 'workout', 'bronze', 50, 50, '{"type":"workouts_completed","value":10}', true),
(gen_random_uuid(), 'workout_50', 'Cinquenta Batalhas', 'Complete 50 treinos', '⚔️', 'workout', 'silver', 100, 100, '{"type":"workouts_completed","value":50}', true),
(gen_random_uuid(), 'workout_100', 'Centurião', 'Complete 100 treinos', '🛡️', 'workout', 'gold', 200, 200, '{"type":"workouts_completed","value":100}', true),
(gen_random_uuid(), 'workout_250', 'Veterano', 'Complete 250 treinos', '🎖️', 'workout', 'platinum', 350, 350, '{"type":"workouts_completed","value":250}', true),
(gen_random_uuid(), 'workout_500', 'Lenda da Academia', 'Complete 500 treinos', '🏆', 'workout', 'diamond', 500, 500, '{"type":"workouts_completed","value":500}', true),
(gen_random_uuid(), 'pr_1', 'Primeiro PR', 'Quebre seu primeiro recorde pessoal', '📈', 'workout', 'bronze', 50, 50, '{"type":"personal_records","value":1}', true),
(gen_random_uuid(), 'pr_10', 'Quebrando Limites', 'Quebre 10 recordes pessoais', '📈', 'workout', 'silver', 100, 100, '{"type":"personal_records","value":10}', true),
(gen_random_uuid(), 'pr_50', 'Sem Limites', 'Quebre 50 recordes pessoais', '🚀', 'workout', 'gold', 200, 200, '{"type":"personal_records","value":50}', true),
(gen_random_uuid(), 'early_bird', 'Madrugador', 'Complete um treino antes das 6h', '🌅', 'workout', 'silver', 100, 100, '{"type":"early_workout","time":"06:00"}', true),
(gen_random_uuid(), 'early_bird_10', 'Amanhecer de Campeão', 'Complete 10 treinos antes das 6h', '🌅', 'workout', 'gold', 200, 200, '{"type":"early_workouts","value":10}', true),
(gen_random_uuid(), 'all_sets_10', 'Perfeccionista', 'Complete todas as séries em 10 treinos', '✅', 'workout', 'silver', 100, 100, '{"type":"perfect_workouts","value":10}', true),

-- NUTRITION (8 - AI achievements removed)
(gen_random_uuid(), 'meal_1', 'Primeira Refeição', 'Registre sua primeira refeição', '🍽️', 'nutrition', 'bronze', 50, 50, '{"type":"meals_logged","value":1}', true),
(gen_random_uuid(), 'meal_50', 'Diário Alimentar', 'Registre 50 refeições', '📝', 'nutrition', 'bronze', 50, 50, '{"type":"meals_logged","value":50}', true),
(gen_random_uuid(), 'meal_200', 'Nutricionista Pessoal', 'Registre 200 refeições', '🥗', 'nutrition', 'silver', 100, 100, '{"type":"meals_logged","value":200}', true),
(gen_random_uuid(), 'meal_500', 'Mestre da Nutrição', 'Registre 500 refeições', '👨‍🍳', 'nutrition', 'gold', 200, 200, '{"type":"meals_logged","value":500}', true),
(gen_random_uuid(), 'protein_7', 'Semana Proteica', 'Atinja a meta de proteína 7 dias seguidos', '🥩', 'nutrition', 'silver', 100, 100, '{"type":"protein_streak","value":7}', true),
(gen_random_uuid(), 'protein_30', 'Mês de Proteína', 'Atinja a meta de proteína 30 dias seguidos', '💪', 'nutrition', 'gold', 200, 200, '{"type":"protein_streak","value":30}', true),
(gen_random_uuid(), 'macros_perfect', 'Macros Perfeitos', 'Fique dentro da meta de todos os macros em um dia', '🎯', 'nutrition', 'silver', 100, 100, '{"type":"perfect_macros","value":1}', true),
(gen_random_uuid(), 'macros_perfect_7', 'Semana Perfeita', 'Macros perfeitos por 7 dias seguidos', '⭐', 'nutrition', 'platinum', 350, 350, '{"type":"perfect_macros_streak","value":7}', true),

-- HYDRATION (8)
(gen_random_uuid(), 'water_1', 'Primeira Gota', 'Registre sua primeira água', '💧', 'hydration', 'bronze', 50, 50, '{"type":"water_logged","value":1}', true),
(gen_random_uuid(), 'water_goal_1', 'Hidratado', 'Atinja a meta de água pela primeira vez', '🌊', 'hydration', 'bronze', 50, 50, '{"type":"water_goals_met","value":1}', true),
(gen_random_uuid(), 'water_goal_7', 'Semana Hidratada', 'Atinja a meta de água por 7 dias seguidos', '🌊', 'hydration', 'silver', 100, 100, '{"type":"water_streak","value":7}', true),
(gen_random_uuid(), 'water_goal_30', 'Mês de Água', 'Atinja a meta de água por 30 dias seguidos', '🌊', 'hydration', 'gold', 200, 200, '{"type":"water_streak","value":30}', true),
(gen_random_uuid(), 'water_100l', '100 Litros', 'Beba um total de 100 litros de água', '🚰', 'hydration', 'silver', 100, 100, '{"type":"total_water","value":100}', true),
(gen_random_uuid(), 'water_500l', '500 Litros', 'Beba um total de 500 litros de água', '🏊', 'hydration', 'gold', 200, 200, '{"type":"total_water","value":500}', true),
(gen_random_uuid(), 'water_1000l', 'Oceano', 'Beba um total de 1000 litros de água', '🌏', 'hydration', 'platinum', 350, 350, '{"type":"total_water","value":1000}', true),
(gen_random_uuid(), 'water_overachiever', 'Super Hidratado', 'Beba 150% da meta de água em um dia', '💦', 'hydration', 'silver', 100, 100, '{"type":"water_overachieve","value":150}', true),

-- BODY (8)
(gen_random_uuid(), 'weight_1', 'Na Balança', 'Registre seu peso pela primeira vez', '⚖️', 'body', 'bronze', 50, 50, '{"type":"weight_logged","value":1}', true),
(gen_random_uuid(), 'weight_30', 'Monitoramento Constante', 'Registre seu peso 30 vezes', '📊', 'body', 'silver', 100, 100, '{"type":"weight_logged","value":30}', true),
(gen_random_uuid(), 'bio_1', 'Primeiro Scan', 'Registre sua primeira bioimpedância', '📡', 'body', 'bronze', 50, 50, '{"type":"bioimpedance_logged","value":1}', true),
(gen_random_uuid(), 'bio_12', 'Ano de Dados', 'Registre bioimpedância 12 vezes', '📈', 'body', 'gold', 200, 200, '{"type":"bioimpedance_logged","value":12}', true),
(gen_random_uuid(), 'photo_1', 'Primeira Foto', 'Tire sua primeira foto de progresso', '📷', 'body', 'bronze', 50, 50, '{"type":"progress_photos","value":1}', true),
(gen_random_uuid(), 'photo_12', 'Documentarista', 'Tire 12 fotos de progresso', '🎬', 'body', 'silver', 100, 100, '{"type":"progress_photos","value":12}', true),
(gen_random_uuid(), 'muscle_gained', 'Ganho de Massa', 'Ganhe 2kg de massa muscular', '💪', 'body', 'gold', 200, 200, '{"type":"muscle_gained","value":2}', true),
(gen_random_uuid(), 'fat_lost', 'Definição', 'Perca 3% de gordura corporal', '🔥', 'body', 'gold', 200, 200, '{"type":"fat_lost","value":3}', true),

-- CONSISTENCY (7)
(gen_random_uuid(), 'checkin_1', 'Primeiro Check-in', 'Faça seu primeiro check-in diário', '✨', 'consistency', 'bronze', 50, 50, '{"type":"checkins","value":1}', true),
(gen_random_uuid(), 'checkin_30', 'Hábito Formado', 'Faça 30 check-ins diários', '🌟', 'consistency', 'silver', 100, 100, '{"type":"checkins","value":30}', true),
(gen_random_uuid(), 'checkin_100', 'Consistência', 'Faça 100 check-ins diários', '💫', 'consistency', 'gold', 200, 200, '{"type":"checkins","value":100}', true),
(gen_random_uuid(), 'perfect_day_1', 'Dia Perfeito', 'Alcance pontuação 100 em um dia', '💯', 'consistency', 'silver', 100, 100, '{"type":"perfect_days","value":1}', true),
(gen_random_uuid(), 'perfect_day_7', 'Semana Perfeita', 'Tenha 7 dias perfeitos', '🌈', 'consistency', 'gold', 200, 200, '{"type":"perfect_days","value":7}', true),
(gen_random_uuid(), 'perfect_streak_3', 'Tripla Perfeição', '3 dias perfeitos consecutivos', '⭐', 'consistency', 'gold', 200, 200, '{"type":"perfect_day_streak","value":3}', true),
(gen_random_uuid(), 'perfect_streak_7', 'Semana Invicta', '7 dias perfeitos consecutivos', '👑', 'consistency', 'diamond', 500, 500, '{"type":"perfect_day_streak","value":7}', true),

-- SPECIAL (5)
(gen_random_uuid(), 'medicamento_7', 'Medicamento Certeiro', 'Tome seu medicamento no horário por 7 dias seguidos', '💊', 'special', 'silver', 100, 100, '{"type":"medicamento_streak","value":7}', true),
(gen_random_uuid(), 'medicamento_30', 'Mestre do Horário', 'Tome seu medicamento no horário por 30 dias seguidos', '⏰', 'special', 'gold', 200, 200, '{"type":"medicamento_streak","value":30}', true),
(gen_random_uuid(), 'level_5', 'Guerreiro', 'Alcance o nível 5', '⚔️', 'special', 'silver', 100, 100, '{"type":"level","value":5}', true),
(gen_random_uuid(), 'level_10', 'Imortal', 'Alcance o nível máximo', '🔱', 'special', 'diamond', 500, 500, '{"type":"level","value":10}', true),
(gen_random_uuid(), 'all_achievements', 'Completista', 'Desbloqueie todas as outras conquistas', '🎮', 'special', 'diamond', 500, 500, '{"type":"all_achievements"}', true)
ON CONFLICT (code) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone,
  categoria = EXCLUDED.categoria,
  tier = EXCLUDED.tier,
  pontos = EXCLUDED.pontos,
  xp_reward = EXCLUDED.xp_reward,
  criterio = EXCLUDED.criterio;

-- ============================================
-- 3. Add streak freeze columns to fitness_profiles
-- ============================================
ALTER TABLE fitness_profiles ADD COLUMN IF NOT EXISTS streak_freeze_used INTEGER DEFAULT 0;
ALTER TABLE fitness_profiles ADD COLUMN IF NOT EXISTS streak_freeze_month VARCHAR(7);
ALTER TABLE fitness_profiles ADD COLUMN IF NOT EXISTS streak_last_activity_date DATE;

-- ============================================
-- 4. Create streak freeze log table
-- ============================================
CREATE TABLE IF NOT EXISTS fitness_streak_freeze_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  used_for_date DATE NOT NULL,
  streak_at_time INTEGER DEFAULT 0,
  month_year VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, used_for_date)
);

-- RLS
ALTER TABLE fitness_streak_freeze_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own freeze log"
  ON fitness_streak_freeze_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freeze log"
  ON fitness_streak_freeze_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_streak_freeze_log_user
  ON fitness_streak_freeze_log(user_id, used_for_date);

-- ============================================
-- 5. Update get_user_streak() to account for freezes
-- ============================================
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_date DATE := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  -- Check today first
  SELECT (
    EXISTS(
      SELECT 1 FROM fitness_workouts
      WHERE user_id = p_user_id AND data = v_date AND status = 'concluido'
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
    -- Today not done yet, start counting from yesterday
    v_date := v_date - INTERVAL '1 day';
  END IF;

  -- Count consecutive days backwards
  LOOP
    SELECT (
      EXISTS(
        SELECT 1 FROM fitness_workouts
        WHERE user_id = p_user_id AND data = v_date AND status = 'concluido'
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

-- ============================================
-- 6. Update trigger to also set last_activity_date
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak INTEGER;
  v_max_streak INTEGER;
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    v_current_streak := get_user_streak(NEW.user_id);
    SELECT maior_streak INTO v_max_streak FROM fitness_profiles WHERE id = NEW.user_id;

    UPDATE fitness_profiles
    SET
      streak_atual = v_current_streak,
      maior_streak = GREATEST(COALESCE(v_max_streak, 0), v_current_streak),
      streak_last_activity_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RPC: Get user's unlocked achievement codes
-- ============================================
CREATE OR REPLACE FUNCTION get_user_achievement_codes()
RETURNS TABLE(code VARCHAR, unlocked_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT fa.code, fau.data_desbloqueio
  FROM fitness_achievements_users fau
  JOIN fitness_achievements fa ON fa.id = fau.achievement_id
  WHERE fau.user_id = auth.uid()
  AND fa.code IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. RPC: Unlock achievement by code
-- ============================================
CREATE OR REPLACE FUNCTION unlock_achievement_by_code(p_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement_id UUID;
BEGIN
  SELECT id INTO v_achievement_id
  FROM fitness_achievements
  WHERE code = p_code AND is_ativo = true;

  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO fitness_achievements_users (user_id, achievement_id, data_desbloqueio)
  VALUES (auth.uid(), v_achievement_id, NOW())
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RPC: Recalculate streak (called after freeze)
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_my_streak()
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_streak := get_user_streak(v_user_id);

  UPDATE fitness_profiles
  SET
    streak_atual = v_streak,
    maior_streak = GREATEST(COALESCE(maior_streak, 0), v_streak),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
