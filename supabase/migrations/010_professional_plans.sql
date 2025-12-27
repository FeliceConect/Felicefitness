-- FeliceFit - Migration 010: Planos Alimentares e Programas de Treino
-- Execute este arquivo no Supabase SQL Editor

-- ============================================
-- PARTE 1: PLANOS ALIMENTARES (NUTRICIONISTA)
-- ============================================

-- Tabela principal de planos alimentares
CREATE TABLE IF NOT EXISTS fitness_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES fitness_professionals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES fitness_profiles(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  goal VARCHAR(100), -- 'weight_loss', 'muscle_gain', 'maintenance', 'health', 'custom'
  calories_target INTEGER,
  protein_target INTEGER, -- gramas
  carbs_target INTEGER, -- gramas
  fat_target INTEGER, -- gramas
  fiber_target INTEGER, -- gramas
  water_target INTEGER, -- ml
  duration_weeks INTEGER DEFAULT 4,
  is_template BOOLEAN DEFAULT false, -- Se é um template reutilizável
  is_active BOOLEAN DEFAULT true,
  starts_at DATE,
  ends_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dias do plano alimentar (cada dia da semana pode ter refeições diferentes)
CREATE TABLE IF NOT EXISTS fitness_meal_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES fitness_meal_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dom, 1=Seg...
  day_name VARCHAR(50), -- Nome customizado opcional "Dia de Treino", "Dia de Descanso"
  calories_target INTEGER, -- Pode variar por dia
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refeições de cada dia do plano
CREATE TABLE IF NOT EXISTS fitness_meal_plan_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_day_id UUID NOT NULL REFERENCES fitness_meal_plan_days(id) ON DELETE CASCADE,
  meal_type VARCHAR(50) NOT NULL, -- 'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'supper'
  meal_name VARCHAR(100), -- Nome customizado da refeição
  scheduled_time TIME, -- Horário sugerido
  foods JSONB DEFAULT '[]', -- Array de alimentos com quantidades
  -- Estrutura do JSONB foods:
  -- [{ "name": "Arroz integral", "quantity": 150, "unit": "g", "calories": 180, "protein": 4, "carbs": 38, "fat": 1 }]
  total_calories INTEGER,
  total_protein NUMERIC(6,2),
  total_carbs NUMERIC(6,2),
  total_fat NUMERIC(6,2),
  total_fiber NUMERIC(6,2),
  instructions TEXT, -- Instruções de preparo
  alternatives JSONB DEFAULT '[]', -- Alternativas para substituição
  is_optional BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 2: PROGRAMAS DE TREINO (PERSONAL)
-- ============================================

-- Tabela principal de programas de treino
CREATE TABLE IF NOT EXISTS fitness_training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES fitness_professionals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES fitness_profiles(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  goal VARCHAR(100), -- 'hypertrophy', 'strength', 'endurance', 'weight_loss', 'functional', 'custom'
  difficulty VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  duration_weeks INTEGER DEFAULT 4,
  days_per_week INTEGER DEFAULT 4,
  session_duration INTEGER DEFAULT 60, -- minutos
  equipment_needed JSONB DEFAULT '[]', -- ['dumbbells', 'barbell', 'cables', 'machines']
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  starts_at DATE,
  ends_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semanas do programa (para periodização)
CREATE TABLE IF NOT EXISTS fitness_training_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES fitness_training_programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name VARCHAR(100), -- "Semana de Adaptação", "Semana de Volume", "Deload"
  focus VARCHAR(100), -- 'volume', 'intensity', 'deload', 'test'
  intensity_modifier NUMERIC(3,2) DEFAULT 1.0, -- Multiplicador de carga
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dias de treino de cada semana
CREATE TABLE IF NOT EXISTS fitness_training_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES fitness_training_weeks(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_number INTEGER, -- Dia sequencial (A, B, C) - 1, 2, 3...
  name VARCHAR(100) NOT NULL, -- "Treino A - Peito e Tríceps"
  muscle_groups JSONB DEFAULT '[]', -- ['chest', 'triceps']
  estimated_duration INTEGER, -- minutos
  warmup_notes TEXT,
  cooldown_notes TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercícios de cada dia de treino
CREATE TABLE IF NOT EXISTS fitness_training_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id UUID NOT NULL REFERENCES fitness_training_days(id) ON DELETE CASCADE,
  exercise_name VARCHAR(200) NOT NULL,
  exercise_category VARCHAR(100), -- 'compound', 'isolation', 'cardio', 'warmup', 'cooldown'
  muscle_group VARCHAR(100), -- 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'
  sets INTEGER DEFAULT 3,
  reps VARCHAR(50), -- "8-12", "15", "até falha"
  rest_seconds INTEGER DEFAULT 60,
  tempo VARCHAR(20), -- "3-1-2" (excêntrica-pausa-concêntrica)
  weight_suggestion VARCHAR(100), -- "70% 1RM", "12kg", "peso corporal"
  rpe_target INTEGER CHECK (rpe_target >= 1 AND rpe_target <= 10), -- Rate of Perceived Exertion
  instructions TEXT,
  video_url TEXT,
  alternatives JSONB DEFAULT '[]', -- Exercícios alternativos
  superset_with UUID REFERENCES fitness_training_exercises(id), -- Para supersets
  is_dropset BOOLEAN DEFAULT false,
  is_warmup BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 3: ACOMPANHAMENTO E PROGRESSO
-- ============================================

-- Registro de adesão ao plano alimentar
CREATE TABLE IF NOT EXISTS fitness_meal_plan_adherence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES fitness_meal_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals_planned INTEGER DEFAULT 0,
  meals_completed INTEGER DEFAULT 0,
  adherence_percentage NUMERIC(5,2),
  calories_consumed INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meal_plan_id, client_id, date)
);

-- Registro de adesão ao programa de treino
CREATE TABLE IF NOT EXISTS fitness_training_adherence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES fitness_training_programs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  training_day_id UUID REFERENCES fitness_training_days(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  exercises_planned INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  adherence_percentage NUMERIC(5,2),
  workout_duration INTEGER, -- minutos
  notes TEXT,
  client_feedback TEXT,
  rpe_average NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, client_id, date)
);

