-- Adiciona 'medico_integrativo' como tipo válido em fitness_professionals
ALTER TABLE fitness_professionals DROP CONSTRAINT IF EXISTS fitness_professionals_type_check;
ALTER TABLE fitness_professionals ADD CONSTRAINT fitness_professionals_type_check
  CHECK (type IN ('nutritionist', 'trainer', 'coach', 'physiotherapist', 'admin', 'super_admin', 'medico_integrativo'));

-- Coluna de impressões clínicas na ficha viva
ALTER TABLE fitness_medical_records
  ADD COLUMN IF NOT EXISTS clinical_impressions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Tabela de exames do paciente (usado pelo médico integrativo)
CREATE TABLE IF NOT EXISTS fitness_patient_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES fitness_professionals(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exam_type TEXT NOT NULL DEFAULT 'outro',
  description TEXT,
  results TEXT NOT NULL,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_exams_patient ON fitness_patient_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_exams_date ON fitness_patient_exams(exam_date DESC);

ALTER TABLE fitness_patient_exams ENABLE ROW LEVEL SECURITY;

-- Profissionais e superadmins podem ver/criar exames
CREATE POLICY "professionals_manage_exams" ON fitness_patient_exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_fitness_patient_exams_updated_at
  BEFORE UPDATE ON fitness_patient_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
