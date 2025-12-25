-- FeliceFit - Migration 001: Create Tables
-- Execute este arquivo no Supabase SQL Editor

-- ============================================
-- TRIGGER FUNCTION (criar primeiro)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 1. FITNESS_PROFILES (Perfil do usuário)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  sexo VARCHAR(20), -- 'masculino', 'feminino', 'outro'
  altura_cm DECIMAL(5,2),
  peso_atual DECIMAL(5,2),
  objetivo VARCHAR(100), -- 'definicao', 'hipertrofia', 'emagrecimento', 'saude'
  nivel_atividade VARCHAR(50), -- 'sedentario', 'leve', 'moderado', 'intenso', 'atleta'
  meta_calorias_diarias INTEGER,
  meta_proteina_g INTEGER,
  meta_carboidrato_g INTEGER,
  meta_gordura_g INTEGER,
  meta_agua_ml INTEGER DEFAULT 3000,
  hora_acordar TIME DEFAULT '05:00',
  hora_dormir TIME DEFAULT '22:00',

  -- Configurações de medicamento (Revolade)
  usa_medicamento_jejum BOOLEAN DEFAULT FALSE,
  medicamento_nome VARCHAR(100),
  medicamento_horario TIME,
  medicamento_jejum_antes_horas INTEGER,
  medicamento_restricao_depois_horas INTEGER,
  medicamento_restricao_tipo VARCHAR(100),

  -- Metas específicas
  meta_peso DECIMAL(5,2),
  meta_percentual_gordura DECIMAL(5,2),
  meta_massa_muscular DECIMAL(5,2),
  data_meta DATE,

  -- Streak e gamificação
  streak_atual INTEGER DEFAULT 0,
  maior_streak INTEGER DEFAULT 0,
  pontos_totais INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fitness_profiles_updated_at
  BEFORE UPDATE ON fitness_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seu próprio perfil"
  ON fitness_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON fitness_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON fitness_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. FITNESS_EXERCISES_LIBRARY (Biblioteca de exercícios)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_exercises_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  nome_en VARCHAR(255),
  grupo_muscular VARCHAR(100) NOT NULL,
  musculos_secundarios TEXT[],
  equipamento VARCHAR(100),
  tipo VARCHAR(50),
  instrucoes TEXT,
  video_url VARCHAR(500),
  imagem_url VARCHAR(500),
  dificuldade VARCHAR(20),
  is_composto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_exercises_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver exercícios"
  ON fitness_exercises_library FOR SELECT
  USING (true);

