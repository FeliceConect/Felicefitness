-- ============================================================
-- ISOMETRIA + CIRCUITO 3+ EM EXERCÍCIOS
-- Data: 2026-05-06
-- ------------------------------------------------------------
-- 1) set_type: distingue séries por repetição vs por tempo
--    (isometria — ex: prancha 30s).
-- 2) circuit_group: agrupa exercícios em circuito (3+ exercícios
--    executados em sequência sem descanso entre eles).
--
-- Ambas as colunas são nullable/com default — sem quebra para
-- exercícios existentes.
--
-- Idempotente.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) set_type — 'reps' (default) | 'time' (isometria)
-- ─────────────────────────────────────────────────────────────

-- a) Séries de execução (paciente)
ALTER TABLE fitness_exercise_sets
  ADD COLUMN IF NOT EXISTS set_type TEXT DEFAULT 'reps';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'fitness_exercise_sets'
      AND constraint_name = 'fitness_exercise_sets_set_type_check'
  ) THEN
    ALTER TABLE fitness_exercise_sets
      ADD CONSTRAINT fitness_exercise_sets_set_type_check
      CHECK (set_type IN ('reps', 'time'));
  END IF;
END $$;

-- b) Template do paciente (configurado no app)
ALTER TABLE fitness_workout_template_exercises
  ADD COLUMN IF NOT EXISTS set_type TEXT DEFAULT 'reps';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'fitness_workout_template_exercises'
      AND constraint_name = 'fitness_workout_template_exercises_set_type_check'
  ) THEN
    ALTER TABLE fitness_workout_template_exercises
      ADD CONSTRAINT fitness_workout_template_exercises_set_type_check
      CHECK (set_type IN ('reps', 'time'));
  END IF;
END $$;

-- c) Programa do personal (portal)
ALTER TABLE fitness_training_exercises
  ADD COLUMN IF NOT EXISTS set_type TEXT DEFAULT 'reps';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'fitness_training_exercises'
      AND constraint_name = 'fitness_training_exercises_set_type_check'
  ) THEN
    ALTER TABLE fitness_training_exercises
      ADD CONSTRAINT fitness_training_exercises_set_type_check
      CHECK (set_type IN ('reps', 'time'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2) circuit_group — INTEGER (NULL = exercício solo)
--    Exercícios com mesmo circuit_group dentro do mesmo
--    template/workout/training_day formam um circuito (3+
--    exercícios em sequência sem descanso entre eles).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE fitness_workout_template_exercises
  ADD COLUMN IF NOT EXISTS circuit_group INTEGER;

ALTER TABLE fitness_workout_exercises
  ADD COLUMN IF NOT EXISTS circuit_group INTEGER;

ALTER TABLE fitness_training_exercises
  ADD COLUMN IF NOT EXISTS circuit_group INTEGER;

-- Índices parciais (só linhas que estão em circuito)
CREATE INDEX IF NOT EXISTS idx_template_exercises_circuit
  ON fitness_workout_template_exercises(template_id, circuit_group)
  WHERE circuit_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_exercises_circuit
  ON fitness_workout_exercises(workout_id, circuit_group)
  WHERE circuit_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_exercises_circuit
  ON fitness_training_exercises(training_day_id, circuit_group)
  WHERE circuit_group IS NOT NULL;
