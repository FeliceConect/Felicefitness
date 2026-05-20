-- ============================================================
-- BACKFILL DE circuit_group EM WORKOUTS EXISTENTES
-- Data: 2026-05-20
-- ------------------------------------------------------------
-- Treinos salvos antes do fix do save (use-save-workout.ts)
-- foram gravados com circuit_group = NULL em
-- fitness_workout_exercises, mesmo quando o programa ativo do
-- profissional tem o agrupamento configurado.
--
-- Esta migration NÃO altera pontuação, datas, séries, carga,
-- PRs, status. Só preenche o METADADO circuit_group fazendo
-- match com fitness_training_exercises do programa ativo do
-- mesmo paciente por nome do exercício.
--
-- REGRAS DE MATCH (conservadoras pra evitar atribuição errada):
-- - Paciente tem exatamente 1 programa ativo (is_active=true).
-- - Exercício aparece em apenas 1 day do programa ativo (se
--   aparecer em vários dias, fica NULL — match ambíguo).
-- - circuit_group atual do workout_exercise é NULL (nunca
--   sobrescreve valor já setado).
--
-- Idempotente — pode rodar de novo sem efeito colateral.
-- ============================================================

WITH active_programs AS (
  -- Pacientes com exatamente 1 programa ativo
  SELECT client_id, MIN(id) AS program_id
  FROM fitness_training_programs
  WHERE is_active = true
  GROUP BY client_id
  HAVING COUNT(*) = 1
),
program_exercises AS (
  -- Exercícios do programa ativo com circuit_group setado
  SELECT
    ap.client_id,
    LOWER(TRIM(te.exercise_name)) AS norm_name,
    te.circuit_group,
    -- Conta quantas vezes esse nome aparece no programa ativo do paciente
    COUNT(*) OVER (PARTITION BY ap.client_id, LOWER(TRIM(te.exercise_name))) AS name_count
  FROM active_programs ap
  JOIN fitness_training_weeks tw  ON tw.program_id = ap.program_id
  JOIN fitness_training_days td   ON td.week_id = tw.id
  JOIN fitness_training_exercises te ON te.training_day_id = td.id
  WHERE te.circuit_group IS NOT NULL
),
unambiguous_matches AS (
  -- Só pega matches únicos (nome aparece em só um lugar do programa)
  SELECT DISTINCT client_id, norm_name, circuit_group
  FROM program_exercises
  WHERE name_count = 1
)
UPDATE fitness_workout_exercises we
SET circuit_group = um.circuit_group
FROM fitness_workouts w, unambiguous_matches um
WHERE we.workout_id = w.id
  AND we.circuit_group IS NULL
  AND w.user_id = um.client_id
  AND LOWER(TRIM(we.exercicio_nome)) = um.norm_name;