-- ============================================
-- 3. FITNESS_WORKOUT_TEMPLATES (Templates de treino)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),
  fase VARCHAR(50),
  dia_semana INTEGER,
  duracao_estimada_min INTEGER,
  is_ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fitness_workout_templates_updated_at
  BEFORE UPDATE ON fitness_workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus templates"
  ON fitness_workout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar templates"
  ON fitness_workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus templates"
  ON fitness_workout_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus templates"
  ON fitness_workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. FITNESS_WORKOUT_TEMPLATE_EXERCISES (Exercícios do template)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES fitness_workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES fitness_exercises_library(id),
  exercicio_nome VARCHAR(255),
  ordem INTEGER NOT NULL,
  series INTEGER,
  repeticoes VARCHAR(50),
  descanso_segundos INTEGER,
  carga_sugerida DECIMAL(6,2),
  unidade_carga VARCHAR(20) DEFAULT 'kg',
  notas TEXT,
  is_superset BOOLEAN DEFAULT FALSE,
  superset_grupo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_workout_template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver exercícios de seus templates"
  ON fitness_workout_template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar exercícios em seus templates"
  ON fitness_workout_template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar exercícios de seus templates"
  ON fitness_workout_template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar exercícios de seus templates"
  ON fitness_workout_template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- 5. FITNESS_WORKOUTS (Treinos realizados)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES fitness_workout_templates(id),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  data DATE NOT NULL,
  hora_inicio TIMESTAMP WITH TIME ZONE,
  hora_fim TIMESTAMP WITH TIME ZONE,
  duracao_minutos INTEGER,
  status VARCHAR(20) DEFAULT 'pendente',
  calorias_estimadas INTEGER,
  notas TEXT,
  nivel_energia INTEGER,
  nivel_dificuldade INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fitness_workouts_updated_at
  BEFORE UPDATE ON fitness_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus treinos"
  ON fitness_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar treinos"
  ON fitness_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus treinos"
  ON fitness_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus treinos"
  ON fitness_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. FITNESS_WORKOUT_EXERCISES (Exercícios do treino realizado)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES fitness_workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES fitness_exercises_library(id),
  exercicio_nome VARCHAR(255) NOT NULL,
  ordem INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver exercícios de seus treinos"
  ON fitness_workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workouts
      WHERE id = workout_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar exercícios em seus treinos"
  ON fitness_workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_workouts
      WHERE id = workout_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar exercícios de seus treinos"
  ON fitness_workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workouts
      WHERE id = workout_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar exercícios de seus treinos"
  ON fitness_workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workouts
      WHERE id = workout_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- 7. FITNESS_EXERCISE_SETS (Séries de cada exercício)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES fitness_workout_exercises(id) ON DELETE CASCADE,
  numero_serie INTEGER NOT NULL,
  repeticoes_planejadas INTEGER,
  repeticoes_realizadas INTEGER,
  carga DECIMAL(6,2),
  unidade_carga VARCHAR(20) DEFAULT 'kg',
  tempo_segundos INTEGER,
  status VARCHAR(20) DEFAULT 'pendente',
  is_pr BOOLEAN DEFAULT FALSE,
  rpe INTEGER,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver séries de seus exercícios"
  ON fitness_exercise_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_exercises we
      JOIN fitness_workouts w ON we.workout_id = w.id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar séries em seus exercícios"
  ON fitness_exercise_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_workout_exercises we
      JOIN fitness_workouts w ON we.workout_id = w.id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar séries de seus exercícios"
  ON fitness_exercise_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_exercises we
      JOIN fitness_workouts w ON we.workout_id = w.id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar séries de seus exercícios"
  ON fitness_exercise_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_exercises we
      JOIN fitness_workouts w ON we.workout_id = w.id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. FITNESS_PERSONAL_RECORDS (Recordes pessoais)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES fitness_exercises_library(id),
  exercicio_nome VARCHAR(255) NOT NULL,
  tipo_record VARCHAR(50),
  valor DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(20),
  data_record DATE NOT NULL,
  workout_id UUID REFERENCES fitness_workouts(id),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus PRs"
  ON fitness_personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar PRs"
  ON fitness_personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus PRs"
  ON fitness_personal_records FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. FITNESS_FOODS (Banco de alimentos)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  marca VARCHAR(100),
  porcao_padrao DECIMAL(8,2) DEFAULT 100,
  unidade_porcao VARCHAR(20) DEFAULT 'g',
  calorias DECIMAL(8,2),
  proteinas DECIMAL(8,2),
  carboidratos DECIMAL(8,2),
  gorduras DECIMAL(8,2),
  fibras DECIMAL(8,2),
  sodio DECIMAL(8,2),
  categoria VARCHAR(50),
  is_favorito BOOLEAN DEFAULT FALSE,
  codigo_barras VARCHAR(50),
  imagem_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver alimentos globais e seus próprios"
  ON fitness_foods FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus alimentos"
  ON fitness_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus alimentos"
  ON fitness_foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus alimentos"
  ON fitness_foods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. FITNESS_MEALS (Refeições)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo_refeicao VARCHAR(50) NOT NULL,
  horario TIME,
  horario_planejado TIME,
  status VARCHAR(20) DEFAULT 'pendente',
  calorias_total DECIMAL(8,2),
  proteinas_total DECIMAL(8,2),
  carboidratos_total DECIMAL(8,2),
  gorduras_total DECIMAL(8,2),
  foto_url VARCHAR(500),
  analise_ia TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fitness_meals_updated_at
  BEFORE UPDATE ON fitness_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas refeições"
  ON fitness_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar refeições"
  ON fitness_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas refeições"
  ON fitness_meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas refeições"
  ON fitness_meals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 11. FITNESS_MEAL_ITEMS (Itens de cada refeição)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES fitness_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES fitness_foods(id),
  nome_alimento VARCHAR(255) NOT NULL,
  quantidade DECIMAL(8,2) NOT NULL,
  unidade VARCHAR(20) DEFAULT 'g',
  calorias DECIMAL(8,2),
  proteinas DECIMAL(8,2),
  carboidratos DECIMAL(8,2),
  gorduras DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver itens de suas refeições"
  ON fitness_meal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_meals
      WHERE id = meal_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar itens em suas refeições"
  ON fitness_meal_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_meals
      WHERE id = meal_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de suas refeições"
  ON fitness_meal_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_meals
      WHERE id = meal_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar itens de suas refeições"
  ON fitness_meal_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_meals
      WHERE id = meal_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- 12. FITNESS_WATER_LOGS (Registro de água)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quantidade_ml INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus registros de água"
  ON fitness_water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar registros de água"
  ON fitness_water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus registros de água"
  ON fitness_water_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 13. FITNESS_BODY_COMPOSITIONS (Bioimpedância)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_body_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,

  -- Dados básicos
  peso DECIMAL(5,2),
  altura_cm DECIMAL(5,2),
  idade INTEGER,

  -- Composição corporal (InBody)
  agua_corporal_l DECIMAL(5,2),
  proteina_kg DECIMAL(5,2),
  minerais_kg DECIMAL(5,2),
  massa_gordura_kg DECIMAL(5,2),

  -- Análise músculo-gordura
  massa_muscular_esqueletica_kg DECIMAL(5,2),

  -- Análise de obesidade
  imc DECIMAL(5,2),
  percentual_gordura DECIMAL(5,2),

  -- Dados adicionais InBody
  massa_muscular_esqueletica_ref_min DECIMAL(5,2),
  massa_muscular_esqueletica_ref_max DECIMAL(5,2),
  massa_livre_gordura_kg DECIMAL(5,2),
  taxa_metabolica_basal DECIMAL(8,2),
  relacao_cintura_quadril DECIMAL(4,2),
  gordura_visceral INTEGER,
  grau_obesidade DECIMAL(5,2),
  peso_ideal DECIMAL(5,2),
  controle_peso DECIMAL(5,2),
  controle_gordura DECIMAL(5,2),
  controle_muscular DECIMAL(5,2),
  pontuacao_inbody INTEGER,

  -- Análise segmentar - massa magra
  massa_magra_braco_esquerdo DECIMAL(5,2),
  massa_magra_braco_esquerdo_percent DECIMAL(5,2),
  massa_magra_braco_direito DECIMAL(5,2),
  massa_magra_braco_direito_percent DECIMAL(5,2),
  massa_magra_tronco DECIMAL(5,2),
  massa_magra_tronco_percent DECIMAL(5,2),
  massa_magra_perna_esquerda DECIMAL(5,2),
  massa_magra_perna_esquerda_percent DECIMAL(5,2),
  massa_magra_perna_direita DECIMAL(5,2),
  massa_magra_perna_direita_percent DECIMAL(5,2),

  -- Análise segmentar - gordura
  gordura_braco_esquerdo DECIMAL(5,2),
  gordura_braco_esquerdo_percent DECIMAL(5,2),
  gordura_braco_direito DECIMAL(5,2),
  gordura_braco_direito_percent DECIMAL(5,2),
  gordura_tronco DECIMAL(5,2),
  gordura_tronco_percent DECIMAL(5,2),
  gordura_perna_esquerda DECIMAL(5,2),
  gordura_perna_esquerda_percent DECIMAL(5,2),
  gordura_perna_direita DECIMAL(5,2),
  gordura_perna_direita_percent DECIMAL(5,2),

  -- Impedância (dados técnicos)
  impedancia_dados JSONB,

  -- Foto do resultado
  foto_url VARCHAR(500),

  -- Notas
  notas TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_body_compositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas bioimpedâncias"
  ON fitness_body_compositions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar bioimpedâncias"
  ON fitness_body_compositions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas bioimpedâncias"
  ON fitness_body_compositions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas bioimpedâncias"
  ON fitness_body_compositions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 14. FITNESS_PROGRESS_PHOTOS (Fotos de progresso)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo VARCHAR(50),
  foto_url VARCHAR(500) NOT NULL,
  peso_no_dia DECIMAL(5,2),
  percentual_gordura_no_dia DECIMAL(5,2),
  notas TEXT,
  is_favorita BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas fotos"
  ON fitness_progress_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar fotos"
  ON fitness_progress_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas fotos"
  ON fitness_progress_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas fotos"
  ON fitness_progress_photos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 15. FITNESS_DAILY_NOTES (Anotações diárias / Check-in)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,

  -- Check-in de bem-estar
  humor INTEGER,
  nivel_energia INTEGER,
  nivel_estresse INTEGER,
  qualidade_sono INTEGER,
  dores TEXT[],

  -- Notas
  notas TEXT,

  -- Pontuação do dia (calculada)
  pontuacao_dia INTEGER,
  treino_concluido BOOLEAN DEFAULT FALSE,
  alimentacao_ok BOOLEAN DEFAULT FALSE,
  agua_ok BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, data)
);

