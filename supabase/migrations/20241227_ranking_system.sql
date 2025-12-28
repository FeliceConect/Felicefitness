-- FeliceFit - Ranking System (Phase 5)
-- Execute este arquivo no Supabase SQL Editor
-- Sistema de ranking anônimo para gamificação

-- ============================================
-- 1. ADICIONAR CAMPOS DE XP NO PERFIL
-- ============================================

-- Garantir que os campos de gamificação existem
ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS ranking_visivel BOOLEAN DEFAULT TRUE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS apelido_ranking VARCHAR(50);

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS ultimo_calculo_xp TIMESTAMP WITH TIME ZONE;

-- Índice para ranking
CREATE INDEX IF NOT EXISTS idx_fitness_profiles_xp ON fitness_profiles(xp_total DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_profiles_nivel ON fitness_profiles(nivel DESC);

-- ============================================
-- 2. TABELA DE HISTÓRICO DE XP
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_gained INTEGER NOT NULL,
  xp_type VARCHAR(50) NOT NULL, -- workout, meal, water, sleep, achievement, streak, etc
  source_id UUID, -- ID do treino, refeição, etc (opcional)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_history_user ON fitness_xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_date ON fitness_xp_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_type ON fitness_xp_history(xp_type);

-- RLS
ALTER TABLE fitness_xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem seu historico de XP" ON fitness_xp_history;
CREATE POLICY "Usuarios veem seu historico de XP" ON fitness_xp_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode inserir XP" ON fitness_xp_history;
CREATE POLICY "Sistema pode inserir XP" ON fitness_xp_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. TABELA DE SNAPSHOTS DE RANKING
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periodo VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
  data_referencia DATE NOT NULL,
  posicao INTEGER NOT NULL,
  xp_total INTEGER NOT NULL,
  nivel INTEGER NOT NULL,
  percentil DECIMAL(5,2), -- Ex: 95.50 = top 4.5%
  total_participantes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, periodo, data_referencia)
);

CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_user ON fitness_ranking_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_periodo ON fitness_ranking_snapshots(periodo, data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_posicao ON fitness_ranking_snapshots(periodo, data_referencia, posicao);

-- RLS
ALTER TABLE fitness_ranking_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem seu historico de ranking" ON fitness_ranking_snapshots;
CREATE POLICY "Usuarios veem seu historico de ranking" ON fitness_ranking_snapshots
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 4. FUNÇÃO PARA CALCULAR XP DO USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION calculate_user_xp(p_user_id UUID)
RETURNS INTEGER AS $$
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

  -- Refeições registradas (15 XP cada)
  SELECT COUNT(*) INTO v_meals
  FROM fitness_meals
  WHERE user_id = p_user_id;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNÇÃO PARA OBTER NÍVEL A PARTIR DO XP
-- ============================================

CREATE OR REPLACE FUNCTION get_level_from_xp(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN p_xp >= 100000 THEN 10  -- Imortal
    WHEN p_xp >= 60000 THEN 9    -- Lenda
    WHEN p_xp >= 35000 THEN 8    -- Campeão
    WHEN p_xp >= 20000 THEN 7    -- Elite
    WHEN p_xp >= 12000 THEN 6    -- Atleta
    WHEN p_xp >= 7000 THEN 5     -- Guerreiro
    WHEN p_xp >= 3500 THEN 4     -- Focado
    WHEN p_xp >= 1500 THEN 3     -- Dedicado
    WHEN p_xp >= 500 THEN 2      -- Aprendiz
    ELSE 1                        -- Iniciante
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. FUNÇÃO PARA ATUALIZAR XP DO USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION update_user_xp(p_user_id UUID)
RETURNS TABLE(xp_total INTEGER, nivel INTEGER) AS $$
DECLARE
  v_xp INTEGER;
  v_nivel INTEGER;
BEGIN
  -- Calcular XP
  v_xp := calculate_user_xp(p_user_id);
  v_nivel := get_level_from_xp(v_xp);

  -- Atualizar perfil
  UPDATE fitness_profiles
  SET
    xp_total = v_xp,
    nivel = v_nivel,
    ultimo_calculo_xp = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_xp, v_nivel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. VIEW PARA RANKING ANÔNIMO
-- ============================================

CREATE OR REPLACE VIEW fitness_ranking_view AS
SELECT
  p.id as user_id,
  ROW_NUMBER() OVER (ORDER BY p.xp_total DESC, p.created_at ASC) as posicao,
  p.xp_total,
  p.nivel,
  p.streak_atual,
  p.maior_streak,
  COALESCE(p.apelido_ranking, 'Atleta #' || SUBSTRING(p.id::TEXT, 1, 4)) as apelido,
  p.ranking_visivel,
  (SELECT COUNT(*) FROM fitness_achievements_users WHERE user_id = p.id) as total_conquistas
FROM fitness_profiles p
WHERE p.ranking_visivel = TRUE
  AND p.xp_total > 0
ORDER BY p.xp_total DESC;

-- ============================================
-- 8. FUNÇÃO PARA OBTER RANKING DO USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION get_user_ranking(p_user_id UUID)
RETURNS TABLE(
  posicao BIGINT,
  xp_total INTEGER,
  nivel INTEGER,
  percentil DECIMAL(5,2),
  total_usuarios BIGINT,
  proximo_acima_xp INTEGER,
  proximo_abaixo_xp INTEGER
) AS $$
DECLARE
  v_user_xp INTEGER;
  v_total BIGINT;
  v_posicao BIGINT;
BEGIN
  -- Atualizar XP do usuário primeiro
  PERFORM update_user_xp(p_user_id);

  -- Obter XP atualizado
  SELECT fp.xp_total INTO v_user_xp
  FROM fitness_profiles fp
  WHERE fp.id = p_user_id;

  -- Total de usuários com XP > 0
  SELECT COUNT(*) INTO v_total
  FROM fitness_profiles
  WHERE fitness_profiles.xp_total > 0;

  -- Posição do usuário
  SELECT COUNT(*) + 1 INTO v_posicao
  FROM fitness_profiles
  WHERE fitness_profiles.xp_total > v_user_xp;

  RETURN QUERY
  SELECT
    v_posicao,
    v_user_xp,
    get_level_from_xp(v_user_xp),
    CASE WHEN v_total > 0 THEN
      ROUND(((v_total - v_posicao + 1)::DECIMAL / v_total) * 100, 2)
    ELSE 100.00 END,
    v_total,
    (SELECT fp.xp_total FROM fitness_profiles fp
     WHERE fp.xp_total > v_user_xp
     ORDER BY fp.xp_total ASC LIMIT 1),
    (SELECT fp.xp_total FROM fitness_profiles fp
     WHERE fp.xp_total < v_user_xp
     ORDER BY fp.xp_total DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNÇÃO PARA OBTER TOP DO RANKING
-- ============================================

CREATE OR REPLACE FUNCTION get_ranking_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  posicao BIGINT,
  apelido TEXT,
  xp_total INTEGER,
  nivel INTEGER,
  streak_atual INTEGER,
  total_conquistas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rv.posicao,
    rv.apelido,
    rv.xp_total,
    rv.nivel,
    rv.streak_atual,
    rv.total_conquistas
  FROM fitness_ranking_view rv
  ORDER BY rv.posicao ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. TRIGGER PARA ATUALIZAR XP EM EVENTOS
-- ============================================

-- Trigger após completar treino
CREATE OR REPLACE FUNCTION trigger_update_xp_on_workout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Registrar XP
    INSERT INTO fitness_xp_history (user_id, xp_gained, xp_type, source_id, description)
    VALUES (NEW.user_id, 100, 'workout', NEW.id, 'Treino completado: ' || COALESCE(NEW.nome, 'Treino'));

    -- Atualizar XP total
    PERFORM update_user_xp(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_xp_on_workout ON fitness_workouts;
CREATE TRIGGER trg_update_xp_on_workout
  AFTER INSERT OR UPDATE ON fitness_workouts
  FOR EACH ROW EXECUTE FUNCTION trigger_update_xp_on_workout();

-- Trigger após registrar refeição
CREATE OR REPLACE FUNCTION trigger_update_xp_on_meal()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar XP
  INSERT INTO fitness_xp_history (user_id, xp_gained, xp_type, source_id, description)
  VALUES (NEW.user_id, 15, 'meal', NEW.id, 'Refeição registrada: ' || COALESCE(NEW.tipo_refeicao, 'Refeição'));

  -- Atualizar XP total
  PERFORM update_user_xp(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_xp_on_meal ON fitness_meals;
CREATE TRIGGER trg_update_xp_on_meal
  AFTER INSERT ON fitness_meals
  FOR EACH ROW EXECUTE FUNCTION trigger_update_xp_on_meal();

-- Trigger após registrar água
CREATE OR REPLACE FUNCTION trigger_update_xp_on_water()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar XP (5 por registro)
  INSERT INTO fitness_xp_history (user_id, xp_gained, xp_type, source_id, description)
  VALUES (NEW.user_id, 5, 'water', NEW.id, 'Água registrada: ' || NEW.quantidade_ml || 'ml');

  -- Atualizar XP total
  PERFORM update_user_xp(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_xp_on_water ON fitness_water_logs;
CREATE TRIGGER trg_update_xp_on_water
  AFTER INSERT ON fitness_water_logs
  FOR EACH ROW EXECUTE FUNCTION trigger_update_xp_on_water();

-- Trigger após conquista desbloqueada
CREATE OR REPLACE FUNCTION trigger_update_xp_on_achievement()
RETURNS TRIGGER AS $$
DECLARE
  v_achievement_name TEXT;
  v_achievement_points INTEGER;
BEGIN
  -- Obter dados da conquista
  SELECT nome, pontos INTO v_achievement_name, v_achievement_points
  FROM fitness_achievements
  WHERE id = NEW.achievement_id;

  -- Registrar XP
  INSERT INTO fitness_xp_history (user_id, xp_gained, xp_type, source_id, description)
  VALUES (NEW.user_id, COALESCE(v_achievement_points, 100), 'achievement', NEW.achievement_id,
          'Conquista desbloqueada: ' || COALESCE(v_achievement_name, 'Conquista'));

  -- Atualizar XP total
  PERFORM update_user_xp(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_xp_on_achievement ON fitness_achievements_users;
CREATE TRIGGER trg_update_xp_on_achievement
  AFTER INSERT ON fitness_achievements_users
  FOR EACH ROW EXECUTE FUNCTION trigger_update_xp_on_achievement();

-- ============================================
-- 11. ATUALIZAR XP DE TODOS OS USUÁRIOS EXISTENTES
-- ============================================

-- Executar uma vez para calcular XP de todos
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM fitness_profiles LOOP
    PERFORM update_user_xp(r.id);
  END LOOP;
END $$;

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON fitness_ranking_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ranking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranking_leaderboard(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_xp(UUID) TO authenticated;
