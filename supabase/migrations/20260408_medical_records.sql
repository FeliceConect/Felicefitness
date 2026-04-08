-- ============================================================================
-- Prontuário do Superadmin — Centro de Controle por Paciente
-- ============================================================================
-- Cria duas tabelas exclusivas do superadmin:
--   1. fitness_medical_records        → ficha viva (1:1 com paciente)
--   2. fitness_medical_consultations  → snapshots de consultas (1:N)
--
-- RLS restrita a role = 'super_admin'.
-- Nenhuma alteração em tabelas existentes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. fitness_medical_records (ficha viva)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fitness_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES fitness_profiles(id) ON DELETE CASCADE,

  -- Programa
  program_name TEXT NOT NULL DEFAULT 'felice_wellness'
    CHECK (program_name IN ('felice_wellness', 'wellness_performance', 'felicita_wellness')),
  program_start_date DATE,
  program_duration_months INT NOT NULL DEFAULT 6,

  -- Atribuição Leonardo/Marinella
  assigned_super_admin_id UUID REFERENCES fitness_profiles(id) ON DELETE SET NULL,

  -- Dados estruturados (JSONB)
  objectives     JSONB NOT NULL DEFAULT '{}'::jsonb,
  health_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  lifestyle      JSONB NOT NULL DEFAULT '{}'::jsonb,
  difficulties   JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES fitness_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_medical_records_user
  ON fitness_medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_assigned
  ON fitness_medical_records(assigned_super_admin_id);

ALTER TABLE fitness_medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage medical records" ON fitness_medical_records;
CREATE POLICY "Super admins manage medical records" ON fitness_medical_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- auto-update updated_at
CREATE OR REPLACE FUNCTION fitness_update_medical_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medical_records_updated_at ON fitness_medical_records;
CREATE TRIGGER trg_medical_records_updated_at
  BEFORE UPDATE ON fitness_medical_records
  FOR EACH ROW
  EXECUTE FUNCTION fitness_update_medical_records_updated_at();

-- ----------------------------------------------------------------------------
-- 2. fitness_medical_consultations (snapshots de consultas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fitness_medical_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fitness_profiles(id) ON DELETE CASCADE,

  consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  program_name_snapshot TEXT NOT NULL,
  program_month INT, -- calculado no momento do registro

  consultation_type TEXT NOT NULL DEFAULT 'acompanhamento'
    CHECK (consultation_type IN ('inicial', 'acompanhamento', 'avaliacao', 'encerramento')),

  main_complaint  TEXT,
  evolution       TEXT,

  -- {food:1-5, workout:1-5, sleep:1-5, hydration:1-5}
  adherence       JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- {peso, medidas opcionais} — bioimpedância fica na tabela própria
  objective_data  JSONB NOT NULL DEFAULT '{}'::jsonb,

  emotional_state INT CHECK (emotional_state BETWEEN 1 AND 10),
  emotional_notes TEXT,

  team_feedback   TEXT,
  action_plan     TEXT,
  private_notes   TEXT,

  next_consultation_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES fitness_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_medical_consultations_user
  ON fitness_medical_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_consultations_date
  ON fitness_medical_consultations(consultation_date DESC);

ALTER TABLE fitness_medical_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage consultations" ON fitness_medical_consultations;
CREATE POLICY "Super admins manage consultations" ON fitness_medical_consultations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