CREATE TRIGGER update_fitness_daily_notes_updated_at
  BEFORE UPDATE ON fitness_daily_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notas"
  ON fitness_daily_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar notas"
  ON fitness_daily_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas notas"
  ON fitness_daily_notes FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 16. FITNESS_SLEEP_LOGS (Registro de sono)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_dormir TIMESTAMP WITH TIME ZONE,
  hora_acordar TIMESTAMP WITH TIME ZONE,
  duracao_minutos INTEGER,
  qualidade INTEGER,
  fatores TEXT[],
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus registros de sono"
  ON fitness_sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar registros de sono"
  ON fitness_sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus registros de sono"
  ON fitness_sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 17. FITNESS_SUPPLEMENTS (Suplementos cadastrados)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  dosagem VARCHAR(100),
  horario_ideal TIME,
  instrucoes TEXT,
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus suplementos"
  ON fitness_supplements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suplementos"
  ON fitness_supplements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus suplementos"
  ON fitness_supplements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus suplementos"
  ON fitness_supplements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 18. FITNESS_SUPPLEMENTS_LOGS (Registro de suplementação)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_supplements_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES fitness_supplements(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tomado BOOLEAN DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_supplements_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus logs de suplementos"
  ON fitness_supplements_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar logs de suplementos"
  ON fitness_supplements_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 19. FITNESS_ACHIEVEMENTS (Conquistas disponíveis)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  icone VARCHAR(100),
  categoria VARCHAR(50),
  criterio JSONB,
  pontos INTEGER DEFAULT 10,
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver conquistas"
  ON fitness_achievements FOR SELECT
  USING (true);

-- ============================================
-- 20. FITNESS_ACHIEVEMENTS_USERS (Conquistas do usuário)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_achievements_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES fitness_achievements(id) ON DELETE CASCADE,
  data_desbloqueio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE fitness_achievements_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas conquistas"
  ON fitness_achievements_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas conquistas"
  ON fitness_achievements_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 21. FITNESS_GOALS (Metas)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),
  valor_atual DECIMAL(10,2),
  valor_meta DECIMAL(10,2),
  unidade VARCHAR(20),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_alvo DATE,
  status VARCHAR(20) DEFAULT 'ativa',
  prioridade INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fitness_goals_updated_at
  BEFORE UPDATE ON fitness_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas metas"
  ON fitness_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar metas"
  ON fitness_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas metas"
  ON fitness_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas metas"
  ON fitness_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 22. FITNESS_COACH_CONVERSATIONS (Conversas com Coach IA)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  mensagem_usuario TEXT NOT NULL,
  resposta_coach TEXT NOT NULL,
  contexto JSONB,
  tokens_usados INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas conversas"
  ON fitness_coach_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar conversas"
  ON fitness_coach_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 23. FITNESS_NOTIFICATION_SETTINGS (Configurações de notificação)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE UNIQUE,

  -- Push subscription
  push_subscription JSONB,

  -- Configurações
  notif_treino_ativo BOOLEAN DEFAULT TRUE,
  notif_treino_horario TIME DEFAULT '05:00',
  notif_agua_ativo BOOLEAN DEFAULT TRUE,
  notif_agua_intervalo_horas INTEGER DEFAULT 2,
  notif_medicamento_ativo BOOLEAN DEFAULT TRUE,
  notif_refeicao_ativo BOOLEAN DEFAULT TRUE,
  notif_sono_ativo BOOLEAN DEFAULT TRUE,
  notif_sono_horario TIME DEFAULT '22:00',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fitness_notification_settings_updated_at
  BEFORE UPDATE ON fitness_notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitness_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas configurações"
  ON fitness_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas configurações"
  ON fitness_notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas configurações"
  ON fitness_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);
