-- ============================================================
-- CARDIO PRESCRITO NO PROGRAMA DO PERSONAL
-- Data: 2026-07-01
-- ------------------------------------------------------------
-- Permite ao personal prescrever exercícios de CARDIO (esteira,
-- bike, elíptico...) dentro do programa de treino, com alvo de
-- duração, distância e intensidade — em vez de séries/reps/carga.
--
-- Antes: cardio era colocado como um exercício de força comum
-- (séries × reps), ficava estranho no app do paciente e NÃO
-- computava pontuação de cardio.
--
-- Discriminador no cliente: set_type = 'cardio'
-- (estende o CHECK que aceitava só 'reps' | 'time').
--
-- Todas as colunas são nullable — sem quebra para exercícios
-- existentes. Idempotente.
-- ============================================================

-- 1) Colunas de cardio
ALTER TABLE fitness_training_exercises
  ADD COLUMN IF NOT EXISTS cardio_type          TEXT,
  ADD COLUMN IF NOT EXISTS target_duration_min  INTEGER,
  ADD COLUMN IF NOT EXISTS target_distance_km   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS intensity            TEXT;

-- 2) set_type passa a aceitar 'cardio' (recria o CHECK de forma idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fitness_training_exercises_set_type_check'
  ) THEN
    ALTER TABLE fitness_training_exercises
      DROP CONSTRAINT fitness_training_exercises_set_type_check;
  END IF;

  ALTER TABLE fitness_training_exercises
    ADD CONSTRAINT fitness_training_exercises_set_type_check
    CHECK (set_type IN ('reps', 'time', 'cardio'));
END $$;

-- 3) intensity segue o mesmo domínio do resto do app (fitness_activities / cardio)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fitness_training_exercises_intensity_check'
  ) THEN
    ALTER TABLE fitness_training_exercises
      ADD CONSTRAINT fitness_training_exercises_intensity_check
      CHECK (intensity IS NULL OR intensity IN ('leve','moderado','intenso','muito_intenso'));
  END IF;
END $$;