-- ============================================
-- PARTE 4: ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meal_plans_professional ON fitness_meal_plans(professional_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_client ON fitness_meal_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_active ON fitness_meal_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_meal_plans_template ON fitness_meal_plans(is_template);

CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan ON fitness_meal_plan_days(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_meals_day ON fitness_meal_plan_meals(meal_plan_day_id);

CREATE INDEX IF NOT EXISTS idx_training_programs_professional ON fitness_training_programs(professional_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_client ON fitness_training_programs(client_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_active ON fitness_training_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_training_programs_template ON fitness_training_programs(is_template);

CREATE INDEX IF NOT EXISTS idx_training_weeks_program ON fitness_training_weeks(program_id);
CREATE INDEX IF NOT EXISTS idx_training_days_week ON fitness_training_days(week_id);
CREATE INDEX IF NOT EXISTS idx_training_exercises_day ON fitness_training_exercises(training_day_id);

CREATE INDEX IF NOT EXISTS idx_meal_adherence_plan ON fitness_meal_plan_adherence(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_adherence_client ON fitness_meal_plan_adherence(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_adherence_date ON fitness_meal_plan_adherence(date);

CREATE INDEX IF NOT EXISTS idx_training_adherence_program ON fitness_training_adherence(program_id);
CREATE INDEX IF NOT EXISTS idx_training_adherence_client ON fitness_training_adherence(client_id);
CREATE INDEX IF NOT EXISTS idx_training_adherence_date ON fitness_training_adherence(date);

-- ============================================
-- PARTE 5: RLS POLICIES
-- ============================================

ALTER TABLE fitness_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_meal_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_training_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_meal_plan_adherence ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_training_adherence ENABLE ROW LEVEL SECURITY;

-- Políticas para planos alimentares
CREATE POLICY "Professionals can manage their meal plans" ON fitness_meal_plans
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their meal plans" ON fitness_meal_plans
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all meal plans" ON fitness_meal_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Políticas para dias do plano alimentar
CREATE POLICY "Access meal plan days through plan" ON fitness_meal_plan_days
  FOR ALL USING (
    meal_plan_id IN (
      SELECT id FROM fitness_meal_plans
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
      OR client_id = auth.uid()
    )
  );

-- Políticas para refeições do plano
CREATE POLICY "Access meal plan meals through day" ON fitness_meal_plan_meals
  FOR ALL USING (
    meal_plan_day_id IN (
      SELECT d.id FROM fitness_meal_plan_days d
      JOIN fitness_meal_plans p ON d.meal_plan_id = p.id
      WHERE p.professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
      OR p.client_id = auth.uid()
    )
  );

-- Políticas para programas de treino
CREATE POLICY "Professionals can manage their training programs" ON fitness_training_programs
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their training programs" ON fitness_training_programs
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all training programs" ON fitness_training_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Políticas para semanas de treino
CREATE POLICY "Access training weeks through program" ON fitness_training_weeks
  FOR ALL USING (
    program_id IN (
      SELECT id FROM fitness_training_programs
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
      OR client_id = auth.uid()
    )
  );

-- Políticas para dias de treino
CREATE POLICY "Access training days through week" ON fitness_training_days
  FOR ALL USING (
    week_id IN (
      SELECT w.id FROM fitness_training_weeks w
      JOIN fitness_training_programs p ON w.program_id = p.id
      WHERE p.professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
      OR p.client_id = auth.uid()
    )
  );

-- Políticas para exercícios
CREATE POLICY "Access exercises through training day" ON fitness_training_exercises
  FOR ALL USING (
    training_day_id IN (
      SELECT d.id FROM fitness_training_days d
      JOIN fitness_training_weeks w ON d.week_id = w.id
      JOIN fitness_training_programs p ON w.program_id = p.id
      WHERE p.professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
      OR p.client_id = auth.uid()
    )
  );

-- Políticas para adesão ao plano alimentar
CREATE POLICY "Professionals can view client meal adherence" ON fitness_meal_plan_adherence
  FOR SELECT USING (
    meal_plan_id IN (
      SELECT id FROM fitness_meal_plans
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Clients can manage their meal adherence" ON fitness_meal_plan_adherence
  FOR ALL USING (client_id = auth.uid());

-- Políticas para adesão ao treino
CREATE POLICY "Professionals can view client training adherence" ON fitness_training_adherence
  FOR SELECT USING (
    program_id IN (
      SELECT id FROM fitness_training_programs
      WHERE professional_id IN (SELECT id FROM fitness_professionals WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Clients can manage their training adherence" ON fitness_training_adherence
  FOR ALL USING (client_id = auth.uid());

-- ============================================
-- PARTE 6: TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON fitness_meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON fitness_training_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 7: COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE fitness_meal_plans IS 'Planos alimentares criados por nutricionistas para clientes';
COMMENT ON TABLE fitness_meal_plan_days IS 'Dias da semana do plano alimentar';
COMMENT ON TABLE fitness_meal_plan_meals IS 'Refeições de cada dia do plano';
COMMENT ON TABLE fitness_training_programs IS 'Programas de treino criados por personais para clientes';
COMMENT ON TABLE fitness_training_weeks IS 'Semanas do programa de treino (periodização)';
COMMENT ON TABLE fitness_training_days IS 'Dias de treino de cada semana';
COMMENT ON TABLE fitness_training_exercises IS 'Exercícios de cada dia de treino';
COMMENT ON TABLE fitness_meal_plan_adherence IS 'Registro de adesão do cliente ao plano alimentar';
COMMENT ON TABLE fitness_training_adherence IS 'Registro de adesão do cliente ao programa de treino';

-- Lembrete para recarregar o schema do PostgREST
-- NOTIFY pgrst, 'reload schema';
