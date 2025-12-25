-- FeliceFit - Migration 003: Functions
-- Execute este arquivo no Supabase SQL Editor após criar as tabelas e seed

-- ============================================
-- FUNÇÃO: Calcular streak atual do usuário
-- ============================================

CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_date DATE := CURRENT_DATE;
  v_has_workout BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM fitness_workouts
      WHERE user_id = p_user_id
        AND data = v_date
        AND status = 'concluido'
    ) INTO v_has_workout;

    IF v_has_workout THEN
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
-- FUNÇÃO: Obter resumo do dia
-- ============================================

CREATE OR REPLACE FUNCTION get_daily_summary(p_user_id UUID, p_date DATE)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_profile fitness_profiles%ROWTYPE;
BEGIN
  -- Buscar perfil do usuário
  SELECT * INTO v_profile FROM fitness_profiles WHERE id = p_user_id;

  SELECT json_build_object(
    'data', p_date,
    'treino', json_build_object(
      'concluido', EXISTS(
        SELECT 1 FROM fitness_workouts
        WHERE user_id = p_user_id AND data = p_date AND status = 'concluido'
      ),
      'nome', (
        SELECT nome FROM fitness_workouts
        WHERE user_id = p_user_id AND data = p_date
        ORDER BY created_at DESC LIMIT 1
      )
    ),
    'agua', json_build_object(
      'consumido_ml', COALESCE((
        SELECT SUM(quantidade_ml) FROM fitness_water_logs
        WHERE user_id = p_user_id AND data = p_date
      ), 0),
      'meta_ml', COALESCE(v_profile.meta_agua_ml, 3000)
    ),
    'nutricao', json_build_object(
      'calorias', COALESCE((
        SELECT SUM(calorias_total) FROM fitness_meals
        WHERE user_id = p_user_id AND data = p_date AND status = 'concluido'
      ), 0),
      'proteinas', COALESCE((
        SELECT SUM(proteinas_total) FROM fitness_meals
        WHERE user_id = p_user_id AND data = p_date AND status = 'concluido'
      ), 0),
      'carboidratos', COALESCE((
        SELECT SUM(carboidratos_total) FROM fitness_meals
        WHERE user_id = p_user_id AND data = p_date AND status = 'concluido'
      ), 0),
      'gorduras', COALESCE((
        SELECT SUM(gorduras_total) FROM fitness_meals
        WHERE user_id = p_user_id AND data = p_date AND status = 'concluido'
      ), 0),
      'meta_calorias', v_profile.meta_calorias_diarias,
      'meta_proteinas', v_profile.meta_proteina_g,
      'meta_carboidratos', v_profile.meta_carboidrato_g,
      'meta_gorduras', v_profile.meta_gordura_g
    ),
    'streak', get_user_streak(p_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Obter resumo semanal
-- ============================================

CREATE OR REPLACE FUNCTION get_weekly_summary(p_user_id UUID, p_start_date DATE)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_end_date DATE := p_start_date + INTERVAL '6 days';
BEGIN
  SELECT json_build_object(
    'periodo', json_build_object(
      'inicio', p_start_date,
      'fim', v_end_date
    ),
    'treinos', json_build_object(
      'total', (
        SELECT COUNT(*) FROM fitness_workouts
        WHERE user_id = p_user_id
          AND data BETWEEN p_start_date AND v_end_date
          AND status = 'concluido'
      ),
      'duracao_total_min', COALESCE((
        SELECT SUM(duracao_minutos) FROM fitness_workouts
        WHERE user_id = p_user_id
          AND data BETWEEN p_start_date AND v_end_date
          AND status = 'concluido'
      ), 0)
    ),
    'nutricao', json_build_object(
      'media_calorias', COALESCE((
        SELECT AVG(daily_total)::DECIMAL(8,2)
        FROM (
          SELECT SUM(calorias_total) as daily_total
          FROM fitness_meals
          WHERE user_id = p_user_id
            AND data BETWEEN p_start_date AND v_end_date
            AND status = 'concluido'
          GROUP BY data
        ) t
      ), 0),
      'media_proteinas', COALESCE((
        SELECT AVG(daily_total)::DECIMAL(8,2)
        FROM (
          SELECT SUM(proteinas_total) as daily_total
          FROM fitness_meals
          WHERE user_id = p_user_id
            AND data BETWEEN p_start_date AND v_end_date
            AND status = 'concluido'
          GROUP BY data
        ) t
      ), 0)
    ),
    'agua', json_build_object(
      'total_ml', COALESCE((
        SELECT SUM(quantidade_ml) FROM fitness_water_logs
        WHERE user_id = p_user_id
          AND data BETWEEN p_start_date AND v_end_date
      ), 0),
      'media_diaria_ml', COALESCE((
        SELECT AVG(daily_total)::INTEGER
        FROM (
          SELECT SUM(quantidade_ml) as daily_total
          FROM fitness_water_logs
          WHERE user_id = p_user_id
            AND data BETWEEN p_start_date AND v_end_date
          GROUP BY data
        ) t
      ), 0)
    ),
    'prs', (
      SELECT COUNT(*) FROM fitness_personal_records
      WHERE user_id = p_user_id
        AND data_record BETWEEN p_start_date AND v_end_date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Atualizar streak do usuário
-- ============================================

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak INTEGER;
  v_max_streak INTEGER;
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Calcular streak atual
    v_current_streak := get_user_streak(NEW.user_id);

    -- Buscar maior streak
    SELECT maior_streak INTO v_max_streak FROM fitness_profiles WHERE id = NEW.user_id;

    -- Atualizar perfil
    UPDATE fitness_profiles
    SET
      streak_atual = v_current_streak,
      maior_streak = GREATEST(COALESCE(v_max_streak, 0), v_current_streak),
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar streak quando treino é concluído
DROP TRIGGER IF EXISTS trigger_update_streak ON fitness_workouts;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT OR UPDATE ON fitness_workouts
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- ============================================
-- FUNÇÃO: Detectar e criar Personal Record
-- ============================================

CREATE OR REPLACE FUNCTION check_and_create_pr()
RETURNS TRIGGER AS $$
DECLARE
  v_exercise_name VARCHAR(255);
  v_max_carga DECIMAL(6,2);
  v_workout_user_id UUID;
BEGIN
  -- Buscar user_id e nome do exercício
  SELECT w.user_id, we.exercicio_nome
  INTO v_workout_user_id, v_exercise_name
  FROM fitness_workout_exercises we
  JOIN fitness_workouts w ON we.workout_id = w.id
  WHERE we.id = NEW.workout_exercise_id;

  -- Buscar maior carga anterior para este exercício
  SELECT COALESCE(MAX(valor), 0) INTO v_max_carga
  FROM fitness_personal_records
  WHERE user_id = v_workout_user_id
    AND exercicio_nome = v_exercise_name
    AND tipo_record = 'carga_maxima';

  -- Se a carga atual é maior, criar novo PR
  IF NEW.carga > v_max_carga AND NEW.status = 'concluido' THEN
    -- Marcar série como PR
    NEW.is_pr := TRUE;

    -- Inserir novo PR
    INSERT INTO fitness_personal_records (
      user_id,
      exercise_id,
      exercicio_nome,
      tipo_record,
      valor,
      unidade,
      data_record,
      workout_id
    )
    SELECT
      v_workout_user_id,
      we.exercise_id,
      v_exercise_name,
      'carga_maxima',
      NEW.carga,
      NEW.unidade_carga,
      CURRENT_DATE,
      we.workout_id
    FROM fitness_workout_exercises we
    WHERE we.id = NEW.workout_exercise_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar PR quando série é atualizada
DROP TRIGGER IF EXISTS trigger_check_pr ON fitness_exercise_sets;
CREATE TRIGGER trigger_check_pr
  BEFORE INSERT OR UPDATE ON fitness_exercise_sets
  FOR EACH ROW EXECUTE FUNCTION check_and_create_pr();

-- ============================================
-- FUNÇÃO: Calcular totais da refeição
-- ============================================

CREATE OR REPLACE FUNCTION update_meal_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fitness_meals
  SET
    calorias_total = (
      SELECT COALESCE(SUM(calorias), 0)
      FROM fitness_meal_items
      WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
    ),
    proteinas_total = (
      SELECT COALESCE(SUM(proteinas), 0)
      FROM fitness_meal_items
      WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
    ),
    carboidratos_total = (
      SELECT COALESCE(SUM(carboidratos), 0)
      FROM fitness_meal_items
      WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
    ),
    gorduras_total = (
      SELECT COALESCE(SUM(gorduras), 0)
      FROM fitness_meal_items
      WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.meal_id, OLD.meal_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar totais da refeição
DROP TRIGGER IF EXISTS trigger_update_meal_totals_insert ON fitness_meal_items;
CREATE TRIGGER trigger_update_meal_totals_insert
  AFTER INSERT ON fitness_meal_items
  FOR EACH ROW EXECUTE FUNCTION update_meal_totals();

DROP TRIGGER IF EXISTS trigger_update_meal_totals_update ON fitness_meal_items;
CREATE TRIGGER trigger_update_meal_totals_update
  AFTER UPDATE ON fitness_meal_items
  FOR EACH ROW EXECUTE FUNCTION update_meal_totals();

DROP TRIGGER IF EXISTS trigger_update_meal_totals_delete ON fitness_meal_items;
CREATE TRIGGER trigger_update_meal_totals_delete
  AFTER DELETE ON fitness_meal_items
  FOR EACH ROW EXECUTE FUNCTION update_meal_totals();

-- ============================================
-- FUNÇÃO: Criar perfil automaticamente após signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fitness_profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNÇÃO: Buscar exercícios por nome (pesquisa)
-- ============================================

CREATE OR REPLACE FUNCTION search_exercises(p_query TEXT)
RETURNS TABLE (
  id UUID,
  nome VARCHAR(255),
  grupo_muscular VARCHAR(100),
  equipamento VARCHAR(100),
  dificuldade VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.id,
    el.nome,
    el.grupo_muscular,
    el.equipamento,
    el.dificuldade
  FROM fitness_exercises_library el
  WHERE
    el.nome ILIKE '%' || p_query || '%'
    OR el.grupo_muscular ILIKE '%' || p_query || '%'
    OR el.equipamento ILIKE '%' || p_query || '%'
  ORDER BY
    CASE WHEN el.nome ILIKE p_query || '%' THEN 0 ELSE 1 END,
    el.nome
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Obter estatísticas do usuário
-- ============================================

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'treinos', json_build_object(
      'total', (SELECT COUNT(*) FROM fitness_workouts WHERE user_id = p_user_id AND status = 'concluido'),
      'este_mes', (
        SELECT COUNT(*) FROM fitness_workouts
        WHERE user_id = p_user_id
          AND status = 'concluido'
          AND data >= DATE_TRUNC('month', CURRENT_DATE)
      ),
      'tempo_total_horas', COALESCE((
        SELECT SUM(duracao_minutos)::DECIMAL / 60
        FROM fitness_workouts
        WHERE user_id = p_user_id AND status = 'concluido'
      ), 0)
    ),
    'prs', json_build_object(
      'total', (SELECT COUNT(*) FROM fitness_personal_records WHERE user_id = p_user_id),
      'este_mes', (
        SELECT COUNT(*) FROM fitness_personal_records
        WHERE user_id = p_user_id
          AND data_record >= DATE_TRUNC('month', CURRENT_DATE)
      )
    ),
    'streak', json_build_object(
      'atual', (SELECT streak_atual FROM fitness_profiles WHERE id = p_user_id),
      'maior', (SELECT maior_streak FROM fitness_profiles WHERE id = p_user_id)
    ),
    'conquistas', json_build_object(
      'total', (SELECT COUNT(*) FROM fitness_achievements_users WHERE user_id = p_user_id),
      'pontos', (SELECT pontos_totais FROM fitness_profiles WHERE id = p_user_id)
    ),
    'peso', json_build_object(
      'atual', (SELECT peso_atual FROM fitness_profiles WHERE id = p_user_id),
      'variacao_mes', (
        SELECT peso - LAG(peso) OVER (ORDER BY data)
        FROM fitness_body_compositions
        WHERE user_id = p_user_id
        ORDER BY data DESC
        LIMIT 1
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON fitness_workouts(user_id, data);
CREATE INDEX IF NOT EXISTS idx_workouts_user_status ON fitness_workouts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON fitness_meals(user_id, data);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON fitness_water_logs(user_id, data);
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_date ON fitness_daily_notes(user_id, data);
CREATE INDEX IF NOT EXISTS idx_body_compositions_user_date ON fitness_body_compositions(user_id, data);
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON fitness_personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_library_grupo ON fitness_exercises_library(grupo_muscular);
CREATE INDEX IF NOT EXISTS idx_exercises_library_nome ON fitness_exercises_library(nome);

-- Índice para busca full-text em exercícios
CREATE INDEX IF NOT EXISTS idx_exercises_library_search
ON fitness_exercises_library
USING GIN (to_tsvector('portuguese', nome || ' ' || COALESCE(grupo_muscular, '') || ' ' || COALESCE(equipamento, '')));
