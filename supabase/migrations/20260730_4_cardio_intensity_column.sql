-- ============================================================
-- PERSISTE A INTENSIDADE DO CARDIO NO TREINO
-- Data: 2026-07-30
-- ------------------------------------------------------------
-- A intensidade de um cardio feito dentro do treino (esteira/bike) só existia
-- na memória do cliente e era ENVIADA no corpo da requisição de award — o
-- servidor não tinha como reconferir. Isso permitia reivindicar pontos de
-- cardio "muito_intenso" (10 pts) para qualquer exercício, inclusive de outro
-- treino/paciente.
--
-- Passa a gravar a intensidade na própria linha do exercício do treino, para
-- que a rota de award derive os pontos DO BANCO, não do cliente.
--
-- Coluna nullable (só cardios têm) → sem quebra para exercícios de força.
-- Idempotente.
-- ============================================================

ALTER TABLE fitness_workout_exercises
  ADD COLUMN IF NOT EXISTS cardio_intensity TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fitness_workout_exercises_cardio_intensity_check'
  ) THEN
    ALTER TABLE fitness_workout_exercises
      ADD CONSTRAINT fitness_workout_exercises_cardio_intensity_check
      CHECK (cardio_intensity IS NULL
             OR cardio_intensity IN ('leve','moderado','intenso','muito_intenso'));
  END IF;
END $$;
