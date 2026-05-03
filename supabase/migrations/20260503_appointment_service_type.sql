-- ============================================================
-- AGENDAMENTO DE SERVIÇOS SEM PROFISSIONAL
-- Data: 2026-05-03
-- ------------------------------------------------------------
-- Para serviços do Complexo (spa capilar, relaxamento estético,
-- soroterapia) que não têm um profissional dedicado: a consulta
-- é apenas um "compromisso" do paciente para comparecer.
--
-- Mudanças:
--   - professional_id agora pode ser NULL
--   - nova coluna service_type para identificar o serviço
--   - CHECK garante que toda linha tem profissional OU serviço
--
-- Idempotente.
-- ============================================================

-- 1) Permite professional_id NULL
ALTER TABLE fitness_appointments
  ALTER COLUMN professional_id DROP NOT NULL;

-- 2) Coluna service_type
ALTER TABLE fitness_appointments
  ADD COLUMN IF NOT EXISTS service_type TEXT;

-- 3) CHECK: pelo menos um dos dois (profissional OU serviço)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'fitness_appointments'
      AND constraint_name = 'fitness_appointments_has_target_check'
  ) THEN
    ALTER TABLE fitness_appointments
      ADD CONSTRAINT fitness_appointments_has_target_check
      CHECK (professional_id IS NOT NULL OR service_type IS NOT NULL);
  END IF;
END $$;

-- 4) CHECK: se service_type setado, valor deve ser válido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'fitness_appointments'
      AND constraint_name = 'fitness_appointments_service_type_check'
  ) THEN
    ALTER TABLE fitness_appointments
      ADD CONSTRAINT fitness_appointments_service_type_check
      CHECK (service_type IS NULL OR service_type IN ('spa_capilar', 'relaxamento', 'soroterapia'));
  END IF;
END $$;

-- 5) Índice para lookups por tipo de serviço
CREATE INDEX IF NOT EXISTS idx_appointments_service_type
  ON fitness_appointments(service_type)
  WHERE service_type IS NOT NULL;
