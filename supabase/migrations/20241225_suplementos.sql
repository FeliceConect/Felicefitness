-- Suplementos table
CREATE TABLE IF NOT EXISTS suplementos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'vitamina',
  dosagem TEXT NOT NULL,
  frequencia TEXT NOT NULL DEFAULT 'diario',
  horarios TEXT[] NOT NULL DEFAULT ARRAY['08:00'],
  dias_semana INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  com_refeicao TEXT DEFAULT 'indiferente',
  prioridade TEXT DEFAULT 'media',
  cor TEXT DEFAULT '#3B82F6',
  quantidade_estoque INTEGER DEFAULT 0,
  alerta_estoque_minimo INTEGER DEFAULT 10,
  restricoes TEXT[] DEFAULT ARRAY[]::TEXT[],
  notas TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement logs table
CREATE TABLE IF NOT EXISTS suplemento_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES suplementos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revolade settings table (for Leonardo's special medication)
CREATE TABLE IF NOT EXISTS revolade_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jejum_inicio TEXT NOT NULL DEFAULT '22:00',
  revolade_horario TEXT NOT NULL DEFAULT '06:00',
  restricao_laticinios_fim TEXT NOT NULL DEFAULT '10:00',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE suplementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE suplemento_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revolade_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suplementos
CREATE POLICY "Users can view own supplements"
  ON suplementos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplements"
  ON suplementos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplements"
  ON suplementos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplements"
  ON suplementos FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for suplemento_logs
CREATE POLICY "Users can view own supplement logs"
  ON suplemento_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplement logs"
  ON suplemento_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplement logs"
  ON suplemento_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplement logs"
  ON suplemento_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for revolade_settings
CREATE POLICY "Users can view own revolade settings"
  ON revolade_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revolade settings"
  ON revolade_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revolade settings"
  ON revolade_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suplementos_user_id ON suplementos(user_id);
CREATE INDEX IF NOT EXISTS idx_suplementos_ativo ON suplementos(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_suplemento_logs_user_date ON suplemento_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_suplemento_logs_supplement ON suplemento_logs(supplement_id, date);

-- Updated at trigger for suplementos
CREATE OR REPLACE FUNCTION update_suplementos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suplementos_updated_at
  BEFORE UPDATE ON suplementos
  FOR EACH ROW
  EXECUTE FUNCTION update_suplementos_updated_at();

-- Updated at trigger for revolade_settings
CREATE TRIGGER revolade_settings_updated_at
  BEFORE UPDATE ON revolade_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_suplementos_updated_at();

-- Seed data for Leonardo's supplements (will be inserted on first login)
-- This is just for reference, actual seeding should be done via application
/*
INSERT INTO suplementos (user_id, nome, tipo, dosagem, horarios, com_refeicao, prioridade, cor, quantidade_estoque, restricoes, notas)
VALUES
  -- Revolade (medicamento para trombocitopenia)
  ('USER_ID', 'Revolade', 'medicamento', '50mg', ARRAY['06:00'], 'jejum', 'alta', '#EF4444', 30,
   ARRAY['laticínios', 'cálcio', 'antiácidos'], 'Tomar 4h após última refeição e 2h antes do café'),

  -- Whey Protein
  ('USER_ID', 'Whey Protein', 'proteina', '30g (1 scoop)', ARRAY['07:00', '16:00'], 'indiferente', 'media', '#8B5CF6', 900,
   ARRAY[]::TEXT[], 'Pós-treino ou entre refeições'),

  -- Creatina
  ('USER_ID', 'Creatina', 'performance', '5g', ARRAY['07:00'], 'indiferente', 'media', '#F59E0B', 300,
   ARRAY[]::TEXT[], 'Tomar todo dia, horário flexível'),

  -- Omega 3
  ('USER_ID', 'Omega 3', 'saude', '1000mg (2 cápsulas)', ARRAY['12:00'], 'com_gordura', 'media', '#06B6D4', 60,
   ARRAY[]::TEXT[], 'Tomar com refeição principal'),

  -- Vitamina D
  ('USER_ID', 'Vitamina D3', 'vitamina', '5000 UI', ARRAY['12:00'], 'com_gordura', 'media', '#FBBF24', 60,
   ARRAY['cálcio', 'laticínios'], 'Tomar com gordura para melhor absorção'),

  -- Magnésio
  ('USER_ID', 'Magnésio Dimalato', 'mineral', '300mg', ARRAY['22:00'], 'indiferente', 'media', '#10B981', 60,
   ARRAY[]::TEXT[], 'Tomar antes de dormir para melhor sono')
;
*/
